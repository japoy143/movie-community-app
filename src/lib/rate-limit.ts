import "server-only";
import { lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { actionRateLimit, rateLimit as authRateLimit } from "@/db/schema";
import { createLogger } from "@/lib/logger";

export { getClientIp } from "@/lib/ip";

const log = createLogger("rate-limit");

/** Counters older than this are dead (every window is shorter). */
const STALE_AFTER_SECONDS = 2 * 86_400;
/** Roughly one call in this many also prunes stale rows. */
const CLEANUP_EVERY = 200;

type Options = {
  max: number;
  windowSeconds: number;
  /**
   * Deny when the limiter itself fails. Use for abuse-prone writes
   * (comments, minting guest ids); leave off where an outage shouldn't
   * block harmless actions.
   */
  failClosed?: boolean;
};

/**
 * Fixed-window rate limit stored in Postgres. One atomic upsert per call
 * (works on the neon-http driver, which has no transactions).
 * Returns true when the call is allowed.
 */
export async function rateLimit(
  key: string,
  { max, windowSeconds, failClosed = false }: Options,
): Promise<boolean> {
  try {
    const [row] = await db
      .insert(actionRateLimit)
      .values({ key, count: 1, windowStart: sql`now()` })
      .onConflictDoUpdate({
        target: actionRateLimit.key,
        set: {
          count: sql`case when ${actionRateLimit.windowStart} < now() - make_interval(secs => ${windowSeconds}) then 1 else ${actionRateLimit.count} + 1 end`,
          windowStart: sql`case when ${actionRateLimit.windowStart} < now() - make_interval(secs => ${windowSeconds}) then now() else ${actionRateLimit.windowStart} end`,
        },
      })
      .returning({ count: actionRateLimit.count });

    if (Math.random() < 1 / CLEANUP_EVERY) void pruneStaleCounters();

    const allowed = (row?.count ?? 0) <= max;
    if (!allowed) log.warn("rate limited", { key: redactKey(key) });
    return allowed;
  } catch (error) {
    log.error("rate limit check failed", { key: redactKey(key), failClosed, error });
    return !failClosed;
  }
}

/** Deletes expired counters from both limiter tables so they don't grow forever. */
async function pruneStaleCounters() {
  try {
    await Promise.all([
      db
        .delete(actionRateLimit)
        .where(
          lt(actionRateLimit.windowStart, sql`now() - make_interval(secs => ${STALE_AFTER_SECONDS})`),
        ),
      // Better Auth stores lastRequest as epoch milliseconds.
      db
        .delete(authRateLimit)
        .where(
          lt(
            authRateLimit.lastRequest,
            sql`(extract(epoch from now()) * 1000)::bigint - ${STALE_AFTER_SECONDS * 1000}`,
          ),
        ),
    ]);
  } catch (error) {
    log.warn("rate limit cleanup failed", { error });
  }
}

// Keep IPs/ids out of logs: only the bucket name.
function redactKey(key: string) {
  return key.split(":").slice(0, 2).join(":");
}

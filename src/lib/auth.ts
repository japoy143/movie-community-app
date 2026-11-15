import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/limits";
import { ipAddressOptions } from "@/lib/ip";
import { createLogger } from "@/lib/logger";

const log = createLogger("auth");

const DAY = 60 * 60 * 24;

// Over plain http, cookies lose the Secure flag and the __Secure- prefix.
// Local builds (`next build` / `next start` on localhost) are exempt.
const baseURL = process.env.BETTER_AUTH_URL;
const isLocal = !!baseURL && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(baseURL);
if (process.env.NODE_ENV === "production" && baseURL && !baseURL.startsWith("https://") && !isLocal) {
  log.warn("BETTER_AUTH_URL should use https in production");
}

// Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL from the environment. In
// production Better Auth refuses to start without a secret.

/** Trims and validates a display name; throws a 400 the form can show. */
function cleanName(name: unknown): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 1 || trimmed.length > NAME_MAX_LENGTH) {
    throw new APIError("BAD_REQUEST", {
      message: `Display name must be 1–${NAME_MAX_LENGTH} characters.`,
    });
  }
  return trimmed;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
  },
  session: {
    // Only Server Actions and <SessionRefresher /> can refresh the cookie
    // (Server Components can't write cookies), so give sessions room.
    expiresIn: 30 * DAY,
    updateAge: DAY,
  },
  advanced: {
    // Same trusted IP headers as the app's own limits (src/lib/ip.ts).
    ipAddress: ipAddressOptions,
  },
  rateLimit: {
    // On in dev too, and stored in Postgres so limits hold across
    // serverless instances and restarts (in-memory is per process).
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 3600, max: 5 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Better Auth doesn't validate name/image: enforce it server-side.
        // Avatars aren't supported yet, so a client-supplied image URL is dropped.
        before: async (user) => ({
          data: { ...user, name: cleanName(user.name), image: null },
        }),
      },
      update: {
        before: async (user) => {
          const data: Record<string, unknown> = { ...user };
          if ("name" in user) data.name = cleanName(user.name);
          if ("image" in user) data.image = null;
          return { data };
        },
      },
    },
  },
  logger: {
    // Route Better Auth's logs through our logger; drop error objects, whose
    // messages can include query parameters such as session tokens.
    log: (level, message) => {
      const fn = level === "error" ? log.error : level === "warn" ? log.warn : log.info;
      fn(message);
    },
  },
  // Lets Server Actions set auth cookies. Must stay the last plugin.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

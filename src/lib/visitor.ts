import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createLogger } from "@/lib/logger";

// Anonymous id for guests so they can like movies (one like per browser).
// The cookie is "<uuid>.<hmac>": signed so a client can't invent fresh ids
// to dodge the per-IP cap on new guests (like-stuffing).
const COOKIE = "mc_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const log = createLogger("visitor");

function secret(): string {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not set (needed to sign guest ids).");
  return value;
}

function sign(id: string): string {
  // Domain-separated so this MAC can't be confused with Better Auth's.
  return createHmac("sha256", secret()).update(`mc_vid:${id}`).digest("base64url");
}

function verify(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot === -1) return null;
  const id = value.slice(0, dot);
  if (!UUID_RE.test(id)) return null;

  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(id));
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
}

/** Reads the guest id if its signature checks out, or null. Safe in Server Components. */
export async function getVisitorId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const id = verify(value);
  if (!id) log.warn("rejected unsigned or tampered visitor cookie");
  return id;
}

/** Returns the guest id, creating a signed cookie if needed. Server Actions only. */
export async function ensureVisitorId(): Promise<string> {
  const existing = await getVisitorId();
  if (existing) return existing;

  const id = crypto.randomUUID();
  (await cookies()).set(COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return id;
}

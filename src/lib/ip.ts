import "server-only";
import { getIP } from "better-auth/api";
import { headers } from "next/headers";

/**
 * Which request headers carry the real client IP. Shared by Better Auth's
 * rate limiter (src/lib/auth.ts) and the app's own limits, so both key on
 * the same address.
 *
 * Set TRUSTED_IP_HEADERS (comma-separated) only to headers a proxy in front
 * of the app overwrites, e.g. "x-vercel-forwarded-for" or "cf-connecting-ip".
 * Empty by default: with nothing in front of the app, any such header comes
 * from the client and could be forged to get a fresh rate-limit bucket.
 * With none trusted, Better Auth uses 127.0.0.1 in development and one
 * shared bucket in production (strict, but not bypassable).
 */
export const ipAddressOptions = {
  ipAddressHeaders: (process.env.TRUSTED_IP_HEADERS ?? "")
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean),
};

/** Client IP for rate-limit keys, resolved exactly like Better Auth does. */
export async function getClientIp(): Promise<string> {
  const ip = getIP(await headers(), { advanced: { ipAddress: ipAddressOptions } });
  return ip ?? "unknown";
}

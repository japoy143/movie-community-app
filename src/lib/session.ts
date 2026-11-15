import "server-only";
import { headers } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { auth, type Session } from "@/lib/auth";

/**
 * Session for rendering (Server Components). Deduped per request and never
 * refreshes the session: Server Components can't write cookies, so a refresh
 * here would extend the DB row but not the cookie. Reads request headers, so
 * with cacheComponents callers must render inside <Suspense>.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  // Better Auth compares the session's expiry with `new Date()`. Reading
  // headers alone doesn't make that request-time under cacheComponents, so
  // opt in explicitly; otherwise Next flags the unstable time read.
  await connection();
  return auth.api.getSession({
    headers: await headers(),
    query: { disableRefresh: true },
  });
});

/**
 * Session for Server Actions. Allows Better Auth to refresh the session;
 * the nextCookies() plugin writes the updated cookie.
 */
export async function getActionSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

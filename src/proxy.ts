import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("proxy");

/**
 * Asks Better Auth directly (no HTTP self-fetch) whether the cookie belongs
 * to a live session. A cookie alone isn't enough: it can outlive its session
 * (expired, signed out elsewhere, database reset), and redirecting on it
 * would lock the user out of the sign-in page. disableRefresh: the proxy
 * can't forward a refreshed cookie, so it must not extend the session row.
 */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
      query: { disableRefresh: true },
    });
    return session !== null;
  } catch (error) {
    // Fail open: showing the form is harmless; locking users out is not.
    log.error("session check failed", { error });
    return false;
  }
}

// Signed-in users have no reason to see sign-in/sign-up (and signing in again
// would silently replace their session). Convenience only — real
// authorization happens in Server Actions and data loaders.
export async function proxy(request: NextRequest) {
  // Cheap check first: no cookie means definitely signed out.
  if (getSessionCookie(request) && (await hasValidSession(request))) {
    // Build the redirect from the configured origin, not the request's Host
    // header, which a client controls.
    const home = new URL("/", process.env.BETTER_AUTH_URL ?? request.nextUrl.origin);
    return NextResponse.redirect(home);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/sign-in", "/sign-up"],
};

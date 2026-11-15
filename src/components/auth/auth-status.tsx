import { unstable_rethrow } from "next/navigation";
import Link from "next/link";
import { createLogger } from "@/lib/logger";
import { getSession } from "@/lib/session";
import { SessionRefresher } from "./session-refresher";
import { SignOutButton } from "./sign-out-button";

const log = createLogger("auth-status");

async function loadSession() {
  try {
    return await getSession();
  } catch (error) {
    // Let Next's control-flow errors (prerender bailout, notFound…) through.
    unstable_rethrow(error);
    log.error("failed to load session", { error });
    return null;
  }
}

// Server Component: reads the session cookie. Render inside <Suspense>.
// If auth is down, show the signed-out links instead of failing the page.
export async function AuthStatus() {
  const session = await loadSession();

  if (!session) {
    return (
      <div className="cluster">
        <Link href="/sign-in" className="btn btn-ghost btn-sm">
          Sign in
        </Link>
        <Link href="/sign-up" className="btn btn-primary btn-sm">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="cluster gap-3">
      <span className="text-sm">
        Signed in as <span className="font-semibold">{session.user.name}</span>
      </span>
      <SignOutButton />
      <SessionRefresher />
    </div>
  );
}

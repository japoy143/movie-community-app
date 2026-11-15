"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { createLogger } from "@/lib/logger";

const log = createLogger("session-refresher");
const KEY = "mc_session_checked";
const INTERVAL_MS = 60 * 60 * 1000;

/**
 * Server Components can't write cookies, so browsing alone never extends a
 * session. This calls /api/auth/get-session (a route handler, which can)
 * at most once an hour; Better Auth refreshes the cookie when it's due.
 * Rendered only for signed-in users.
 */
export function SessionRefresher() {
  useEffect(() => {
    try {
      const last = Number(sessionStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < INTERVAL_MS) return;
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      // Storage blocked: refresh anyway, it's one cheap request.
    }
    authClient.getSession().catch((error: unknown) => {
      log.warn("session refresh failed", { error });
    });
  }, []);

  return null;
}

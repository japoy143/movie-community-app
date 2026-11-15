"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { navigateWithFlash } from "@/lib/flash";
import { createLogger } from "@/lib/logger";

const log = createLogger("sign-out-button");

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        log.warn("sign-out rejected", { status: error.status, code: error.code });
        toast.error("Couldn't sign out. Try again.");
        return;
      }
      // Full load drops every cached signed-in view (comments, delete buttons).
      navigateWithFlash("/", { type: "success", message: "Signed out." });
    } catch (err) {
      log.error("sign-out request failed", { error: err });
      toast.error("Couldn't reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="btn btn-secondary btn-sm"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

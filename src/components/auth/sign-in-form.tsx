"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { authClient } from "@/lib/auth-client";
import { navigateWithFlash, safeNextPath } from "@/lib/flash";
import { createLogger } from "@/lib/logger";
import { AuthCard } from "./auth-card";

const log = createLogger("sign-in-form");

export function SignInForm() {
  const [invalid, setInvalid] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInvalid(false);
    setPending(true);

    const form = new FormData(event.currentTarget);
    try {
      const { error } = await authClient.signIn.email({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });

      if (error) {
        // Never log the email or password; status/code is enough to debug.
        log.warn("sign-in rejected", { status: error.status, code: error.code });
        const message = error.message ?? "Incorrect email or password.";
        if (error.status === 429) {
          toast.warning(message);
        } else {
          setInvalid(true);
          toast.error(message);
        }
        return;
      }
    } catch (err) {
      log.error("sign-in request failed", { error: err });
      toast.error("Couldn't reach the server. Check your connection.");
      return;
    } finally {
      // Activity keeps this page mounted after navigation; never leave it stuck.
      setPending(false);
    }

    // Full load so no page keeps showing the signed-out view.
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    navigateWithFlash(next, { type: "success", message: "Signed in. Welcome back!" });
  }

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back. Pick up where you left off."
      footer={{ text: "New here?", linkLabel: "Create an account", href: "/sign-up" }}
    >
      <form onSubmit={handleSubmit} className="stack">
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={invalid || undefined}
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={invalid || undefined}
        />

        <SubmitButton pending={pending} label="Sign in" pendingLabel="Signing in…" />
      </form>
    </AuthCard>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { authClient } from "@/lib/auth-client";
import { navigateWithFlash, safeNextPath } from "@/lib/flash";
import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/limits";
import { createLogger } from "@/lib/logger";
import { AuthCard } from "./auth-card";

const log = createLogger("sign-up-form");

export function SignUpForm() {
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      toast.warning("Passwords don't match.");
      return;
    }

    setPending(true);
    try {
      const { error } = await authClient.signUp.email({
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        password,
      });

      if (error) {
        // Never log the submitted values; status/code is enough to debug.
        log.warn("sign-up rejected", { status: error.status, code: error.code });
        if (error.status === 429) {
          toast.warning(error.message ?? "Too many attempts. Try again later.");
        } else if (error.code?.startsWith("USER_ALREADY_EXISTS")) {
          // Don't confirm which emails have accounts.
          toast.error("Couldn't create an account with these details. If you already have one, sign in instead.");
        } else {
          toast.error(error.message ?? "Couldn't create your account. Try again.");
        }
        return;
      }
      // Better Auth signs the user in right after sign-up.
    } catch (err) {
      log.error("sign-up request failed", { error: err });
      toast.error("Couldn't reach the server. Check your connection.");
      return;
    } finally {
      // Activity keeps this page mounted after navigation; never leave it stuck.
      setPending(false);
    }

    // Full load so no page keeps showing the signed-out view.
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    navigateWithFlash(next, { type: "success", message: "Account created. Welcome!" });
  }

  return (
    <AuthCard
      title="Create your account"
      description="Like films and join the conversation with other movie lovers."
      footer={{ text: "Already have an account?", linkLabel: "Sign in", href: "/sign-in" }}
    >
      <form onSubmit={handleSubmit} className="stack">
        <FormField
          name="name"
          label="Display name"
          type="text"
          autoComplete="nickname"
          required
          maxLength={NAME_MAX_LENGTH}
        />
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        />
        <FormField
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
        />

        <SubmitButton
          pending={pending}
          label="Create account"
          pendingLabel="Creating account…"
        />
      </form>
    </AuthCard>
  );
}

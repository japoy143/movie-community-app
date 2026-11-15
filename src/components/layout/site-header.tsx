import Link from "next/link";
import { Suspense } from "react";
import { AuthStatus } from "@/components/auth/auth-status";

export function SiteHeader() {
  return (
    <header className="app-header justify-between">
      <Link href="/" className="text-headline">
        Movie Community
      </Link>
      <Suspense fallback={<div className="h-8 w-40" aria-hidden />}>
        <AuthStatus />
      </Suspense>
    </header>
  );
}

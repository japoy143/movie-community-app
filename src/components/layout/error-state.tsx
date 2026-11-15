"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("ui");

// `retry` re-fetches the failed segment; `reset` would only re-render it.
type Props = { error: Error & { digest?: string }; retry: () => void };

export function ErrorState({ error, retry }: Props) {
  useEffect(() => {
    // Server details are logged by the server logger; this ties the digest
    // shown to the user back to that log line.
    log.error("render error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <main className="container-feed stack items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-title">Something went wrong</h1>
      <p className="text-meta">
        We couldn&apos;t load this page. The movie service may be busy. Try again in a moment.
      </p>
      {error.digest && <p className="text-xs text-fg-subtle">Error ID: {error.digest}</p>}
      <div className="cluster justify-center">
        <button type="button" onClick={retry} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
    </main>
  );
}

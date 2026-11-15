import Link from "next/link";

export function MovieNotFound() {
  return (
    <main className="container-feed stack items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-title">Movie not found</h1>
      <p className="text-meta">We couldn&apos;t find that movie. It may have been removed.</p>
      <Link href="/" className="btn btn-secondary">
        Back to movies
      </Link>
    </main>
  );
}

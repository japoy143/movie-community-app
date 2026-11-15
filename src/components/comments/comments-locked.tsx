import Link from "next/link";

export function CommentsLocked({ count, movieId }: { count: number; movieId: number }) {
  const next = `?next=${encodeURIComponent(`/movies/${movieId}`)}`;
  const label = count === 1 ? "1 comment" : `${count} comments`;
  return (
    <div className="card stack items-center gap-3 py-8 text-center">
      <p className="font-semibold">{count > 0 ? label : "No comments yet"}</p>
      <p className="text-meta max-w-xs">
        Sign in to read and join the conversation.
      </p>
      <div className="cluster justify-center">
        <Link href={`/sign-in${next}`} className="btn btn-secondary btn-sm">
          Sign in
        </Link>
        <Link href={`/sign-up${next}`} className="btn btn-primary btn-sm">
          Sign up
        </Link>
      </div>
    </div>
  );
}

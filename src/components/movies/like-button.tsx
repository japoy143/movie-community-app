"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setLike } from "@/app/movies/actions";
import { formatCount } from "@/lib/format";
import { createLogger } from "@/lib/logger";

const log = createLogger("like-button");

type Props = {
  movieId: number;
  initialCount: number;
  initialLiked: boolean;
  size?: "sm" | "md";
};

export function LikeButton({ movieId, initialCount, initialLiked, size = "sm" }: Props) {
  // Props are the source of truth: setLike calls refresh(), so the server
  // sends fresh counts to every mounted view. The optimistic value shows the
  // click instantly and falls back to the props when the transition ends
  // (new props on success, old props on failure).
  const [optimistic, setOptimistic] = useOptimistic({ liked: initialLiked, count: initialCount });
  const [pending, startTransition] = useTransition();

  function handleClick() {
    // One request at a time, so responses can't land out of order.
    if (pending) return;
    const next = !optimistic.liked;
    startTransition(async () => {
      setOptimistic({ liked: next, count: optimistic.count + (next ? 1 : -1) });
      try {
        const result = await setLike(movieId, next);
        if (!result.ok) {
          toast[result.severity](result.error);
          return;
        }
        toast.success(result.liked ? "Added to your likes." : "Removed from your likes.");
      } catch (err) {
        log.error("setLike request failed", { movieId, error: err });
        toast.error("Couldn't reach the server. Check your connection.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={optimistic.liked}
      aria-busy={pending || undefined}
      aria-label={optimistic.liked ? "Unlike this movie" : "Like this movie"}
      className={`btn btn-secondary ${size === "sm" ? "btn-sm" : ""} ${
        optimistic.liked ? "border-accent text-accent" : ""
      }`}
    >
      <HeartIcon filled={optimistic.liked} />
      <span className="tabular-nums">{formatCount(optimistic.count)}</span>
    </button>
  );
}

export function LikeButtonSkeleton({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={`inline-block rounded-md bg-surface-hover ${
        size === "sm" ? "h-8 w-16" : "h-10 w-20"
      }`}
    />
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

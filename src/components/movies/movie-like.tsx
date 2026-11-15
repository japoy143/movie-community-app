import { unstable_rethrow } from "next/navigation";
import { getLikeCount, getViewer, hasLiked } from "@/lib/community";
import { createLogger } from "@/lib/logger";
import { LikeButton } from "./like-button";

const log = createLogger("movie-like");

async function loadLikeState(movieId: number) {
  try {
    const viewer = await getViewer();
    const [count, liked] = await Promise.all([getLikeCount(movieId), hasLiked(movieId, viewer)]);
    return { count, liked };
  } catch (error) {
    // Let Next's control-flow errors (prerender bailout, notFound…) through.
    unstable_rethrow(error);
    log.error("failed to load like state", { movieId, error });
    return null;
  }
}

export async function MovieLike({ movieId }: { movieId: number }) {
  const state = await loadLikeState(movieId);
  if (!state) return <p className="text-meta">Likes are unavailable right now.</p>;
  return (
    <LikeButton movieId={movieId} initialCount={state.count} initialLiked={state.liked} size="md" />
  );
}

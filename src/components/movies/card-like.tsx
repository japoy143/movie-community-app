import { unstable_rethrow } from "next/navigation";
import { getViewerLikeStats, type LikeStats } from "@/lib/community";
import { createLogger } from "@/lib/logger";
import { LikeButton } from "./like-button";

const log = createLogger("card-like");

async function loadStats(movieId: number, idsKey: string): Promise<LikeStats | null> {
  try {
    return (await getViewerLikeStats(idsKey)).get(movieId) ?? { count: 0, likedByViewer: false };
  } catch (error) {
    // Let Next's control-flow errors (prerender bailout, notFound…) through.
    unstable_rethrow(error);
    log.error("failed to load like stats", { movieId, error });
    return null;
  }
}

// Streams in per card; all cards share one grouped query via idsKey.
export async function CardLike({ movieId, idsKey }: { movieId: number; idsKey: string }) {
  const stats = await loadStats(movieId, idsKey);
  if (!stats) return null;
  return (
    <LikeButton movieId={movieId} initialCount={stats.count} initialLiked={stats.likedByViewer} />
  );
}

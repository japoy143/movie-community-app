import "server-only";
import { cache } from "react";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { comment, movieLike, user } from "@/db/schema";
import { getSession } from "@/lib/session";
import { getVisitorId } from "@/lib/visitor";

// Request-specific community data (likes, comments). Not cached: results
// depend on the viewer. Callers must render inside <Suspense>.

export type Viewer =
  | { kind: "user"; userId: string; name: string }
  | { kind: "guest"; visitorId: string | null };

export type LikeStats = { count: number; likedByViewer: boolean };

export type CommentWithAuthor = {
  id: number;
  body: string;
  createdAt: Date;
  author: { id: string; name: string };
};

// Deduped per request, so many components can ask without extra queries.
export const getViewer = cache(async (): Promise<Viewer> => {
  const session = await getSession();
  if (session) {
    return { kind: "user", userId: session.user.id, name: session.user.name };
  }
  return { kind: "guest", visitorId: await getVisitorId() };
});

function ownerCondition(viewer: Viewer) {
  if (viewer.kind === "user") return eq(movieLike.userId, viewer.userId);
  if (viewer.visitorId) return eq(movieLike.visitorId, viewer.visitorId);
  return null;
}

/** Like counts + whether the viewer liked each movie, in one query. */
export async function getLikeStats(
  movieIds: number[],
  viewer: Viewer,
): Promise<Map<number, LikeStats>> {
  const stats = new Map<number, LikeStats>(
    movieIds.map((id) => [id, { count: 0, likedByViewer: false }]),
  );
  if (movieIds.length === 0) return stats;

  const owner = ownerCondition(viewer);
  const rows = await db
    .select({
      movieId: movieLike.movieId,
      count: count(),
      liked: owner
        ? sql<boolean>`bool_or(${owner})`
        : sql<boolean>`false`,
    })
    .from(movieLike)
    .where(inArray(movieLike.movieId, movieIds))
    .groupBy(movieLike.movieId);

  for (const row of rows) {
    stats.set(row.movieId, { count: row.count, likedByViewer: !!row.liked });
  }
  return stats;
}

/**
 * Like stats for a list of movies, for the current viewer. `idsKey` is a
 * comma-separated id list so React's per-request cache can dedupe it: every
 * card on the home grid asks with the same key, and only one query runs.
 */
export const getViewerLikeStats = cache(async (idsKey: string) => {
  const ids = idsKey.split(",").map(Number).filter(Number.isSafeInteger);
  return getLikeStats(ids, await getViewer());
});

export async function getLikeCount(movieId: number): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(movieLike)
    .where(eq(movieLike.movieId, movieId));
  return row?.count ?? 0;
}

export async function hasLiked(movieId: number, viewer: Viewer) {
  const owner = ownerCondition(viewer);
  if (!owner) return false;
  const [row] = await db
    .select({ id: movieLike.id })
    .from(movieLike)
    .where(and(eq(movieLike.movieId, movieId), owner))
    .limit(1);
  return !!row;
}

export async function getCommentCount(movieId: number): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(comment)
    .where(eq(comment.movieId, movieId));
  return row?.count ?? 0;
}

/** Comment text is members-only: only call this for a signed-in viewer. */
export async function getComments(
  movieId: number,
  viewer: Viewer,
): Promise<CommentWithAuthor[]> {
  if (viewer.kind !== "user") {
    throw new Error("getComments called for a guest viewer");
  }
  const rows = await db
    .select({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      authorId: user.id,
      authorName: user.name,
    })
    .from(comment)
    .innerJoin(user, eq(comment.userId, user.id))
    .where(eq(comment.movieId, movieId))
    .orderBy(desc(comment.createdAt))
    .limit(100);

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    author: { id: r.authorId, name: r.authorName },
  }));
}

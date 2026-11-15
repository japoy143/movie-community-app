import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommentSection, CommentSectionSkeleton } from "@/components/comments/comment-section";
import { MAX_INT4 } from "@/lib/limits";
import { getMovie } from "@/lib/tmdb";
import { CastList } from "./cast-list";
import { LikeButtonSkeleton } from "./like-button";
import { MovieHero } from "./movie-hero";
import { MovieLike } from "./movie-like";
import { MovieStats } from "./movie-stats";

/** Canonical positive int4 id only ("0550" and "1e3" are rejected). */
export function parseMovieId(raw: string): number | null {
  if (!/^[1-9]\d{0,9}$/.test(raw)) return null;
  const id = Number(raw);
  return id <= MAX_INT4 ? id : null;
}

// Awaits the route params inside <Suspense> (see movies/[id]/page.tsx).
export async function MovieDetails({ params }: { params: Promise<{ id: string }> }) {
  const id = parseMovieId((await params).id);
  if (!id) notFound();

  const movie = await getMovie(id);
  if (!movie) notFound();

  return (
    <article className="stack gap-8">
      <Link href="/" className="link-muted text-sm">
        ← All movies
      </Link>
      <MovieHero movie={movie} />
      <div className="flex items-center gap-3">
        <Suspense fallback={<LikeButtonSkeleton size="md" />}>
          <MovieLike movieId={movie.id} />
        </Suspense>
        <span className="text-meta">Liked it? Let people know.</span>
      </div>
      <MovieStats movie={movie} />
      <CastList movieId={movie.id} cast={movie.credits.cast} />
      <Suspense fallback={<CommentSectionSkeleton />}>
        <CommentSection movieId={movie.id} />
      </Suspense>
    </article>
  );
}

export function MovieDetailsSkeleton() {
  return (
    <div className="stack gap-6" aria-busy="true" aria-label="Loading movie">
      <div className="media backdrop" />
      <div className="flex gap-4">
        <div className="media poster w-28 shrink-0 sm:w-40" />
        <div className="stack flex-1 gap-2">
          <div className="h-8 w-3/4 rounded-md bg-surface-hover" />
          <div className="h-4 w-1/3 rounded-md bg-surface-hover" />
        </div>
      </div>
    </div>
  );
}

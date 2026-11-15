import Link from "next/link";
import { Suspense } from "react";
import { releaseYear, type MovieSummary } from "@/lib/tmdb";
import { CardLike } from "./card-like";
import { LikeButtonSkeleton } from "./like-button";
import { Poster } from "./poster";
import { Rating } from "./rating";

type Props = { movie: MovieSummary; idsKey: string; priority?: boolean };

export function MovieCard({ movie, idsKey, priority }: Props) {
  const year = releaseYear(movie.release_date);
  return (
    <article className="group flex flex-col gap-2">
      <Link href={`/movies/${movie.id}`} className="flex flex-col gap-2 rounded-lg">
        <Poster
          path={movie.poster_path}
          title={movie.title}
          priority={priority}
          sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 45vw"
          className="transition-opacity group-hover:opacity-90"
        />
        <div className="flex flex-col gap-0.5">
          <h3 className="line-clamp-1 text-base font-semibold tracking-normal">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2">
            <Rating value={movie.vote_average} votes={movie.vote_count} />
            {year && <span className="text-meta">· {year}</span>}
          </div>
        </div>
      </Link>
      <Suspense fallback={<LikeButtonSkeleton />}>
        <CardLike movieId={movie.id} idsKey={idsKey} />
      </Suspense>
    </article>
  );
}

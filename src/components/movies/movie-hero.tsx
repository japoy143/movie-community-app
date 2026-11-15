import Image from "next/image";
import { formatRuntime } from "@/lib/format";
import { releaseYear, tmdbImage, type MovieDetails } from "@/lib/tmdb";
import { Poster } from "./poster";
import { Rating } from "./rating";

export function MovieHero({ movie }: { movie: MovieDetails }) {
  const backdrop = tmdbImage(movie.backdrop_path, "w1280");
  const meta = [releaseYear(movie.release_date), formatRuntime(movie.runtime)].filter(Boolean);

  return (
    <header className="stack gap-6">
      {backdrop && (
        <div className="media backdrop relative">
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="(min-width: 640px) 600px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex gap-4 sm:gap-6">
        <Poster
          path={movie.poster_path}
          title={movie.title}
          sizes="(min-width: 640px) 160px, 112px"
          className="w-28 shrink-0 sm:w-40"
        />
        <div className="stack min-w-0 gap-2">
          <h1 className="text-title">{movie.title}</h1>
          {meta.length > 0 && <p className="text-meta">{meta.join(" · ")}</p>}
          <Rating value={movie.vote_average} votes={movie.vote_count} />
          {movie.genres.length > 0 && (
            <ul className="cluster gap-1.5" aria-label="Genres">
              {movie.genres.map((g) => (
                <li key={g.id} className="chip h-7 px-2.5 text-xs">
                  {g.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(movie.tagline || movie.overview) && (
        <div className="stack gap-2">
          {movie.tagline && <p className="text-lg italic text-fg-muted">{movie.tagline}</p>}
          {movie.overview && <p>{movie.overview}</p>}
        </div>
      )}
    </header>
  );
}

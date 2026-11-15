import type { MovieSummary } from "@/lib/tmdb";
import { MovieCard } from "./movie-card";

export function MovieGrid({ movies }: { movies: MovieSummary[] }) {
  if (movies.length === 0) {
    return <p className="text-meta">No movies to show right now.</p>;
  }
  const idsKey = movies.map((m) => m.id).join(",");
  return (
    <div className="poster-grid gap-y-6">
      {movies.map((movie, i) => (
        <MovieCard key={movie.id} movie={movie} idsKey={idsKey} priority={i < 4} />
      ))}
    </div>
  );
}

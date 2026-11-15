import { getPopularMovies } from "@/lib/tmdb";
import { MovieGrid } from "./movie-grid";

// Cached TMDB data, so this renders into the static shell.
export async function PopularMovies() {
  const movies = await getPopularMovies();
  return (
    <section aria-labelledby="popular-heading" className="stack gap-4">
      <h2 id="popular-heading" className="text-headline">
        Popular right now
      </h2>
      <MovieGrid movies={movies} />
    </section>
  );
}

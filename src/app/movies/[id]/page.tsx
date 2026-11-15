import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { MovieDetails, MovieDetailsSkeleton } from "@/components/movies/movie-details";

// The params promise is awaited inside <Suspense>, so unknown movie ids get an
// instant app shell and are cached after the first visit (ISR).
export default function MoviePage({ params }: PageProps<"/movies/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="container-feed px-4 py-6">
        <Suspense fallback={<MovieDetailsSkeleton />}>
          <MovieDetails params={params} />
        </Suspense>
      </main>
    </>
  );
}

import { PopularMovies } from "@/components/movies/popular-movies";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="container-page stack gap-10 py-10">
        <div className="stack max-w-prose gap-2">
          <h1 className="text-display">Talk movies with people who love them.</h1>
          <p className="text-lg text-fg-muted">
            See what&apos;s popular, like what you love, and join the conversation.
          </p>
        </div>
        <PopularMovies />
      </main>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="divider mt-auto">
      <div className="container-feed px-4 py-6 text-xs text-fg-subtle">
        Movie data and images from{" "}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noreferrer"
          className="link-muted"
        >
          TMDB
        </a>
        . This product uses the TMDB API but is not endorsed or certified by TMDB.
      </div>
    </footer>
  );
}

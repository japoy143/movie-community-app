import {
  formatCount,
  formatDate,
  formatLanguage,
  formatMoney,
  formatRating,
  formatRuntime,
} from "@/lib/format";
import type { MovieDetails } from "@/lib/tmdb";

type Stat = { label: string; value: string | null };

export function MovieStats({ movie }: { movie: MovieDetails }) {
  const stats: Stat[] = [
    {
      label: "TMDB rating",
      value: movie.vote_count ? `${formatRating(movie.vote_average)} / 10` : null,
    },
    { label: "Votes", value: movie.vote_count ? formatCount(movie.vote_count) : null },
    { label: "Popularity", value: formatCount(Math.round(movie.popularity)) },
    { label: "Runtime", value: formatRuntime(movie.runtime) },
    { label: "Release date", value: formatDate(movie.release_date) },
    { label: "Language", value: formatLanguage(movie.original_language) },
    { label: "Status", value: movie.status || null },
    { label: "Budget", value: movie.budget > 0 ? formatMoney(movie.budget) : null },
    { label: "Box office", value: movie.revenue > 0 ? formatMoney(movie.revenue) : null },
  ];
  const visible = stats.filter((s): s is { label: string; value: string } => !!s.value);

  return (
    <section aria-labelledby={`stats-heading-${movie.id}`} className="stack gap-3">
      <h2 id={`stats-heading-${movie.id}`} className="text-headline">
        Stats
      </h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
        {visible.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 bg-canvas p-3">
            <dt className="text-xs text-fg-muted">{s.label}</dt>
            <dd className="font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

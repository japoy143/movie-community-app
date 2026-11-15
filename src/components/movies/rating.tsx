import { formatCount, formatRating } from "@/lib/format";

export function Rating({ value, votes }: { value: number; votes: number }) {
  if (!votes) return <span className="text-meta">No ratings yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span aria-hidden className="text-rating">★</span>
      <span className="font-semibold tabular-nums">{formatRating(value)}</span>
      <span className="text-fg-muted">
        ({formatCount(votes)}
        <span className="sr-only"> votes</span>)
      </span>
    </span>
  );
}

// Display formatting shared by movie components.

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const longDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const formatCount = (n: number) => compact.format(n);
export const formatMoney = (n: number) => usd.format(n);
export const formatRating = (n: number) => n.toFixed(1);

export function formatDate(iso: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : longDate.format(date);
}

export function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function formatLanguage(code: string): string {
  try {
    return languageNames.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function timeAgo(date: Date, now = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    // Floor (toward zero) so 59.5 minutes reads "59 minutes ago", not "60".
    const value = Math.trunc(seconds / size);
    if (value !== 0) return relative.format(value, unit);
  }
  return "just now";
}

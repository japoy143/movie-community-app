import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createLogger } from "@/lib/logger";

const log = createLogger("tmdb");

// TMDB API v3 client. Responses are cached for hours ("use cache"), so pages
// prerender and TMDB is called rarely. Requires TMDB_READ_ACCESS_TOKEN.
// Attribution is required by TMDB's terms (see footer in app/layout.tsx).

const API_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p";
const TIMEOUT_MS = 8000;

export type MovieSummary = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type MovieDetails = MovieSummary & {
  tagline: string | null;
  runtime: number | null;
  status: string;
  original_language: string;
  budget: number;
  revenue: number;
  genres: { id: number; name: string }[];
  credits: { cast: CastMember[] };
};

type Paginated<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export class TmdbError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  // Tolerate stray whitespace or a pasted "Bearer " prefix.
  const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim().replace(/^Bearer\s+/i, "");
  if (!token) {
    log.error("missing TMDB_READ_ACCESS_TOKEN");
    throw new TmdbError(
      "TMDB_READ_ACCESS_TOKEN is not set. Add it to .env.local or .env.",
    );
  }

  const url = new URL(API_URL + path);
  url.search = new URLSearchParams({ language: "en-US", ...params }).toString();

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      // A hung TMDB request would otherwise stall the page (and the build).
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    log.error(timedOut ? "request timed out" : "network error", { path, error });
    throw new TmdbError(`TMDB ${path} is unreachable`);
  }

  if (!res.ok) {
    if (res.status === 401) {
      // TMDB explains the rejection in `status_message`; never log the token.
      const body = (await res.json().catch(() => null)) as { status_message?: string } | null;
      log.error("request unauthorized", {
        path,
        status: res.status,
        reason: body?.status_message,
        hint: /^[0-9a-f]{32}$/i.test(token)
          ? "This looks like the v3 API Key. Use the API Read Access Token (starts with eyJ) instead."
          : "Check TMDB_READ_ACCESS_TOKEN in .env.local (it overrides .env) and restart the server.",
      });
      throw new TmdbError(`TMDB ${path} failed with 401`, 401);
    }
    // 404s are expected for unknown ids; anything else is worth an alert.
    if (res.status !== 404) log.error("request failed", { path, status: res.status });
    throw new TmdbError(`TMDB ${path} failed with ${res.status}`, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch (error) {
    log.error("invalid JSON response", { path, status: res.status, error });
    throw new TmdbError(`TMDB ${path} returned invalid JSON`, res.status);
  }
}

export async function getPopularMovies(page = 1): Promise<MovieSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("tmdb", "tmdb:popular");

  const data = await tmdbFetch<Paginated<MovieSummary>>("/movie/popular", {
    page: String(page),
  });
  return data.results;
}

/** Returns null when TMDB has no movie with this id. */
export async function getMovie(id: number): Promise<MovieDetails | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("tmdb", `tmdb:movie:${id}`);

  try {
    return await tmdbFetch<MovieDetails>(`/movie/${id}`, {
      append_to_response: "credits",
    });
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}

type PosterSize = "w185" | "w342" | "w500" | "w780";
type BackdropSize = "w780" | "w1280" | "original";
type ProfileSize = "w185" | "h632";

export function tmdbImage(
  path: string | null,
  size: PosterSize | BackdropSize | ProfileSize,
): string | null {
  return path ? `${IMAGE_URL}/${size}${path}` : null;
}

export function releaseYear(date: string): string | null {
  return date ? date.slice(0, 4) : null;
}

import type {
  Episode,
  Genre,
  GenreListResponse,
  MediaType,
  PaginatedResponse,
  PersonCombinedCredit,
  PersonDetails,
  TMDBDetails,
  TMDBMovie,
  Video,
} from "@/types/tmdb";
import { getApiKey } from "@/config/tmdb";
import i18n, { tmdbLanguageFor } from "@/i18n";

export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
export const TMDB_POSTER_W500 = `${TMDB_IMAGE_BASE}/w500`;
export const TMDB_BACKDROP_W1280 = `${TMDB_IMAGE_BASE}/w1280`;
export const TMDB_BACKDROP_ORIGINAL = `${TMDB_IMAGE_BASE}/original`;

/**
 * Language tag injected into every TMDB request, derived from the active
 * interface language (en → en-US, he → he-IL, ru → ru-RU). TMDB falls back to
 * the original/English metadata automatically when a localized translation for
 * a title is missing, so a missing he/ru translation never breaks a request.
 */
export function currentTmdbLanguage(): string {
  return tmdbLanguageFor(i18n.language ?? "en");
}

export class TMDBError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: number,
  ) {
    super(message);
    this.name = "TMDBError";
  }
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Central TMDB client. In the browser it calls TMDB directly; when running
 * inside the Tauri shell it transparently routes through the Rust backend
 * proxy (which hides the API key and adds CORS-safe headers).
 */
async function tmdbFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams();
  const apiKey = getApiKey();

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
  }

  const url = `${TMDB_BASE_URL}${path}?${params.toString()}`;

  if ("__TAURI_INTERNALS__" in window) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const res = await invoke<{ ok: boolean; status?: number; data?: T }>(
        "tmdb_proxy",
        { url, apiKey },
      );
      if (!res.ok || res.data === undefined) {
        throw new TMDBError("TMDB proxy request failed", res.status);
      }
      return res.data;
    } catch (err) {
      if (err instanceof TMDBError) throw err;
      console.warn("[tmdb] Tauri proxy unavailable, falling back to fetch.", err);
    }
  }

  const headers: Record<string, string> = { accept: "application/json" };
  headers.authorization = `Bearer ${apiKey}`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    let code: number | undefined;
    let message = `TMDB request failed (${res.status})`;
    try {
      const body = (await res.json()) as { status_message?: string; status_code?: number };
      code = body.status_code;
      message = body.status_message ?? message;
    } catch {
      /* ignore parse errors */
    }
    throw new TMDBError(message, res.status, code);
  }

  return (await res.json()) as T;
}

export function posterUrl(path: string | null, size: "w92" | "w154" | "w185" | "w342" | "w500" | "original" = "w500"): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size: "w300" | "w780" | "w1280" | "original" = "w1280"): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function titleOf(item: Pick<TMDBMovie, "title" | "name">): string {
  return item.title ?? item.name ?? "Untitled";
}

export function yearOf(item: { release_date?: string; first_air_date?: string }): string {
  const date = item.release_date ?? item.first_air_date;
  return date ? date.slice(0, 4) : "—";
}

export interface NormalizedMedia {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  voteCount: number;
  releaseDate?: string;
  genreIds: number[];
}

export function normalizeMedia(
  item: TMDBMovie,
  fallbackType: MediaType = "movie",
): NormalizedMedia {
  const mediaType = (item.media_type as MediaType | undefined) ?? fallbackType;
  return {
    id: item.id,
    mediaType,
    title: titleOf(item),
    overview: item.overview ?? "",
    posterPath: posterUrl(item.poster_path),
    backdropPath: backdropUrl(item.backdrop_path),
    voteAverage: item.vote_average ?? 0,
    voteCount: item.vote_count ?? 0,
    releaseDate: item.release_date ?? item.first_air_date,
    genreIds: item.genre_ids ?? [],
  };
}

export const tmdb = {
  async search(query: string): Promise<NormalizedMedia[]> {
    if (!query.trim()) return [];
    const res = await tmdbFetch<PaginatedResponse<TMDBMovie>>("/search/multi", {
      params: { query, include_adult: "false", language: currentTmdbLanguage() },
    });
    return res.results.map((r) => normalizeMedia(r)).slice(0, 12);
  },

  async trending(): Promise<NormalizedMedia[]> {
    const res = await tmdbFetch<PaginatedResponse<TMDBMovie>>("/trending/all/day", {
      params: { language: currentTmdbLanguage() },
    });
    return res.results.map((r) => normalizeMedia(r));
  },

  async popular(type: MediaType, page = 1): Promise<NormalizedMedia[]> {
    const res = await tmdbFetch<PaginatedResponse<TMDBMovie>>(`/${type}/popular`, {
      params: { language: currentTmdbLanguage(), page },
    });
    return res.results.map((r) => normalizeMedia(r, type));
  },

  async nowPlaying(): Promise<NormalizedMedia[]> {
    const res = await tmdbFetch<PaginatedResponse<TMDBMovie>>("/movie/now_playing", {
      params: { language: currentTmdbLanguage() },
    });
    return res.results.map((r) => normalizeMedia(r, "movie"));
  },

  async upcoming(): Promise<NormalizedMedia[]> {
    const res = await tmdbFetch<PaginatedResponse<TMDBMovie>>("/movie/upcoming", {
      params: { language: currentTmdbLanguage() },
    });
    return res.results.map((r) => normalizeMedia(r, "movie"));
  },

  async genres(type: MediaType): Promise<Genre[]> {
    const res = await tmdbFetch<GenreListResponse>(`/genre/${type}/list`, {
      params: { language: currentTmdbLanguage() },
    });
    return res.genres;
  },

  async discover(
    type: MediaType,
    options: {
      genres?: number[];
      sort?: string;
      page?: number;
      yearFrom?: number;
      yearTo?: number;
      minRating?: number;
    } = {},
  ): Promise<{ results: NormalizedMedia[]; totalPages: number }> {
    const params: Record<string, string | number | boolean | undefined> = {
      language: currentTmdbLanguage(),
      include_adult: "false",
      page: options.page ?? 1,
      sort_by: options.sort ?? "popularity.desc",
      with_genres: options.genres?.length ? options.genres.join(",") : undefined,
    };
    if (options.yearFrom) {
      const key = type === "tv" ? "first_air_date.gte" : "primary_release_date.gte";
      params[key] = `${options.yearFrom}-01-01`;
    }
    if (options.yearTo) {
      const key = type === "tv" ? "first_air_date.lte" : "primary_release_date.lte";
      params[key] = `${options.yearTo}-12-31`;
    }
    if (options.minRating && options.minRating > 0) {
      params["vote_average.gte"] = options.minRating;
      params["vote_count.gte"] = 200;
    }
    const res = await tmdbFetch<PaginatedResponse<TMDBMovie>>(`/discover/${type}`, {
      params,
    });
    return {
      results: res.results.map((r) => normalizeMedia(r, type)),
      totalPages: res.total_pages,
    };
  },

  async details(type: MediaType, id: number): Promise<TMDBDetails> {
    return tmdbFetch<TMDBDetails>(`/${type}/${id}`, {
      params: {
        language: currentTmdbLanguage(),
        append_to_response: "videos,credits",
      },
    });
  },

  async recommendations(type: MediaType, id: number): Promise<NormalizedMedia[]> {
    const res = await tmdbFetch<PaginatedResponse<TMDBMovie>>(`/${type}/${id}/recommendations`, {
      params: { language: currentTmdbLanguage() },
    });
    return res.results.map((r) => normalizeMedia(r, type));
  },

  async episodes(id: number, season: number): Promise<Episode[]> {
    const res = await tmdbFetch<{ episodes: Episode[] }>(`/tv/${id}/season/${season}`, {
      params: { language: currentTmdbLanguage() },
    });
    return res.episodes ?? [];
  },

  async person(id: number): Promise<PersonDetails> {
    return tmdbFetch<PersonDetails>(`/person/${id}`, {
      params: { language: currentTmdbLanguage(), append_to_response: "combined_credits" },
    });
  },
};

/** Picks the best YouTube trailer from a media's `videos` list. */
export function pickTrailer(videos: Video[] | undefined): Video | null {
  if (!videos?.length) return null;
  const yt = videos.filter((v) => v.site === "YouTube");
  if (!yt.length) return null;
  return (
    yt.find((v) => v.type === "Trailer" && v.official !== false) ??
    yt.find((v) => v.type === "Trailer") ??
    yt.find((v) => v.type === "Teaser") ??
    yt[0] ??
    null
  );
}

/** Builds a `NormalizedMedia` from a person's combined-credit entry. */
export function normalizePersonCredit(c: PersonCombinedCredit): NormalizedMedia {
  return {
    id: c.id,
    mediaType: c.media_type,
    title: titleOf(c as TMDBMovie),
    overview: c.overview ?? "",
    posterPath: posterUrl(c.poster_path),
    backdropPath: backdropUrl(c.backdrop_path),
    voteAverage: c.vote_average ?? 0,
    voteCount: c.vote_count ?? 0,
    releaseDate: c.release_date ?? c.first_air_date,
    genreIds: c.genre_ids ?? [],
  };
}

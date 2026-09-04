import type { MediaType } from "@/types/tmdb";

export interface SourceConfig {
  name: string;
  home: string;
  movieUrl: (tmdbId: number) => string;
  tvUrl: (tmdbId: number, season: number, episode: number) => string;
}

/**
 * vidsync.live embed provider.
 * Movies : https://vidsync.live/embed/movie/{tmdb_id}
 * TV     : https://vidsync.live/embed/tv/{tmdb_id}/{season}/{episode}
 */
export const vidsync: SourceConfig = {
  name: "vidsync",
  home: "https://vidsync.live",
  movieUrl: (tmdbId) => `https://vidsync.live/embed/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://vidsync.live/embed/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * vidsrc backup embed provider.
 * Movies : https://vidsrc.to/embed/movie/{tmdb_id}
 * TV     : https://vidsrc.to/embed/tv/{tmdb_id}/{season}/{episode}
 */
export const vidsrc: SourceConfig = {
  name: "vidsrc",
  home: "https://vidsrc.to",
  movieUrl: (tmdbId) => `https://vidsrc.to/embed/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * vidnest.fun embed source.
 * Movies : https://vidnest.fun/movie/{tmdb_id}
 * TV     : https://vidnest.fun/tv/{tmdb_id}/{season}/{episode}
 */
export const vidnest: SourceConfig = {
  name: "vidnest",
  home: "https://vidnest.fun",
  movieUrl: (tmdbId) => `https://vidnest.fun/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://vidnest.fun/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * player.videasy.net embed source.
 * Movies : https://player.videasy.net/movie/{tmdb_id}
 * TV     : https://player.videasy.net/tv/{tmdb_id}/{season}/{episode}
 */
export const videasy: SourceConfig = {
  name: "videasy",
  home: "https://player.videasy.net",
  movieUrl: (tmdbId) => `https://player.videasy.net/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * cinesrc.st embed source.
 * Movies : https://cinesrc.st/embed/movie/{tmdb_id}
 * TV     : https://cinesrc.st/embed/tv/{tmdb_id}?s={season}&e={episode}
 */
export const cinesrc: SourceConfig = {
  name: "cinesrc",
  home: "https://cinesrc.st",
  movieUrl: (tmdbId) => `https://cinesrc.st/embed/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://cinesrc.st/embed/tv/${tmdbId}?s=${season}&e=${episode}`,
};

/**
 * vidrock.net embed source.
 * Movies : https://vidrock.net/movie/{tmdb_id}
 * TV     : https://vidrock.net/tv/{tmdb_id}/{season}/{episode}
 */
export const vidrock: SourceConfig = {
  name: "vidrock",
  home: "https://vidrock.net",
  movieUrl: (tmdbId) => `https://vidrock.net/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://vidrock.net/tv/${tmdbId}/${season}/${episode}`,
};

export const SOURCES: Record<string, SourceConfig> = {
  vidsync,
  vidsrc,
  vidnest,
  videasy,
  cinesrc,
  vidrock,
};

export function sourceList(): SourceConfig[] {
  return Object.values(SOURCES);
}

export function sourceOf(sourceKey: string): SourceConfig {
  return SOURCES[sourceKey] ?? vidsync;
}

export function embedUrl(
  sourceKey: string,
  mediaType: MediaType,
  tmdbId: number,
  season?: number,
  episode?: number,
): string {
  const source = sourceOf(sourceKey);
  if (mediaType === "tv") {
    const s = season ?? 1;
    const e = episode ?? 1;
    return source.tvUrl(tmdbId, s, e);
  }
  return source.movieUrl(tmdbId);
}

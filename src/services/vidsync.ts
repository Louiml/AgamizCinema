import type { MediaType } from "@/types/tmdb";

export interface SourceConfig {
  name: string;
  home: string;
  movieUrl: (tmdbId: number) => string;
  tvUrl: (tmdbId: number, season: number, episode: number) => string;
  /** Best non-embed page for "open in source" (browser download). Falls back to home. */
  watchMovieUrl?: (tmdbId: number) => string;
  watchTvUrl?: (tmdbId: number, season: number, episode: number) => string;
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
  watchMovieUrl: (tmdbId) => `https://vidsrc.to/movie/${tmdbId}`,
  watchTvUrl: (tmdbId, season, episode) =>
    `https://vidsrc.to/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * vidnest.fun source.
 * Movies : https://vidnest.fun/movie/{tmdb_id}
 * TV     : https://vidnest.fun/tv/{tmdb_id}/{season}/{episode}
 */
export const vidnest: SourceConfig = {
  name: "vidnest",
  home: "https://vidnest.fun",
  movieUrl: (tmdbId) => `https://vidnest.fun/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://vidnest.fun/tv/${tmdbId}/${season}/${episode}`,
  watchMovieUrl: (tmdbId) => `https://vidnest.fun/movie/${tmdbId}`,
  watchTvUrl: (tmdbId, season, episode) =>
    `https://vidnest.fun/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * player.videasy.net embed source.
 */
export const videasy: SourceConfig = {
  name: "videasy",
  home: "https://player.videasy.net",
  movieUrl: (tmdbId) => `https://player.videasy.net/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * cinesrc.st embed source (default).
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
 * vidrock.net source.
 */
export const vidrock: SourceConfig = {
  name: "vidrock",
  home: "https://vidrock.net",
  movieUrl: (tmdbId) => `https://vidrock.net/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://vidrock.net/tv/${tmdbId}/${season}/${episode}`,
  watchMovieUrl: (tmdbId) => `https://vidrock.net/movie/${tmdbId}`,
  watchTvUrl: (tmdbId, season, episode) =>
    `https://vidrock.net/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * vidcore.net source.
 */
export const vidcore: SourceConfig = {
  name: "vidcore",
  home: "https://vidcore.net",
  movieUrl: (tmdbId) => `https://vidcore.net/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://vidcore.net/tv/${tmdbId}/${season}/${episode}`,
  watchMovieUrl: (tmdbId) => `https://vidcore.net/movie/${tmdbId}`,
  watchTvUrl: (tmdbId, season, episode) =>
    `https://vidcore.net/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * stellar.rip source.
 * Movies : https://stellar.rip/en/watch/embed/movie/{tmdb_id}
 * TV     : https://stellar.rip/en/watch/embed/tv/{tmdb_id}/{season}/{episode}
 */
export const stellar: SourceConfig = {
  name: "stellar",
  home: "https://stellar.rip",
  movieUrl: (tmdbId) => `https://stellar.rip/en/watch/embed/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://stellar.rip/en/watch/embed/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * zxcstream.xyz source.
 * Movies : https://zxcstream.xyz/player/movie/{tmdb_id}
 * TV     : https://zxcstream.xyz/player/tv/{tmdb_id}/{season}/{episode}
 */
export const zxcstream: SourceConfig = {
  name: "zxcstream",
  home: "https://zxcstream.xyz",
  movieUrl: (tmdbId) => `https://zxcstream.xyz/player/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://zxcstream.xyz/player/tv/${tmdbId}/${season}/${episode}`,
};

/**
 * peachify.top source.
 * Movies : https://peachify.top/embed/movie/{tmdb_id}
 * TV     : https://peachify.top/embed/tv/{tmdb_id}/{season}/{episode}
 */
export const peachify: SourceConfig = {
  name: "peachify",
  home: "https://peachify.top",
  movieUrl: (tmdbId) => `https://peachify.top/embed/movie/${tmdbId}`,
  tvUrl: (tmdbId, season, episode) =>
    `https://peachify.top/embed/tv/${tmdbId}/${season}/${episode}`,
};

export const SOURCES: Record<string, SourceConfig> = {
  vidsync,
  vidsrc,
  vidnest,
  videasy,
  cinesrc,
  vidrock,
  vidcore,
  stellar,
  zxcstream,
  peachify,
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

/**
 * Best non-embed page for the source - used by the browser download button so
 * it opens a real watch page (or the source home) instead of a raw embed URL,
 * which renders broken as a top-level document.
 */
export function watchPageUrl(
  sourceKey: string,
  mediaType: MediaType,
  tmdbId: number,
  season?: number,
  episode?: number,
): string {
  const source = sourceOf(sourceKey);
  if (mediaType === "tv" && source.watchTvUrl) {
    return source.watchTvUrl(tmdbId, season ?? 1, episode ?? 1);
  }
  if (mediaType !== "tv" && source.watchMovieUrl) {
    return source.watchMovieUrl(tmdbId);
  }
  return source.home;
}

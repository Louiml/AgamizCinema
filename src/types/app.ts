import type { MediaType } from "./tmdb";

export interface MediaRef {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  releaseDate?: string;
}

export interface WatchlistItem extends MediaRef {
  addedAt: number;
}

export interface HistoryItem extends MediaRef {
  watchedAt: number;
  progress: number;
  season?: number;
  episode?: number;
}

export interface PlayerState {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  season?: number;
  episode?: number;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
}

export type VideoSource =
  | "vidsync"
  | "vidsrc"
  | "vidnest"
  | "videasy"
  | "cinesrc"
  | "vidrock";

export interface AppSettings {
  autoplay: boolean;
  defaultSource: VideoSource;
  glassOpacity: "light" | "medium" | "heavy";
  downloadPath: string;
  discordRpc: boolean;
  showAds: boolean;
  cleanView: boolean;
  autoSkip: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoplay: true,
  defaultSource: "vidsync",
  glassOpacity: "medium",
  downloadPath: "",
  discordRpc: true,
  showAds: true,
  cleanView: false,
  autoSkip: false,
};

export const STORAGE_KEYS = {
  watchlist: "agamiz:watchlist",
  history: "agamiz:history",
  settings: "agamiz:settings",
} as const;

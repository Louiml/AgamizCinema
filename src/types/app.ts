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
  | "vidrock"
  | "vidcore"
  | "stellar"
  | "zxcstream"
  | "peachify";

export type AppTheme = "noir" | "mint" | "rose" | "amber" | "violet" | "azure";
export type ThemeMode = "dark" | "light";

export interface AppSettings {
  autoplay: boolean;
  defaultSource: VideoSource;
  glassOpacity: "off" | "light" | "medium" | "heavy";
  theme: AppTheme;
  themeMode: ThemeMode;
  mangaReaderMode: "scroll" | "paged";
  mangaReadingDirection: "rtl" | "ltr";
  blockPopups: boolean;
  downloadPath: string;
  discordRpc: boolean;
  cleanView: boolean;
  autoSkip: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoplay: true,
  defaultSource: "cinesrc",
  glassOpacity: "off",
  theme: "noir",
  themeMode: "dark",
  mangaReaderMode: "scroll",
  mangaReadingDirection: "rtl",
  blockPopups: true,
  downloadPath: "",
  discordRpc: true,
  cleanView: false,
  autoSkip: false,
};

export const STORAGE_KEYS = {
  watchlist: "agamiz:watchlist",
  history: "agamiz:history",
  settings: "agamiz:settings",
} as const;

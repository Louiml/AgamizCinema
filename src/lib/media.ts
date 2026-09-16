import type { NormalizedMedia } from "@/services/tmdb";
import type { HistoryItem, MediaRef } from "@/types/app";

export function toMediaRef(m: NormalizedMedia): MediaRef {
  return {
    id: m.id,
    mediaType: m.mediaType,
    title: m.title,
    posterPath: m.posterPath,
    backdropPath: m.backdropPath,
    voteAverage: m.voteAverage,
    releaseDate: m.releaseDate,
  };
}

export function toMediaRefFromHistory(h: HistoryItem): MediaRef {
  return {
    id: h.id,
    mediaType: h.mediaType,
    title: h.title,
    posterPath: h.posterPath,
    backdropPath: h.backdropPath,
    voteAverage: h.voteAverage,
    releaseDate: h.releaseDate,
  };
}

export function historyToNormalized(h: HistoryItem): NormalizedMedia {
  return {
    id: h.id,
    mediaType: h.mediaType,
    title: h.title,
    overview: "",
    posterPath: h.posterPath,
    backdropPath: h.backdropPath,
    voteAverage: h.voteAverage,
    voteCount: 0,
    releaseDate: h.releaseDate,
    genreIds: [],
  };
}

export function refToNormalized(m: MediaRef): NormalizedMedia {
  return {
    id: m.id,
    mediaType: m.mediaType,
    title: m.title,
    overview: "",
    posterPath: m.posterPath,
    backdropPath: m.backdropPath,
    voteAverage: m.voteAverage,
    voteCount: 0,
    releaseDate: m.releaseDate,
    genreIds: [],
  };
}

export function formatDuration(minutes?: number): string {
  if (!minutes) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const intervals: Array<[number, string]> = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secondsInUnit, label] of intervals) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) {
      return `${value} ${label}${value === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}

export function formatDate(iso?: string): string {
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

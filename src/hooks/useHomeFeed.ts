import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { tmdb, posterUrl, backdropUrl } from "@/services/tmdb";
import { useAsync } from "@/hooks/useAsync";
import { useHistory } from "@/providers/HistoryProvider";
import { historyToNormalized } from "@/lib/media";
import type { NormalizedMedia } from "@/services/tmdb";

const FALLBACK_POPULAR = "movie";

export interface HomeFeed {
  trending: NormalizedMedia[] | null;
  trendingLoading: boolean;
  popularMovies: NormalizedMedia[] | null;
  popularMoviesLoading: boolean;
  popularTV: NormalizedMedia[] | null;
  popularTVLoading: boolean;
  nowPlaying: NormalizedMedia[] | null;
  nowPlayingLoading: boolean;
  upcoming: NormalizedMedia[] | null;
  upcomingLoading: boolean;
  recommendations: NormalizedMedia[] | null;
  recLoading: boolean;
  genreMap: Map<string, string> | undefined;
  /** The history entry that seeded the "because you watched" row. */
  recSeedTitle: string | null;
  /** Partially-resolved titles still being fetched from TMDB. */
  continueEnriched: NormalizedMedia[];
  continueCount: number;
  continueProgressMap: Map<
    string,
    { progress: number; season?: number; episode?: number }
  >;
}

/**
 * All six TMDB feeds behind the home screen, plus continue-watching hydration.
 *
 * Shared by the classic HomePage and the Netflix home so both designs hit the
 * exact same data with no duplicated request logic. Re-runs on language change
 * and whenever watch history changes (the recommendations row seeds off the
 * most recently watched title).
 */
export function useHomeFeed(): HomeFeed {
  const { i18n } = useTranslation();
  const language = i18n.language;
  const { items: history } = useHistory();

  const { data: trending, loading: trendingLoading } = useAsync(
    () => tmdb.trending(),
    [language],
  );
  const { data: popularMovies, loading: popularMoviesLoading } = useAsync(
    () => tmdb.popular("movie"),
    [language],
  );
  const { data: popularTV, loading: popularTVLoading } = useAsync(
    () => tmdb.popular("tv"),
    [language],
  );
  const { data: nowPlaying, loading: nowPlayingLoading } = useAsync(
    () => tmdb.nowPlaying(),
    [language],
  );
  const { data: upcoming, loading: upcomingLoading } = useAsync(
    () => tmdb.upcoming(),
    [language],
  );
  const { data: genreMap } = useAsync(async () => {
    const [movieGenres, tvGenres] = await Promise.all([
      tmdb.genres("movie"),
      tmdb.genres("tv"),
    ]);
    return new Map<string, string>([
      ...movieGenres.map((g) => [String(g.id), g.name] as const),
      ...tvGenres.map((g) => [String(g.id), g.name] as const),
    ]);
  }, [language]);

  const recSeed = history[0];
  const recDeps = useMemo(
    () => [recSeed?.mediaType ?? "", recSeed?.id ?? 0, language],
    [recSeed?.mediaType, recSeed?.id, language],
  );
  const { data: recommendations, loading: recLoading } = useAsync(async () => {
    if (recSeed) {
      const list = await tmdb.recommendations(recSeed.mediaType, recSeed.id);
      if (list.length > 0) return list;
    }
    return tmdb.popular(FALLBACK_POPULAR);
  }, recDeps);

  const continueWatching = useMemo(
    () => history.filter((h) => h.progress > 0 && h.progress < 98).slice(0, 12),
    [history],
  );

  const continueProgressMap = useMemo(() => {
    const map = new Map<
      string,
      { progress: number; season?: number; episode?: number }
    >();
    for (const h of history) {
      map.set(`${h.mediaType}:${h.id}`, {
        progress: h.progress,
        season: h.season,
        episode: h.episode,
      });
    }
    return map;
  }, [history]);

  // History entries only carry a cached poster; re-fetch so the row shows
  // full-resolution art and a real rating.
  const continueKeys = useMemo(
    () => continueWatching.map((h) => `${h.mediaType}:${h.id}`).join("|"),
    [continueWatching],
  );
  const [continueEnriched, setContinueEnriched] = useState<NormalizedMedia[]>([]);

  useEffect(() => {
    if (continueWatching.length === 0) {
      setContinueEnriched([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      continueWatching.map((h) =>
        tmdb.details(h.mediaType, h.id).catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      setContinueEnriched(
        continueWatching.map((h, i) => {
          const d = results[i];
          const base = historyToNormalized(h);
          return {
            ...base,
            title: d?.title ?? d?.name ?? base.title,
            posterPath: d?.poster_path ? posterUrl(d.poster_path, "w342") : base.posterPath,
            backdropPath: d?.backdrop_path
              ? backdropUrl(d.backdrop_path)
              : base.backdropPath,
            voteAverage: d?.vote_average ?? base.voteAverage,
            releaseDate: d?.release_date ?? d?.first_air_date ?? base.releaseDate,
          };
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [continueKeys, language]);

  return {
    trending,
    trendingLoading,
    popularMovies,
    popularMoviesLoading,
    popularTV,
    popularTVLoading,
    nowPlaying,
    nowPlayingLoading,
    upcoming,
    upcomingLoading,
    recommendations,
    recLoading,
    genreMap: genreMap ?? undefined,
    recSeedTitle: recSeed?.title ?? null,
    continueEnriched,
    continueCount: continueWatching.length,
    continueProgressMap,
  };
}
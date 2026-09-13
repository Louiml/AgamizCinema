import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Flame, Sparkles, History, PlayCircle, Clapperboard, CalendarClock } from "lucide-react";
import { tmdb, posterUrl, backdropUrl } from "@/services/tmdb";
import { useAsync } from "@/hooks/useAsync";
import { useHistory } from "@/providers/HistoryProvider";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { TopTenRow } from "@/components/home/TopTenRow";
import { MediaRow } from "@/components/media/MediaRow";
import { historyToNormalized } from "@/lib/media";
import { PageLoader } from "@/components/ui/Spinner";
import type { NormalizedMedia } from "@/services/tmdb";

const FALLBACK_POPULAR = "movie";

export function HomePage() {
  const { t, i18n } = useTranslation();
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
            posterPath:
              d?.poster_path
                ? posterUrl(d.poster_path, "w342")
                : base.posterPath,
            backdropPath: d?.backdrop_path
              ? backdropUrl(d.backdrop_path)
              : base.backdropPath,
            voteAverage: d?.vote_average ?? base.voteAverage,
            releaseDate:
              d?.release_date ?? d?.first_air_date ?? base.releaseDate,
          };
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [continueKeys, language]);

  if (trendingLoading && !trending) {
    return <PageLoader label={t("home.preparing")} />;
  }

  return (
    <div className="space-y-16 pb-10">
      {trending && trending.length > 0 && <HeroCarousel items={trending} genreMap={genreMap ?? undefined} />}

      {continueWatching.length > 0 && (
        <MediaRow
          title={t("home.continueWatching")}
          subtitle={t("home.continueWatchingSubtitle")}
          icon={<History className="h-5 w-5" />}
          media={continueEnriched}
          progressMap={continueProgressMap}
          loading={continueEnriched.length !== continueWatching.length}
        />
      )}

      <MediaRow
        title={t("home.trendingToday")}
        subtitle={t("home.trendingTodaySubtitle")}
        icon={<Flame className="h-5 w-5" />}
        media={trending ?? []}
        loading={trendingLoading}
      />

      {trending && trending.length >= 10 && (
        <TopTenRow
          title={t("home.top10")}
          subtitle={t("home.top10Subtitle")}
          media={trending}
        />
      )}

      <MediaRow
        title={t("home.popularMovies")}
        subtitle={t("home.popularMoviesSubtitle")}
        icon={<TrendingUp className="h-5 w-5" />}
        media={popularMovies ?? []}
        loading={popularMoviesLoading}
      />

      <MediaRow
        title={t("home.popularSeries")}
        subtitle={t("home.popularSeriesSubtitle")}
        icon={<PlayCircle className="h-5 w-5" />}
        media={popularTV ?? []}
        loading={popularTVLoading}
      />

      <MediaRow
        title={t("home.nowPlaying")}
        subtitle={t("home.nowPlayingSubtitle")}
        icon={<Clapperboard className="h-5 w-5" />}
        media={nowPlaying ?? []}
        loading={nowPlayingLoading}
      />

      <MediaRow
        title={t("home.upcoming")}
        subtitle={t("home.upcomingSubtitle")}
        icon={<CalendarClock className="h-5 w-5" />}
        media={upcoming ?? []}
        loading={upcomingLoading}
      />

      <MediaRow
        title={t("home.basedOnSeen")}
        subtitle={
          recSeed
            ? t("home.becauseYouWatched", { title: recSeed.title })
            : t("home.tasteIntro")
        }
        icon={<Sparkles className="h-5 w-5" />}
        media={recommendations ?? []}
        loading={recLoading}
      />
    </div>
  );
}

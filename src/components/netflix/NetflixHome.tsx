import { useTranslation } from "react-i18next";
import { useHomeFeed } from "@/hooks/useHomeFeed";
import { PageLoader } from "@/components/ui/Spinner";
import { NetflixHero } from "./NetflixHero";
import { NetflixRow } from "./NetflixRow";
import { NetflixTopTenRow } from "./NetflixTopTenRow";

/**
 * Netflix home: one hero, then a stack of rails.
 *
 * Reads the exact same feed as the classic HomePage via useHomeFeed, so the
 * two designs never drift apart on data.
 */
export function NetflixHome() {
  const { t } = useTranslation();
  const feed = useHomeFeed();

  if (feed.trendingLoading && !feed.trending) {
    return <PageLoader label={t("home.preparing")} />;
  }

  const {
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
    genreMap,
    recSeedTitle,
    continueEnriched,
    continueCount,
    continueProgressMap,
  } = feed;

  return (
    <div className="space-y-10 pb-10">
      {trending && trending.length > 0 && (
        <NetflixHero items={trending} genreMap={genreMap ?? undefined} />
      )}

      {continueCount > 0 && (
        <NetflixRow
          title={t("home.continueWatching")}
          subtitle={t("home.continueWatchingSubtitle")}
          media={continueEnriched}
          size="landscape"
          progressMap={continueProgressMap}
          loading={continueEnriched.length !== continueCount}
        />
      )}

      <NetflixRow
        title={t("home.trendingToday")}
        subtitle={t("home.trendingTodaySubtitle")}
        media={trending ?? []}
        loading={trendingLoading}
      />

      {trending && trending.length >= 10 && (
        <NetflixTopTenRow
          title={t("home.top10")}
          subtitle={t("home.top10Subtitle")}
          media={trending}
        />
      )}

      <NetflixRow
        title={t("home.popularMovies")}
        subtitle={t("home.popularMoviesSubtitle")}
        media={popularMovies ?? []}
        loading={popularMoviesLoading}
      />

      <NetflixRow
        title={t("home.popularSeries")}
        subtitle={t("home.popularSeriesSubtitle")}
        media={popularTV ?? []}
        loading={popularTVLoading}
      />

      <NetflixRow
        title={t("home.nowPlaying")}
        subtitle={t("home.nowPlayingSubtitle")}
        media={nowPlaying ?? []}
        loading={nowPlayingLoading}
      />

      <NetflixRow
        title={t("home.upcoming")}
        subtitle={t("home.upcomingSubtitle")}
        media={upcoming ?? []}
        loading={upcomingLoading}
      />

      <NetflixRow
        title={t("home.basedOnSeen")}
        subtitle={
          recSeedTitle
            ? t("home.becauseYouWatched", { title: recSeedTitle })
            : t("home.tasteIntro")
        }
        media={recommendations ?? []}
        loading={recLoading}
      />
    </div>
  );
}
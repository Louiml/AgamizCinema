import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Film,
  Tv,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { tmdb, type NormalizedMedia } from "@/services/tmdb";
import type { MediaType } from "@/types/tmdb";
import { useAsync } from "@/hooks/useAsync";
import { MediaCard } from "@/components/media/MediaCard";
import { RowSkeleton } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { FilterSheet } from "@/components/discover/FilterSheet";

type SortKey = "popularity.desc" | "popularity.asc" | "date.desc" | "date.asc" | "rating.desc" | "rating.asc";

const SORT_KEYS: SortKey[] = [
  "popularity.desc",
  "popularity.asc",
  "date.desc",
  "date.asc",
  "rating.desc",
  "rating.asc",
];

const SORT_LABEL_KEYS: Record<SortKey, string> = {
  "popularity.desc": "discover.sort.popularityDesc",
  "popularity.asc": "discover.sort.popularityAsc",
  "date.desc": "discover.sort.dateDesc",
  "date.asc": "discover.sort.dateAsc",
  "rating.desc": "discover.sort.ratingDesc",
  "rating.asc": "discover.sort.ratingAsc",
};

function sortParam(type: MediaType, key: SortKey): string {
  switch (key) {
    case "popularity.desc":
      return "popularity.desc";
    case "popularity.asc":
      return "popularity.asc";
    case "rating.desc":
      return "vote_average.desc";
    case "rating.asc":
      return "vote_average.asc";
    case "date.desc":
      return type === "tv" ? "first_air_date.desc" : "primary_release_date.desc";
    case "date.asc":
      return type === "tv" ? "first_air_date.asc" : "primary_release_date.asc";
  }
}

export function DiscoverPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const [type, setType] = useState<MediaType>("movie");
  const [genres, setGenres] = useState<number[]>([]);
  const [sort, setSort] = useState<SortKey>("popularity.desc");
  const [page, setPage] = useState(1);
  const [all, setAll] = useState<NormalizedMedia[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sortOptions = SORT_KEYS.map((key) => ({
    key,
    label: t(SORT_LABEL_KEYS[key]),
  }));

  const { data: genreList, loading: genresLoading } = useAsync(
    () => tmdb.genres(type),
    [type, language],
  );

  const fetchPage = useCallback(
    async (pageNum: number) => {
      const res = await tmdb.discover(type, {
        genres,
        sort: sortParam(type, sort),
        page: pageNum,
      });
      return res;
    },
    [type, genres, sort],
  );

  const { loading, error, reload } = useAsync(async () => {
    const res = await fetchPage(1);
    setAll(res.results);
    setTotalPages(res.totalPages);
    setPage(1);
    return res;
  }, [type, genres, sort, language]);

  useEffect(() => {
    setAll([]);
  }, [type]);

  const loadMore = async () => {
    const next = page + 1;
    const res = await fetchPage(next);
    setAll((prev) => [...prev, ...res.results]);
    setPage(next);
  };

  const toggleGenre = (id: number) => {
    setGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const isActive = (id: number) => genres.includes(id);

  const activeFilterCount =
    genres.length + (sort !== "popularity.desc" ? 1 : 0);

  const resetAll = () => {
    setGenres([]);
    setSort("popularity.desc");
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Heading */}
      <div className="animate-fade-in-up">
        <h1 className="heading-display text-3xl text-paper sm:text-4xl">{t("discover.title")}</h1>
        <p className="mt-1.5 text-sm text-ash">{t("discover.subtitle")}</p>
      </div>

      {/* Type switcher */}
      <div className="glass-panel flex w-fit items-center gap-1 rounded-2xl p-1.5 animate-fade-in-up">
        {(
          [
            { id: "movie", labelKey: "discover.movies", icon: Film },
            { id: "tv", labelKey: "discover.tvSeries", icon: Tv },
          ] as const
        ).map((tab) => {
          const active = type === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setType(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-ui ease-spring active:scale-[0.97] active:duration-press ${
                active
                  ? "bg-mint-500 text-ink shadow-glow-soft"
                  : "text-ash hover:text-paper"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Filters & Sort — desktop sticky inline row (hidden on mobile) */}
      <div className="sticky top-14 z-30 hidden flex-wrap items-center justify-between gap-4 rounded-2xl py-3 animate-fade-in-up md:flex">
        <div className="glass-panel -mx-2 flex flex-1 flex-wrap items-center gap-2 rounded-2xl px-2 py-2">
          <button
            onClick={() => setGenres([])}
            className={`chip ${genres.length === 0 ? "chip-active" : ""}`}
          >
            {t("discover.all")}
          </button>
          {genresLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="h-8 w-20 animate-pulse rounded-full bg-white/5"
              />
            ))}
          {(genreList ?? []).map((g) => (
            <button
              key={g.id}
              onClick={() => toggleGenre(g.id)}
              className={`chip ${isActive(g.id) ? "chip-active" : ""}`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <GlassSelect
          value={sort}
          onChange={setSort}
          options={sortOptions.map((o) => ({ value: o.key, label: o.label }))}
          leadingIcon={SlidersHorizontal}
          trailingIcon={ChevronDown}
          ariaLabel={t("discover.sortBy")}
        />
      </div>

      {/* Filters & Sort — mobile trigger + bottom sheet */}
      <div className="animate-fade-in-up md:hidden">
        <button
          onClick={() => setSheetOpen(true)}
          className="glass-panel flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-paper transition-all duration-ui ease-spring active:scale-[0.98] active:duration-press hover:border-mint-500/30"
        >
          <SlidersHorizontal className="h-4 w-4 text-mint-400" />
          {t("discover.filtersSort")}
          {activeFilterCount > 0 && (
            <span className="glass-mint flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-mint-300">
              {activeFilterCount}
            </span>
          )}
        </button>
        <FilterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={t("discover.filtersSort")}
          genres={genreList ?? []}
          selectedGenres={genres}
          onToggleGenre={toggleGenre}
          sort={sort}
          onSelectSort={setSort}
          sortOptions={sortOptions}
          onReset={resetAll}
          activeCount={activeFilterCount}
        />
      </div>

      {/* Active filter summary */}
      {(genres.length > 0 || sort !== "popularity.desc") && (
        <div className="hidden flex-wrap items-center gap-2 text-xs text-ash animate-fade-in md:flex">
          <span>{t("discover.activeFilters")}</span>
          {genres.length > 0 && (
            <span className="chip px-3 py-1">
              {t("discover.genresCount", { count: genres.length })}
            </span>
          )}
          {sort !== "popularity.desc" && (
            <span className="chip px-3 py-1">
              {sortOptions.find((o) => o.key === sort)?.label}
            </span>
          )}
          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-mint-300 transition-colors hover:text-mint-400"
          >
            <RefreshCw className="h-3 w-3" /> {t("discover.reset")}
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <RowSkeleton count={10} />
      ) : error ? (
        <EmptyState
          icon={RefreshCw}
          title={t("discover.couldntLoad")}
          description={error.message}
          action={<button onClick={reload} className="btn-glass">{t("discover.tryAgain")}</button>}
        />
      ) : all.length === 0 ? (
        <EmptyState
          icon={type === "movie" ? Film : Tv}
          title={t("discover.noMatch")}
          description={t("discover.noMatchDesc")}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {all.map((m, i) => (
              <MediaCard key={`${type}:${m.id}`} media={m} index={i} />
            ))}
          </div>
          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <button onClick={() => void loadMore()} className="btn-glass px-8">
                <ChevronDown className="h-4 w-4" /> {t("discover.loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

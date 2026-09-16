import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, ChevronDown, RefreshCw } from "lucide-react";
import {
  mangaTags,
  mangaLangFor,
  searchManga,
  type MangaSummary,
  type MangaTag,
  type MangaChapter,
} from "@/services/manga";
import { MangaCard } from "@/components/manga/MangaCard";
import { MangaDetailsModal } from "@/components/manga/MangaDetailsModal";
import { MangaReader } from "@/components/manga/MangaReader";
import { EmptyState } from "@/components/ui/EmptyState";
import { RowSkeleton } from "@/components/ui/Spinner";
import { GlassSelect } from "@/components/ui/GlassSelect";

type MangaSort = "followedCount" | "rating" | "year" | "latest";

const STATUS_OPTIONS = ["ongoing", "completed", "hiatus", "cancelled"] as const;

export function DiscoverManga() {
  const { t, i18n } = useTranslation();
  const langs = [mangaLangFor(i18n.language)];
  const [tags, setTags] = useState<MangaTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [sort, setSort] = useState<MangaSort>("followedCount");
  const [results, setResults] = useState<MangaSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openManga, setOpenManga] = useState<MangaSummary | null>(null);
  const [openMangaId, setOpenMangaId] = useState<string | null>(null);
  const [readerChapter, setReaderChapter] = useState<{ manga: MangaSummary; chapter: MangaChapter } | null>(null);
  const [chaptersCache, setChaptersCache] = useState<MangaChapter[]>([]);

  useEffect(() => {
    mangaTags()
      .then(setTags)
      .catch(() => undefined);
  }, []);

  const fetchPage = useCallback(
    async (offset: number) => {
      return searchManga({
        tagIds: selectedTags,
        status: status || undefined,
        order: sort,
        offset,
        limit: 24,
        langs,
      });
    },
    [selectedTags, status, sort, langs],
  );

  useEffect(() => {

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(0)
      .then((res) => {
        if (cancelled) return;
        setResults(res.results);
        setTotal(res.total);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : t("discover.couldntLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags, status, sort, i18n.language]);

  const loadMore = async () => {
    try {
      const res = await fetchPage(results.length);
      setResults((prev) => [...prev, ...res.results]);
    } catch {
      /* ignore */
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const resetFilters = () => {
    setSelectedTags([]);
    setStatus("");
    setSort("followedCount");
  };

  const activeCount = selectedTags.length + (status ? 1 : 0) + (sort !== "followedCount" ? 1 : 0);

  const sortOptions: Array<{ value: MangaSort; label: string }> = [
    { value: "followedCount", label: t("manga.sortFollows") },
    { value: "rating", label: t("manga.sortRating") },
    { value: "year", label: t("manga.sortYear") },
    { value: "latest", label: t("manga.sortLatest") },
  ];

  const onOpenManga = (m: MangaSummary) => {
    setOpenManga(m);
    setOpenMangaId(m.id);
    setChaptersCache([]);
  };

  const onRead = (m: MangaSummary, chapter: MangaChapter, chapters: MangaChapter[]) => {
    setChaptersCache(chapters);
    setReaderChapter({ manga: m, chapter });
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="surface-dark -mx-2 flex flex-1 flex-wrap items-center gap-2 rounded-pill px-2 py-2">
          <button
            onClick={resetFilters}
            className={`chip ${activeCount === 0 ? "chip-active" : ""}`}
          >
            {t("discover.all")}
          </button>
          {tags.slice(0, 10).map((tg) => (
            <button
              key={tg.id}
              onClick={() => toggleTag(tg.id)}
              className={`chip ${selectedTags.includes(tg.id) ? "chip-active" : ""}`}
            >
              {tg.name}
            </button>
          ))}
        </div>
        <GlassSelect
          value={status}
          onChange={setStatus}
          options={[{ value: "", label: t("discover.all") }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: t(`manga.status_${s}`) }))]}
          ariaLabel={t("manga.status")}
        />
        <GlassSelect
          value={sort}
          onChange={setSort}
          options={sortOptions.map((o) => ({ value: o.value, label: o.label }))}
          ariaLabel={t("discover.sortBy")}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <RowSkeleton count={10} />
      ) : error ? (
        <EmptyState
          icon={RefreshCw}
          title={t("discover.couldntLoad")}
          description={error}
          action={
            <button onClick={resetFilters} className="btn-outline-on-dark">
              {t("discover.reset")}
            </button>
          }
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("manga.noResults")}
          description={t("manga.noResultsDesc")}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((m, i) => (
              <MangaCard key={m.id} manga={m} index={i} onOpen={onOpenManga} />
            ))}
          </div>
          {results.length < total && (
            <div className="flex justify-center pt-4">
              <button onClick={() => void loadMore()} className="btn-outline-on-dark px-8">
                <ChevronDown className="h-4 w-4" /> {t("discover.loadMore")}
              </button>
            </div>
          )}
        </>
      )}

      {/* Details modal */}
      {openMangaId && (
        <MangaDetailsModal
          mangaId={openMangaId}
          initial={openManga}
          langs={langs}
          onClose={() => {
            setOpenMangaId(null);
            setOpenManga(null);
          }}
          onRead={onRead}
        />
      )}

      {/* Reader */}
      {readerChapter && (
        <MangaReader
          manga={readerChapter.manga}
          chapter={readerChapter.chapter}
          chapters={chaptersCache}
          onClose={() => setReaderChapter(null)}
        />
      )}
    </div>
  );
}

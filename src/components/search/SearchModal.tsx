import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  TrendingUp,
  Film,
  Tv,
  User,
  BookOpen,
  SearchX,
  Loader2,
  Clock,
  Trash2,
} from "lucide-react";
import { tmdb, profileUrl, type NormalizedMedia, type NormalizedPerson } from "@/services/tmdb";
import { searchManga, mangaLangFor, type MangaSummary, type MangaChapter } from "@/services/manga";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlayer } from "@/providers/TMDBProvider";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { MangaDetailsModal } from "@/components/manga/MangaDetailsModal";
import { MangaReader } from "@/components/manga/MangaReader";
import { ActorProfileModal } from "@/components/actor/ActorProfileModal";
import type { Cast } from "@/types/tmdb";

const RECENT_KEY = "agamiz:recentSearches";
const RECENT_MAX = 6;

type SearchType = "all" | "movie" | "tv" | "person" | "manga";

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    /* ignore */
  }
}

function pushRecent(query: string) {
  const q = query.trim();
  if (!q) return;
  const next = [q, ...loadRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())];
  saveRecent(next);
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [people, setPeople] = useState<NormalizedPerson[]>([]);
  const [mangaResults, setMangaResults] = useState<MangaSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [mangaLoading, setMangaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trending, setTrending] = useState<NormalizedMedia[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [openManga, setOpenManga] = useState<{ id: string; manga: MangaSummary | null } | null>(null);
  const [openPerson, setOpenPerson] = useState<Cast | null>(null);
  const [readerState, setReaderState] = useState<{ manga: MangaSummary; chapter: MangaChapter; chapters: MangaChapter[] } | null>(null);
  const debounced = useDebounce(query, 350);
  const inputRef = useRef<HTMLInputElement>(null);
  const { open: openPlayer } = usePlayer();
  const mangaLangs = [mangaLangFor(i18n.language)];

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setPeople([]);
      setMangaResults([]);
      setError(null);
      setRecent(loadRecent());
      setOpenManga(null);
      setOpenPerson(null);
      setReaderState(null);
      window.setTimeout(() => inputRef.current?.focus(), 60);
      if (trending.length === 0) {
        tmdb.trending().then(setTrending).catch(() => undefined);
      }
    }
  }, [open]);

  // TMDB search - branch by the active type filter
  useEffect(() => {
    if (!open || !debounced.trim() || searchType === "manga") {
      setResults([]);
      setPeople([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const run = async () => {
      try {
        if (searchType === "movie") {
          const media = await tmdb.searchMovies(debounced);
          if (!cancelled) { setResults(media); setPeople([]); }
        } else if (searchType === "tv") {
          const media = await tmdb.searchTv(debounced);
          if (!cancelled) { setResults(media); setPeople([]); }
        } else if (searchType === "person") {
          const found = await tmdb.searchPeople(debounced);
          if (!cancelled) { setResults([]); setPeople(found); }
        } else {
          const res = await tmdb.search(debounced);
          if (!cancelled) { setResults(res.media); setPeople(res.people); }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("search.failed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [debounced, open, t, searchType]);

  // Manga search (works everywhere via CORS proxies on the web)
  useEffect(() => {
    if (!open || !debounced.trim() || (searchType !== "all" && searchType !== "manga")) {
      setMangaResults([]);
      return;
    }
    const langs = [mangaLangFor(i18n.language)];
    let cancelled = false;
    setMangaLoading(true);
    searchManga({ title: debounced, langs, limit: 8 })
      .then((res) => {
        if (!cancelled) setMangaResults(res.results);
      })
      .catch(() => {
        if (!cancelled) setMangaResults([]);
      })
      .finally(() => {
        if (!cancelled) setMangaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open, searchType, i18n.language]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !openManga && !readerState && !openPerson) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, openManga, readerState, openPerson]);

  if (!open) return null;

  const showEmptyHint = !debounced.trim();
  const hasMedia = results.length > 0;
  const hasPeople = people.length > 0;
  const hasManga = mangaResults.length > 0;

  const hasResultsForType =
    searchType === "all"
      ? hasMedia || hasPeople || hasManga
      : searchType === "person"
        ? hasPeople
        : searchType === "manga"
          ? hasManga
          : hasMedia;

  const noResults = !!debounced.trim() && !loading && !mangaLoading && !error && !hasResultsForType;

  const handleSelect = (m: NormalizedMedia) => {
    pushRecent(query || m.title);
    setRecent(loadRecent());
    onClose();
    window.setTimeout(() => {
      openPlayer({ tmdbId: m.id, mediaType: m.mediaType, title: m.title });
    }, 150);
  };

  const handleMangaSelect = (m: MangaSummary) => {
    pushRecent(query || m.title);
    setRecent(loadRecent());
    setOpenManga({ id: m.id, manga: m });
  };

  const handlePersonSelect = (p: NormalizedPerson) => {
    pushRecent(query || p.name);
    setRecent(loadRecent());
    setOpenPerson({
      id: p.id,
      name: p.name,
      character: undefined,
      profile_path: p.profilePath,
      order: 0,
      known_for_department: p.department || undefined,
    });
  };

  const handlePickRecent = (q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  };

  const clearRecent = () => {
    saveRecent([]);
    setRecent([]);
  };

  const typePills: Array<{ id: SearchType; label: string; icon: typeof Film }> = [
    { id: "all", label: t("discover.all"), icon: Search },
    { id: "movie", label: t("discover.movies"), icon: Film },
    { id: "tv", label: t("discover.tvSeries"), icon: Tv },
    { id: "person", label: t("search.actors"), icon: User },
    { id: "manga", label: t("discover.manga"), icon: BookOpen },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10vh] animate-fade-in"
        onClick={() => {
          if (!openManga && !readerState && !openPerson) onClose();
        }}
      >
        <div
          className="surface-dark w-full max-w-2xl overflow-hidden rounded-lg shadow-elev-4 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
            <Search className="h-5 w-5 shrink-0 text-on-primary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.searchPlaceholder")}
              className="w-full bg-transparent text-base text-on-primary placeholder-shade-50 focus:outline-none"
            />
            {loading || mangaLoading ? (
              <Loader2 className="h-5 w-5 animate-spin-slow text-on-primary" />
            ) : (
              <button
                onClick={onClose}
                aria-label={t("common.close")}
                className="btn-icon h-9 w-9"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type pills */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-white/[0.06] px-4 py-2">
            {typePills.map((tp) => {
              const Icon = tp.icon;
              return (
                <button
                  key={tp.id}
                  onClick={() => setSearchType(tp.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-all duration-ui ${
                    searchType === tp.id
                      ? "bg-accent text-accent-on"
                      : "text-shade-40 hover:text-on-primary"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tp.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="max-h-[52vh] overflow-y-auto p-2">
            {showEmptyHint && (
              <div className="space-y-4 px-2 py-4">
                {recent.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between px-2">
                      <span className="eyebrow flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {t("search.recent")}
                      </span>
                      <button
                        onClick={clearRecent}
                        className="flex items-center gap-1 text-xs text-shade-50 transition-colors hover:text-rose-300"
                      >
                        <Trash2 className="h-3 w-3" /> {t("search.clearRecent")}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 px-2">
                      {recent.map((q) => (
                        <button key={q} onClick={() => handlePickRecent(q)} className="chip">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="mb-2 flex items-center gap-1.5 px-2 eyebrow">
                    <TrendingUp className="h-3.5 w-3.5" /> {t("search.trending")}
                  </span>
                  <div className="space-y-0.5">
                    {trending.length === 0
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                            <div className="h-12 w-8 animate-pulse rounded-md bg-white/5" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 w-32 animate-pulse rounded bg-white/5" />
                              <div className="h-2.5 w-20 animate-pulse rounded bg-white/5" />
                            </div>
                          </div>
                        ))
                      : trending.slice(0, 6).map((m) => (
                          <button
                            key={`${m.mediaType}:${m.id}`}
                            onClick={() => handleSelect(m)}
                            className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-white/[0.06]"
                          >
                            <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md bg-white/[0.04]">
                              {m.posterPath ? (
                                <img src={m.posterPath} alt="" loading="lazy" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-shade-50">
                                  {m.mediaType === "tv" ? <Tv className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-on-primary">{m.title}</p>
                              <p className="text-xs text-shade-40">
                                {m.mediaType === "tv" ? t("common.tvSeries") : t("common.movie")}
                                {m.releaseDate ? ` · ${m.releaseDate.slice(0, 4)}` : ""}
                              </p>
                            </div>
                            <RatingBadge rating={m.voteAverage} size="sm" />
                          </button>
                        ))}
                  </div>
                </div>
              </div>
            )}

            {noResults && (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <SearchX className="h-8 w-8 text-shade-70" />
                <p className="text-sm text-shade-40">{t("search.noResults", { query: debounced })}</p>
              </div>
            )}

            {error && (
              <div className="px-4 py-8 text-center text-sm text-rose-300">
                {t("search.apiKeyHint", { message: error })}
              </div>
            )}

            {/* Movies & TV results */}
            {hasMedia && (
              <div className="mb-1">
                {searchType === "all" && (
                  <p className="eyebrow px-3 pt-2 pb-1">{t("discover.movies")} & {t("discover.tvSeries")}</p>
                )}
                {results.map((m, i) => (
                  <button
                    key={`${m.mediaType}:${m.id}`}
                    onClick={() => handleSelect(m)}
                    className="group flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/[0.06] animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  >
                    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-white/[0.04]">
                      {m.posterPath ? (
                        <img src={m.posterPath} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-shade-50">
                          {m.mediaType === "tv" ? <Tv className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-on-primary">{m.title}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-shade-40">
                        <span className="flex items-center gap-1 uppercase tracking-wide">
                          {m.mediaType === "tv" ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                          {m.mediaType === "tv" ? t("common.tvSeries") : t("common.movie")}
                        </span>
                        {m.releaseDate && <span>{m.releaseDate.slice(0, 4)}</span>}
                      </p>
                    </div>
                    <RatingBadge rating={m.voteAverage} size="sm" />
                  </button>
                ))}
              </div>
            )}

            {/* Actor results */}
            {hasPeople && (
              <div className="mb-1">
                {searchType === "all" && (
                  <p className="eyebrow flex items-center gap-1.5 px-3 pt-2 pb-1">
                    <User className="h-3.5 w-3.5" /> {t("search.actors")}
                  </p>
                )}
                {people.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => handlePersonSelect(p)}
                    className="group flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/[0.06] animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  >
                    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-white/[0.04]">
                      {p.profilePath ? (
                        <img
                          src={profileUrl(p.profilePath) ?? ""}
                          alt=""
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-shade-50">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-on-primary">{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-shade-40">
                        {p.department}
                        {p.knownFor.length > 0 && (
                          <span className="text-shade-50"> · {p.knownFor.join(", ")}</span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Manga results */}
            {hasManga && (searchType === "all" || searchType === "manga") && (
              <div className="mb-1">
                {searchType === "all" && (
                  <p className="eyebrow flex items-center gap-1.5 px-3 pt-2 pb-1">
                    <BookOpen className="h-3.5 w-3.5" /> {t("discover.manga")}
                  </p>
                )}
                {mangaResults.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => handleMangaSelect(m)}
                    className="group flex w-full items-center gap-4 rounded-md px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/[0.06] animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  >
                    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-white/[0.04]">
                      {m.coverUrl ? (
                        <img src={m.coverUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-shade-50">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-on-primary">{m.title}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-shade-40">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {t("discover.manga")}
                        </span>
                        {m.year && <span>{m.year}</span>}
                        {m.follows > 0 && <span>· {m.follows > 999 ? `${(m.follows / 1000).toFixed(0)}k` : m.follows} follows</span>}
                      </p>
                    </div>
                    {m.rating > 0 && (
                      <RatingBadge rating={m.rating} size="sm" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actor profile modal */}
      {openPerson && (
        <ActorProfileModal person={openPerson} onClose={() => setOpenPerson(null)} />
      )}

      {/* Manga details modal */}
      {openManga && (
        <MangaDetailsModal
          mangaId={openManga.id}
          initial={openManga.manga}
          langs={mangaLangs}
          onClose={() => setOpenManga(null)}
          onRead={(manga, chapter, chapters) => {
            setOpenManga(null);
            setReaderState({ manga, chapter, chapters });
          }}
        />
      )}

      {/* Manga reader */}
      {readerState && (
        <MangaReader
          manga={readerState.manga}
          chapter={readerState.chapter}
          chapters={readerState.chapters}
          onClose={() => setReaderState(null)}
        />
      )}
    </>
  );
}

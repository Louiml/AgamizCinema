import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, TrendingUp, Film, Tv, SearchX, Loader2, Clock, Trash2 } from "lucide-react";
import { tmdb, type NormalizedMedia } from "@/services/tmdb";
import { useDebounce } from "@/hooks/useDebounce";
import { usePlayer } from "@/providers/TMDBProvider";
import { RatingBadge } from "@/components/ui/RatingBadge";

const RECENT_KEY = "agamiz:recentSearches";
const RECENT_MAX = 6;

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
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trending, setTrending] = useState<NormalizedMedia[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const debounced = useDebounce(query, 350);
  const inputRef = useRef<HTMLInputElement>(null);
  const { open: openPlayer } = usePlayer();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setError(null);
      setRecent(loadRecent());
      window.setTimeout(() => inputRef.current?.focus(), 60);
      if (trending.length === 0) {
        tmdb.trending().then(setTrending).catch(() => undefined);
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open || !debounced.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    tmdb
      .search(debounced)
      .then((res) => {
        if (!cancelled) setResults(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("search.failed"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open, t]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const showEmptyHint = !debounced.trim();
  const noResults = debounced.trim() && !loading && !error && results.length === 0;

  const handleSelect = (m: NormalizedMedia) => {
    pushRecent(query || m.title);
    setRecent(loadRecent());
    onClose();
    window.setTimeout(() => {
      openPlayer({
        tmdbId: m.id,
        mediaType: m.mediaType,
        title: m.title,
      });
    }, 150);
  };

  const handlePickRecent = (q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  };

  const clearRecent = () => {
    saveRecent([]);
    setRecent([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-deep/70 px-4 pt-[10vh] backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-2xl overflow-hidden rounded-3xl shadow-pop animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-mint-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.searchPlaceholder")}
            className="w-full bg-transparent text-base text-paper placeholder-ash-dim focus:outline-none"
          />
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin-slow text-mint-400" />
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

        {/* Body */}
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {showEmptyHint && (
            <div className="space-y-4 px-2 py-4">
              {/* Recent searches */}
              {recent.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ash">
                      <Clock className="h-3.5 w-3.5" /> {t("search.recent")}
                    </span>
                    <button
                      onClick={clearRecent}
                      className="flex items-center gap-1 text-xs text-ash-dim transition-colors hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" /> {t("search.clearRecent")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-2">
                    {recent.map((q) => (
                      <button
                        key={q}
                        onClick={() => handlePickRecent(q)}
                        className="chip"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Trending suggestions */}
              <div>
                <span className="mb-2 flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-widest text-ash">
                  <TrendingUp className="h-3.5 w-3.5" /> {t("search.trending")}
                </span>
                <div className="space-y-0.5">
                  {trending.length === 0
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                          <div className="h-12 w-8 animate-pulse rounded-lg bg-white/5" />
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
                          className="group flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors duration-150 hover:bg-white/[0.06]"
                        >
                          <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                            {m.posterPath ? (
                              <img
                                src={m.posterPath}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-ash-dim">
                                {m.mediaType === "tv" ? <Tv className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-paper group-hover:text-mint-300">
                              {m.title}
                            </p>
                            <p className="text-xs text-ash">
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
              <SearchX className="h-8 w-8 text-mint-500/50" />
              <p className="text-sm text-ash">{t("search.noResults", { query: debounced })}</p>
            </div>
          )}

          {error && (
            <div className="px-4 py-8 text-center text-sm text-rose-300">
              {t("search.apiKeyHint", { message: error })}
            </div>
          )}

          {results.map((m, i) => (
            <button
              key={`${m.mediaType}:${m.id}`}
              onClick={() => handleSelect(m)}
              className="group flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/[0.06] animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
            >
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                {m.posterPath ? (
                  <img src={m.posterPath} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-ash-dim">
                    {m.mediaType === "tv" ? <Tv className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-paper group-hover:text-mint-300">{m.title}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-ash">
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
      </div>
    </div>
  );
}

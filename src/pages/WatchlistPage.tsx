import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bookmark,
  BookmarkX,
  Search,
  Trash2,
  Compass,
} from "lucide-react";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { useDebounce } from "@/hooks/useDebounce";
import { refToNormalized } from "@/lib/media";
import { toast } from "@/lib/toast";
import { MediaCard } from "@/components/media/MediaCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassModal } from "@/components/ui/GlassModal";
import type { MediaType } from "@/types/tmdb";
import type { Route } from "@/router/useHashRoute";

interface WatchlistPageProps {
  navigate: (r: Route) => void;
}

export function WatchlistPage({ navigate }: WatchlistPageProps) {
  const { t } = useTranslation();
  const { items, count, remove, clear } = useWatchlist();
  const [query, setQuery] = useState("");
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);
  const debounced = useDebounce(query, 200);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.title.toLowerCase().includes(q));
  }, [items, debounced]);

  const handleRemove = (id: number, mediaType: MediaType) => {
    const key = `${mediaType}:${id}`;
    setLeaving((prev) => new Set(prev).add(key));
    toast({ message: t("toasts.removedFromWatchlist"), tone: "success" });
    window.setTimeout(() => {
      remove(id, mediaType);
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 280);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="heading-display flex items-center gap-3 text-3xl text-paper sm:text-4xl">
            {t("watchlist.title")}
            {count > 0 && (
              <span className="glass-mint flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold text-mint-300">
                <Bookmark className="h-4 w-4" />
                {t("watchlist.saved", { count })}
              </span>
            )}
          </h1>
          <p className="mt-1.5 text-sm text-ash">{t("watchlist.subtitle")}</p>
        </div>

        {count > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="btn-glass text-sm text-rose-300 hover:border-rose-400/30 hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" /> {t("watchlist.clearAll")}
          </button>
        )}
      </div>

      {/* In-page search */}
      {count > 0 && (
        <div className="relative max-w-xl animate-fade-in-up">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mint-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("watchlist.filterPlaceholder")}
            className="input-glass ps-11"
          />
        </div>
      )}

      {/* Grid */}
      {count === 0 ? (
        <EmptyState
          icon={BookmarkX}
          title={t("watchlist.emptyTitle")}
          description={t("watchlist.emptyDesc")}
          action={
            <button onClick={() => navigate("discover")} className="btn-mint">
              <Compass className="h-4 w-4" /> {t("watchlist.exploreDiscover")}
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t("watchlist.noMatchesTitle")}
          description={t("watchlist.noMatchesDesc", { query: debounced })}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((item, i) => {
            const key = `${item.mediaType}:${item.id}`;
            return (
              <div
                key={key}
                className={
                  leaving.has(key)
                    ? "scale-90 opacity-0 blur-sm transition-all duration-ui ease-spring"
                    : "transition-all duration-ui ease-spring"
                }
              >
                <MediaCard media={refToNormalized(item)} index={i} />
                <button
                  onClick={() => handleRemove(item.id, item.mediaType)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-ash transition-all duration-ui ease-spring hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 active:scale-[0.97] active:duration-press"
                >
                  <BookmarkX className="h-3.5 w-3.5" />
                  {t("watchlist.remove")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer summary */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-ash-dim">
          {count === 1
            ? t("watchlist.showing", { shown: filtered.length, total: count })
            : t("watchlist.showingPlural", { shown: filtered.length, total: count })}
        </p>
      )}

      {/* Confirm clear-all */}
      <GlassModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={t("watchlist.clearTitle")}
        description={t("watchlist.clearDescPlural", { count })}
        icon={Trash2}
        confirmLabel={t("watchlist.clearConfirm")}
        destructive
        onConfirm={() => {
          clear();
          setConfirmClear(false);
          toast({ message: t("toasts.cleared"), tone: "success" });
        }}
      />
    </div>
  );
}

import { useState } from "react";
import { BookOpen, Heart, Check, Play, ExternalLink } from "lucide-react";
import type { MangaSummary } from "@/services/manga";
import { useMangaLibrary } from "@/providers/MangaLibraryProvider";
import { ContextMenuTrigger } from "@/components/ui/ContextMenuTrigger";
import { toast } from "@/lib/toast";
import { useTranslation } from "react-i18next";
import { openExternal } from "@/services/links";

interface MangaCardProps {
  manga: MangaSummary;
  index?: number;
  onOpen: (m: MangaSummary) => void;
}

export function MangaCard({ manga, index = 0, onOpen }: MangaCardProps) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const { getProgress, isFinished, isFavorite, toggleFavorite } = useMangaLibrary();
  const year = manga.year ?? "-";
  const suggestive = manga.contentRating === "suggestive";
  const progress = getProgress(manga.id);
  const finished = isFinished(manga.id);
  const fav = isFavorite(manga.id);

  const handleFavorite = () => {
    toggleFavorite(manga);
    toast({
      message: fav ? t("manga.removedFromFavorites") : t("manga.addedToFavorites"),
      tone: "success",
    });
  };

  const contextMenuItems = [
    {
      key: "details",
      label: t("common.viewInfo"),
      icon: BookOpen,
      onClick: () => onOpen(manga),
    },
    {
      key: "favorite",
      label: fav ? t("manga.inFavorites") : t("manga.addToFavorites"),
      icon: fav ? Heart : BookOpen,
      onClick: handleFavorite,
    },
    {
      key: "mangadex",
      label: "MangaDex",
      icon: ExternalLink,
      onClick: () => {
        void openExternal(`https://mangadex.org/title/${manga.id}`);
      },
    },
  ];

  return (
    <ContextMenuTrigger items={contextMenuItems}>
      <div
        className="group animate-fade-in-up"
        style={{ animationDelay: `${Math.min(index * 45, 450)}ms` }}
        onClick={() => onOpen(manga)}
      >
        <div className="surface-dark relative overflow-hidden rounded-lg transition-all duration-ui ease-spring hover:border-white/[0.16] hover:bg-white/[0.06]">
          <div className="relative aspect-[2/3] overflow-hidden bg-white/[0.04]">
            {manga.coverUrl ? (
              <img
                src={manga.coverUrl}
                alt={manga.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={() => setLoaded(true)}
                className={`h-full w-full object-cover transition-all duration-surface ease-spring group-hover:scale-[1.04] ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-10 w-10 text-shade-70" />
              </div>
            )}
            <div className="card-overlay pointer-events-none absolute inset-x-0 bottom-0 h-1/2" />

            {/* Top-left badges */}
            <div className="absolute start-2.5 top-2.5 flex gap-1">
              {suggestive && (
                <span className="rounded-xs border border-white/[0.12] bg-canvas-night/70 px-2 py-0.5 text-[10px] font-medium text-on-primary backdrop-blur-sm">
                  16+
                </span>
              )}
              {progress && !finished && (
                <span className="inline-flex items-center gap-0.5 rounded-xs border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent backdrop-blur-sm">
                  <Play className="h-2.5 w-2.5" fill="currentColor" />
                </span>
              )}
              {finished && (
                <span className="inline-flex items-center gap-0.5 rounded-xs border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent backdrop-blur-sm">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </div>

            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFavorite();
              }}
              aria-label="Favorite"
              className={`absolute end-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-md transition-all duration-ui ${
                fav
                  ? "bg-accent/20 text-accent"
                  : "bg-canvas-night/70 text-shade-40 opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:text-on-primary"
              }`}
            >
              <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
            </button>

            {/* Bottom-right follows */}
            <div className="absolute end-2.5 bottom-2.5">
              {manga.follows > 0 && (
                <span className="rounded-xs border border-white/[0.12] bg-canvas-night/70 px-2 py-0.5 text-[10px] font-medium text-on-primary backdrop-blur-sm">
                  {manga.follows > 999 ? `${(manga.follows / 1000).toFixed(0)}k` : manga.follows}
                </span>
              )}
            </div>
          </div>
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium text-on-primary">{manga.title || "Untitled"}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-shade-40">
              <BookOpen className="h-3 w-3" />
              <span>{year}</span>
              {manga.status === "completed" && <span>· Completed</span>}
            </p>
          </div>
        </div>
      </div>
    </ContextMenuTrigger>
  );
}

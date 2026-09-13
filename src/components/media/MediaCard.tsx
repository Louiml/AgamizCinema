import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bookmark,
  BookmarkCheck,
  Play,
  Info,
  Clapperboard,
  Film,
} from "lucide-react";
import type { NormalizedMedia } from "@/services/tmdb";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { usePlayer } from "@/providers/TMDBProvider";
import { useDetails } from "@/providers/DetailsProvider";
import { useIsLight } from "@/providers/SettingsProvider";
import { ContextMenuTrigger } from "@/components/ui/ContextMenuTrigger";
import { toMediaRef } from "@/lib/media";
import { toast } from "@/lib/toast";
import { RatingBadge } from "@/components/ui/RatingBadge";

interface MediaCardProps {
  media: NormalizedMedia;
  progress?: number;
  season?: number;
  episode?: number;
  index?: number;
  className?: string;
}

export function MediaCard({
  media,
  progress,
  season,
  episode,
  index = 0,
  className = "",
}: MediaCardProps) {
  const { t } = useTranslation();
  const { has, toggle } = useWatchlist();
  const { open } = usePlayer();
  const { open: openDetails } = useDetails();
  const [imageLoaded, setImageLoaded] = useState(false);
  const isLight = useIsLight();

  const saved = has(media.id, media.mediaType);
  const year = media.releaseDate?.slice(0, 4) ?? "—";
  const isTV = media.mediaType === "tv";

  const handlePlay = () => {
    open({
      tmdbId: media.id,
      mediaType: media.mediaType,
      title: media.title,
      season,
      episode,
      posterPath: media.posterPath,
      backdropPath: media.backdropPath,
      voteAverage: media.voteAverage,
    });
  };

  const handleCardClick = () => {
    openDetails(toMediaRef(media));
  };

  const contextMenuItems = [
    {
      key: "play",
      label: isTV ? t("home.playSeries") : t("home.watchNow"),
      icon: Play,
      onClick: handlePlay,
    },
    {
      key: "info",
      label: t("common.viewInfo"),
      icon: Info,
      onClick: () => openDetails(toMediaRef(media)),
    },
    {
      key: "watchlist",
      label: saved ? t("watchlist.remove") : t("home.addToWatchlist"),
      icon: saved ? BookmarkCheck : Bookmark,
      onClick: () => {
        const added = toggle(toMediaRef(media));
        toast({
          message: added ? t("toasts.addedToWatchlist") : t("toasts.removedFromWatchlist"),
          tone: "success",
        });
      },
    },
  ];

  return (
    <ContextMenuTrigger items={contextMenuItems}>
    <div
      className={`group relative animate-fade-in-up select-none ${className}`}
      style={{ animationDelay: `${Math.min(index * 45, 450)}ms` }}
      onClick={handleCardClick}
    >
      <div
        className={`relative overflow-hidden rounded-lg ${
          isLight
            ? "border border-hairline-light bg-canvas-light shadow-elev-3 transition-all duration-ui ease-spring hover:-translate-y-1 hover:shadow-elev-4"
            : "surface-dark transition-all duration-ui ease-spring hover:border-white/[0.16] hover:bg-white/[0.06]"
        }`}
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {media.posterPath ? (
            <img
              src={media.posterPath}
              alt={media.title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`h-full w-full object-cover transition-all duration-surface ease-spring group-hover:scale-[1.05] ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-canvas-night-elevated to-canvas-night">
              <Film className={`h-12 w-12 ${isLight ? "text-shade-40" : "text-shade-70"}`} />
            </div>
          )}
          {!media.posterPath && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5" />
          )}

          {/* Persistent bottom gradient */}
          <div className="card-overlay pointer-events-none absolute inset-x-0 bottom-0 h-1/2" />

          {/* Hover quick-action */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-canvas-night/85 via-canvas-night/30 to-transparent opacity-0 transition-opacity duration-ui ease-spring group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              aria-label={`${t("home.watchNow")} — ${media.title}`}
              className="flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-accent-on transition-transform duration-ui ease-spring hover:scale-110 active:scale-95 active:duration-press"
            >
              <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
            </button>
            <span className="eyebrow text-on-primary/80">
              {isTV ? t("home.playSeries") : t("home.watchNow")}
            </span>
          </div>

          {/* Watchlist toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const added = toggle(toMediaRef(media));
              toast({
                message: added ? t("toasts.addedToWatchlist") : t("toasts.removedFromWatchlist"),
                tone: "success",
              });
            }}
            aria-label={saved ? t("watchlist.remove") : t("home.addToWatchlist")}
            className={`absolute end-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-md transition-all duration-ui ease-spring active:scale-90 active:duration-press ${
              saved
                ? "bg-accent text-accent-on"
                : isLight
                  ? "border border-hairline-light bg-canvas-light/80 text-ink hover:bg-canvas-cream"
                  : "border border-white/[0.12] bg-canvas-night/70 text-on-primary hover:bg-canvas-night-elevated"
            }`}
          >
            {saved ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>

          {/* Rating */}
          <div className="absolute start-2.5 top-2.5">
            <RatingBadge rating={media.voteAverage} size="sm" />
          </div>

          {/* Progress bar (continue watching) */}
          {progress !== undefined && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-canvas-night/60">
              <div
                className="h-full bg-accent transition-all duration-surface ease-spring"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>

          {/* Info */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="min-w-0">
              <p
                className={`truncate text-sm font-medium transition-colors duration-ui ${
                  isLight
                    ? "text-ink group-hover:text-ink"
                    : "text-on-primary group-hover:text-on-primary"
                }`}
              >
                {media.title}
              </p>
              <p
                className={`mt-0.5 flex items-center gap-1.5 text-xs ${
                  isLight ? "text-shade-50" : "text-shade-40"
                }`}
              >
                {isTV && <Clapperboard className="h-3 w-3" />}
                <span>{year}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ContextMenuTrigger>
  );
}

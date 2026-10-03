import { useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Check, Film } from "lucide-react";
import type { NormalizedMedia } from "@/services/tmdb";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { useDetails } from "@/providers/DetailsProvider";
import { ContextMenuTrigger } from "@/components/ui/ContextMenuTrigger";
import { toMediaRef } from "@/lib/media";
import { toast } from "@/lib/toast";
import type { ExpandTarget } from "./NetflixExpandedCard";

interface NetflixMediaCardProps {
  media: NormalizedMedia;
  /** Resume point, 0-100. Renders a red bar when present. */
  progress?: number;
  season?: number;
  episode?: number;
  /** `poster` is 2:3 (rails), `landscape` is 16:9 (continue-watching). */
  variant?: "poster" | "landscape";
  /** Extra classes for the sizing wrapper. */
  className?: string;
  /**
   * Asks the row to show the expanded overlay for this card. The row owns that
   * state because the overlay has to live outside the scrolling rail.
   */
  onExpand?: (target: ExpandTarget) => void;
}

/**
 * A poster in a Netflix rail.
 *
 * Deliberately inert on hover: the expansion is drawn by
 * `NetflixExpandedCard` in a portal, because a panel rendered in here would be
 * clipped by the rail's scroll container. This card only reports the hover and
 * hands over its viewport rect.
 */
export function NetflixMediaCard({
  media,
  progress,
  season,
  episode,
  variant = "poster",
  className = "",
  onExpand,
}: NetflixMediaCardProps) {
  const { t } = useTranslation();
  const { has, toggle } = useWatchlist();
  const { open: openDetails } = useDetails();
  const [loaded, setLoaded] = useState(false);

  const saved = has(media.id, media.mediaType);
  const hasProgress = typeof progress === "number" && progress > 0;
  const clampProgress = Math.min(100, Math.max(0, progress ?? 0));
  const artwork = variant === "landscape" ? media.backdropPath : media.posterPath;
  const fallbackArt = variant === "landscape" ? media.posterPath : media.backdropPath;

  const ref = toMediaRef(media);

  const toggleWatchlist = () => {
    const added = toggle(ref);
    toast({
      message: added
        ? t("toasts.addedToWatchlist")
        : t("toasts.removedFromWatchlist"),
      tone: "success",
    });
  };

  // Read the rect off the event target: ContextMenuTrigger clones this element
  // and replaces its ref, so a ref of our own would never be populated.
  const handleEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (!onExpand) return;
    const r = e.currentTarget.getBoundingClientRect();
    onExpand({
      media,
      rect: { left: r.left, top: r.top, width: r.width, height: r.height },
      variant,
      progress,
      season,
      episode,
    });
  };

  return (
    <ContextMenuTrigger
      items={[
        {
          key: "info",
          label: t("common.viewInfo"),
          onClick: () => openDetails(ref),
        },
        {
          key: "watchlist",
          label: saved ? t("watchlist.remove") : t("home.addToWatchlist"),
          icon: saved ? Check : Plus,
          onClick: toggleWatchlist,
        },
      ]}
    >
      <div
        onMouseEnter={handleEnter}
        className={`nf-card cursor-pointer ${
          variant === "landscape" ? "aspect-video" : "aspect-[2/3]"
        } ${className}`}
        onClick={() => openDetails(ref)}
      >
        <div className="absolute inset-0 overflow-hidden rounded-t-[2px]">
          {artwork || fallbackArt ? (
            <img
              src={artwork ?? fallbackArt ?? ""}
              alt={media.title}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`h-full w-full object-cover transition-opacity duration-surface ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-ink-raise">
              <Film className="h-10 w-10 text-on-primary/25" />
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWatchlist();
          }}
          aria-label={saved ? t("watchlist.remove") : t("home.addToWatchlist")}
          aria-pressed={saved}
          className={`absolute end-1.5 top-1.5 z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] transition-colors duration-ui ${
            saved
              ? "bg-accent text-accent-on"
              : "bg-black/60 text-on-primary hover:bg-black/85"
          }`}
        >
          {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>

        {hasProgress && (
          <div
            role="progressbar"
            aria-valuenow={Math.round(clampProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="absolute inset-x-0 bottom-0 z-10 h-1 bg-white/25"
          >
            <div
              className="h-full bg-accent transition-[width] duration-surface ease-out"
              style={{ width: `${clampProgress}%` }}
            />
          </div>
        )}
      </div>
    </ContextMenuTrigger>
  );
}
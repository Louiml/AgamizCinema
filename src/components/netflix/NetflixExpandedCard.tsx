import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Play, Info, Plus, Check, Film } from "lucide-react";
import type { NormalizedMedia } from "@/services/tmdb";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { usePlayer } from "@/providers/TMDBProvider";
import { useDetails } from "@/providers/DetailsProvider";
import { toMediaRef } from "@/lib/media";
import { toast } from "@/lib/toast";
import { NfMatchScore } from "./primitives";

/** Poster grow factor, matching the real service's hover expansion. */
const SCALE = 1.14;
const EDGE = 8;

export interface ExpandTarget {
  media: NormalizedMedia;
  /** Viewport rect of the source card. */
  rect: { left: number; top: number; width: number; height: number };
  variant: "poster" | "landscape";
  progress?: number;
  season?: number;
  episode?: number;
}

interface NetflixExpandedCardProps extends ExpandTarget {
  onClose: () => void;
}

/**
 * The expanded card.
 *
 * It renders through a portal to <body> rather than inside the poster rail.
 * That is not cosmetic: a rail must use `overflow-x: auto` to scroll, and CSS
 * coerces the other axis to `auto` too, which clips a nested panel to the
 * rail's box. Rendering the whole expanded unit at viewport level escapes that
 * clip, and means the row needs no reserved blank space underneath.
 *
 * The wrapper keeps the original card's size so the poster's CSS scale
 * (origin: top center) grows outward from exactly where the poster already
 * was — no jump on hover.
 */
export function NetflixExpandedCard({
  media,
  rect,
  variant,
  progress,
  season,
  episode,
  onClose,
}: NetflixExpandedCardProps) {
  const { t } = useTranslation();
  const { has, toggle } = useWatchlist();
  const { open } = usePlayer();
  const { open: openDetails } = useDetails();

  const panelRef = useRef<HTMLDivElement>(null);
  const [panelH, setPanelH] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const saved = has(media.id, media.mediaType);
  const isTV = media.mediaType === "tv";
  const year = media.releaseDate?.slice(0, 4);
  const hasProgress = typeof progress === "number" && progress > 0;
  const clampProgress = Math.min(100, Math.max(0, progress ?? 0));
  const artwork = variant === "landscape" ? media.backdropPath : media.posterPath;
  const fallbackArt = variant === "landscape" ? media.posterPath : media.backdropPath;

  const scaledW = rect.width * SCALE;
  const scaledH = rect.height * SCALE;
  // Grow symmetrically about the poster's horizontal centre.
  const panelShift = -(scaledW - rect.width) / 2;

  const ref = toMediaRef(media);
  const playLabel = isTV ? t("home.playSeries") : t("home.watchNow");

  // Close on scroll/resize: the overlay is pinned to viewport coordinates, so
  // it cannot follow the rail.
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [onClose]);

  // Measure the panel so it can flip above the poster when it would overflow
  // the bottom of the viewport.
  useLayoutEffect(() => {
    if (panelRef.current) setPanelH(panelRef.current.offsetHeight);
  }, [media.id]);

  const vw = typeof window === "undefined" ? rect.width : window.innerWidth;
  const vh = typeof window === "undefined" ? rect.height : window.innerHeight;

  const left = Math.min(
    Math.max(EDGE, rect.left + panelShift),
    Math.max(EDGE, vw - scaledW - EDGE),
  );
  // Stay anchored to the card vertically; only the panel flips when it would
  // run off the bottom. Clamping the poster instead would detach the overlay
  // from the poster it is expanding.
  const flipped = panelH > 0 && rect.top + scaledH + panelH > vh - EDGE;
  const top = flipped ? Math.max(EDGE, rect.top - panelH) : rect.top;

  const play = () => {
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

  const toggleWatchlist = () => {
    const added = toggle(ref);
    toast({
      message: added
        ? t("toasts.addedToWatchlist")
        : t("toasts.removedFromWatchlist"),
      tone: "success",
    });
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const panelInner = (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={play}
          aria-label={playLabel}
          title={playLabel}
          className="nf-exp-btn nf-exp-btn--play"
        >
          <Play className="h-4 w-4 translate-x-px" fill="currentColor" />
        </button>
        <button
          onClick={toggleWatchlist}
          aria-label={saved ? t("watchlist.remove") : t("home.addToWatchlist")}
          aria-pressed={saved}
          title={saved ? t("watchlist.remove") : t("home.addToWatchlist")}
          className={`nf-exp-btn ${saved ? "nf-exp-btn--on" : ""}`}
        >
          {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
        <button
          onClick={() => openDetails(ref)}
          aria-label={t("common.viewInfo")}
          title={t("common.viewInfo")}
          className="nf-exp-btn"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mt-2.5 line-clamp-2 text-[13px] font-bold leading-snug text-on-primary">
        {media.title}
      </h3>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-on-primary/75">
        {media.voteAverage > 0 && <NfMatchScore value={media.voteAverage} />}
        {year && <span className="shrink-0">{year}</span>}
        <span className="shrink-0 rounded-[2px] px-1.5 py-px ring-1 ring-inset ring-on-primary/40">
          {isTV ? t("common.tvSeries") : t("common.movie")}
        </span>
      </div>

      {media.overview && (
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-on-primary/70">
          {media.overview}
        </p>
      )}
    </>
  );

  const panel = flipped ? (
    <div
      ref={panelRef}
      className="nf-expanded-panel nf-expanded-panel--above"
      style={{ bottom: scaledH, left: panelShift, width: scaledW }}
    >
      {panelInner}
    </div>
  ) : (
    <div
      ref={panelRef}
      className="nf-expanded-panel"
      style={{ top: scaledH, left: panelShift, width: scaledW }}
    >
      {panelInner}
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-[80]"
      style={{ left, top, width: rect.width, height: rect.height }}
      onMouseLeave={onClose}
      onClick={stop}
    >
      <div
        className="absolute left-0 top-0 h-full w-full origin-top overflow-hidden rounded-t-[2px] bg-ink-raise"
        style={{ transform: `scale(${SCALE})` }}
      >
        {artwork || fallbackArt ? (
          <img
            src={artwork ?? fallbackArt ?? ""}
            alt={media.title}
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-10 w-10 text-on-primary/25" />
          </div>
        )}
      </div>

      {hasProgress && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(clampProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute h-1 bg-white/25"
          style={{ bottom: -4, left: panelShift, width: scaledW }}
        >
          <div
            className="h-full bg-accent transition-[width] duration-surface ease-out"
            style={{ width: `${clampProgress}%` }}
          />
        </div>
      )}

      {panel}
    </div>,
    document.body,
  );
}
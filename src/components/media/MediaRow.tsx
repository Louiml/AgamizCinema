import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NormalizedMedia } from "@/services/tmdb";
import { MediaCard } from "@/components/media/MediaCard";
import { SkeletonCard } from "@/components/ui/Spinner";

interface MediaRowProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  media: NormalizedMedia[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  progressMap?: Map<string, { progress: number; season?: number; episode?: number }>;
}

function keyOf(id: number, mediaType: string) {
  return `${mediaType}:${id}`;
}

export function MediaRow({
  title,
  subtitle,
  icon,
  media,
  loading,
  error,
  onRetry,
  progressMap,
}: MediaRowProps) {
  const { t, i18n } = useTranslation();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ back: false, next: false });

  const rtl = i18n.dir() === "rtl";

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (rtl) {
      const l = el.scrollLeft;
      setCanScroll({
        back: l > -max + 8,
        next: l < -8,
      });
    } else {
      setCanScroll({
        back: el.scrollLeft > 8,
        next: el.scrollLeft < max - 8,
      });
    }
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [media.length, rtl]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: (rtl ? -dir : dir) * step, behavior: "smooth" });
  };

  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  const hasMedia = media.length > 0;

  return (
    <section className="relative animate-fade-in-up">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="heading-display flex items-center gap-2.5 text-lg text-paper sm:text-xl">
            {icon && <span className="text-mint-400">{icon}</span>}
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-ash">{subtitle}</p>}
        </div>

        {hasMedia && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => scrollByDir(-1)}
              disabled={!canScroll.back}
              aria-label={t("common.back")}
              className="btn-icon h-9 w-9 disabled:pointer-events-none disabled:opacity-30"
            >
              <PrevIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollByDir(1)}
              disabled={!canScroll.next}
              aria-label={t("common.next")}
              className="btn-icon h-9 w-9 disabled:pointer-events-none disabled:opacity-30"
            >
              <NextIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-3xl px-6 py-10 text-center">
          <p className="text-sm text-ash">{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn-glass text-sm">
              {t("common.retry")}
            </button>
          )}
        </div>
      ) : !hasMedia ? (
        <div className="glass-panel rounded-3xl px-6 py-10 text-center text-sm text-ash">
          {t("common.nothingHere")}
        </div>
      ) : (
        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth ps-4 pe-4 pb-2"
        >
          {media.map((m, i) => {
            const prog = progressMap?.get(keyOf(m.id, m.mediaType));
            return (
              <div
                key={keyOf(m.id, m.mediaType)}
                className="w-[150px] shrink-0 snap-start sm:w-[168px] lg:w-[184px]"
              >
                <MediaCard
                  media={m}
                  index={i}
                  progress={prog?.progress}
                  season={prog?.season}
                  episode={prog?.episode}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

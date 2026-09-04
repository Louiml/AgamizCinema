import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NormalizedMedia } from "@/services/tmdb";
import { MediaCard } from "@/components/media/MediaCard";

interface TopTenRowProps {
  title: string;
  subtitle?: string;
  media: NormalizedMedia[];
}

/**
 * Horizontal "Top 10" row — each title sits beside a large gradient rank
 * numeral (Netflix-style). Auto-derives the rank from list order. RTL-safe:
 * the numeral anchors to the inline-start edge in every direction.
 */
export function TopTenRow({ title, subtitle, media }: TopTenRowProps) {
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
      setCanScroll({ back: l > -max + 8, next: l < -8 });
    } else {
      setCanScroll({ back: el.scrollLeft > 8, next: el.scrollLeft < max - 8 });
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
    el.scrollBy({ left: (rtl ? -dir : dir) * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;
  const hasMedia = media.length > 0;

  return (
    <section className="relative animate-fade-in-up">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="heading-display flex items-center gap-2.5 text-lg text-paper sm:text-xl">
            <span className="text-mint-400">10</span>
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

      {hasMedia && (
        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          className="no-scrollbar -mx-4 flex items-end gap-4 overflow-x-auto scroll-smooth ps-4 pe-4 pb-2"
        >
          {media.slice(0, 10).map((m, i) => (
            <div
              key={`${m.mediaType}:${m.id}`}
              className="relative w-[176px] shrink-0 sm:w-[196px] lg:w-[212px]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-3 start-0 z-0 select-none font-display text-[8rem] font-black leading-none tracking-tighter sm:text-[9rem] lg:text-[10rem]"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(110,231,183,0.85), rgba(16,185,129,0.15))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextStroke: "1px rgba(255,255,255,0.06)",
                }}
              >
                {i + 1}
              </span>
              <div className="relative z-10 ms-7 sm:ms-9">
                <MediaCard media={m} index={i} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

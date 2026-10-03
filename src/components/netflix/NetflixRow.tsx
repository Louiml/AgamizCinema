import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { NormalizedMedia } from "@/services/tmdb";
import { SkeletonCard } from "@/components/ui/Spinner";
import { NetflixMediaCard } from "./NetflixMediaCard";
import { useExpansion } from "./ExpansionProvider";
import { NfRowHeading, NfRailArrow } from "./primitives";

interface NetflixRowProps {
  title: string;
  subtitle?: string;
  media: NormalizedMedia[];
  loading?: boolean;
  /** Extra content pinned to the right of the heading. */
  headingAction?: ReactNode;
  /** Poster width preset. */
  size?: "sm" | "md" | "lg" | "landscape";
  progressMap?: Map<string, { progress: number; season?: number; episode?: number }>;
}

const SIZES: Record<NonNullable<NetflixRowProps["size"]>, string> = {
  sm: "w-[104px] sm:w-[124px] lg:w-[140px]",
  md: "w-[124px] sm:w-[148px] lg:w-[168px]",
  lg: "w-[140px] sm:w-[168px] lg:w-[192px]",
  landscape: "w-[190px] sm:w-[230px] lg:w-[270px]",
};

function keyOf(id: number, mediaType: string) {
  return `${mediaType}:${id}`;
}

/**
 * A horizontal poster rail.
 *
 * Scrolls natively; the chevrons just nudge it. Card width is fixed per rail so
 * an expansion never reflows its neighbours, and no vertical padding is
 * reserved — the expansion is drawn by {@link ExpansionProvider} in a portal, so
 * it floats above the next row instead of being clipped by this one.
 */
export function NetflixRow({
  title,
  subtitle,
  media,
  loading,
  headingAction,
  size = "md",
  progressMap,
}: NetflixRowProps) {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === "rtl";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ back: false, next: false });
  const { expand } = useExpansion();

  const updateEdges = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // In RTL, browsers report scrollLeft as 0 at the start edge and negative
    // as you move toward the end, so the comparisons invert.
    const start = Math.abs(el.scrollLeft);
    if (rtl) {
      setEdges({ back: start > 8, next: start < max - 8 });
    } else {
      setEdges({ back: start > 8, next: start < max - 8 });
    }
  };

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [media.length, rtl]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.85;
    el.scrollBy({ left: (rtl ? -dir : dir) * step, behavior: "smooth" });
  };

  const hasMedia = media.length > 0;

  return (
    <section className="animate-fade-in-up">
      <NfRowHeading
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {headingAction}
            {hasMedia && (
              <>
                <NfRailArrow
                  direction="prev"
                  onClick={() => scrollByDir(-1)}
                  disabled={!edges.back}
                  label={t("common.back")}
                />
                <NfRailArrow
                  direction="next"
                  onClick={() => scrollByDir(1)}
                  disabled={!edges.next}
                  label={t("common.next")}
                />
              </>
            )}
          </>
        }
      />

      {loading ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} bare />
          ))}
        </div>
      ) : !hasMedia ? (
        <div className="rounded-[2px] bg-canvas-elev px-6 py-10 text-center text-sm text-on-primary/60">
          {t("common.nothingHere")}
        </div>
      ) : (
        <div className="nf-track -mx-4 px-4 pb-2 pt-1 sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16">
          {media.map((m, i) => {
            const prog = progressMap?.get(keyOf(m.id, m.mediaType));
            return (
              <div
                key={keyOf(m.id, m.mediaType)}
                className={`shrink-0 ${SIZES[size]}`}
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <NetflixMediaCard
                  media={m}
                  variant={size === "landscape" ? "landscape" : "poster"}
                  progress={prog?.progress}
                  season={prog?.season}
                  episode={prog?.episode}
                  onExpand={expand}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
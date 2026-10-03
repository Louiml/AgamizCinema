import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NormalizedMedia } from "@/services/tmdb";
import { NetflixMediaCard } from "./NetflixMediaCard";
import { useExpansion } from "./ExpansionProvider";
import { NfRowHeading, NfRailArrow } from "./primitives";

interface NetflixTopTenRowProps {
  title: string;
  subtitle?: string;
  media: NormalizedMedia[];
}

/**
 * "Top 10 in Your Country Today".
 *
 * The rank numeral is a large stroked outline sitting flush against the
 * poster's left edge — the same trick the real service uses. Numeral width is
 * proportional to the digit count so 1-9 and 10 do not shift the poster.
 */
export function NetflixTopTenRow({ title, subtitle, media }: NetflixTopTenRowProps) {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === "rtl";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ back: false, next: false });
  const { expand } = useExpansion();

  const topTen = media.slice(0, 10);

  const updateEdges = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const start = Math.abs(el.scrollLeft);
    setEdges(
      rtl
        ? { back: start > 8, next: start < max - 8 }
        : { back: start > 8, next: start < max - 8 },
    );
  };

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [topTen.length, rtl]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.85;
    el.scrollBy({ left: (rtl ? -dir : dir) * step, behavior: "smooth" });
  };

  if (topTen.length === 0) return null;

  return (
    <section className="animate-fade-in-up">
      <NfRowHeading
        title={title}
        subtitle={subtitle}
        actions={
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
        }
      />

      <div className="nf-track -mx-4 items-center px-4 pb-2 pt-1 sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16">
        {topTen.map((m, i) => (
          <div key={`${m.mediaType}:${m.id}`} className="flex shrink-0 items-stretch">
            {/* Rank numeral. In RTL the stroke order flips too, so mirror it. */}
            <span
              aria-hidden
              className="nf-numeral flex shrink-0 items-center justify-end text-[6.5rem] leading-[0.72] sm:text-[8rem] rtl:scale-x-[-1]"
              style={{ width: `${i === 9 ? 3.4 : 2.7}rem` }}
            >
              {i + 1}
            </span>
            <NetflixMediaCard
              media={m}
              className="w-[124px] sm:w-[148px] lg:w-[168px]"
              onExpand={expand}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
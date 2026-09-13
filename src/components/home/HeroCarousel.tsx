import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Play, Bookmark, BookmarkCheck, Info } from "lucide-react";
import type { NormalizedMedia } from "@/services/tmdb";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { usePlayer } from "@/providers/TMDBProvider";
import { useDetails } from "@/providers/DetailsProvider";
import { toMediaRef } from "@/lib/media";
import { toast } from "@/lib/toast";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { AmbientGlow } from "@/components/ui/AmbientGlow";

interface HeroCarouselProps {
  items: NormalizedMedia[];
  genreMap?: Map<string, string>;
}

const SLIDE_MS = 5000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/**
 * Auto-rotating hero spotlight for the home page. Top trending titles
 * crossfade through full-bleed backdrops; progress bars track the autoplay
 * and the whole thing pauses on hover or under reduced-motion. Each slide
 * anchors its content to the start edge so the layout reads in both LTR/RTL.
 */
export function HeroCarousel({ items, genreMap }: HeroCarouselProps) {
  const { t } = useTranslation();
  const { has, toggle } = useWatchlist();
  const { open } = usePlayer();
  const { open: openDetails } = useDetails();
  const reduced = usePrefersReducedMotion();

  const slides = useMemo(() => items.slice(0, 5), [items]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const timerRef = useRef<number | null>(null);

  const active = slides[index] ?? slides[0];

  useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (paused || reduced || slides.length <= 1) return;
    timerRef.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index, paused, reduced, slides.length]);

  const go = (next: number) => {
    if (slides.length <= 1) return;
    setIndex((next + slides.length) % slides.length);
    setPaused(true);
  };

  if (!active) return null;

  const isTV = active.mediaType === "tv";
  const year = active.releaseDate?.slice(0, 4) ?? "—";
  const saved = has(active.id, active.mediaType);
  const heroGenres = active.genreIds
    .map((id) => genreMap?.get(String(id)) ?? "")
    .filter(Boolean)
    .slice(0, 3);

  const handlePlay = () =>
    open({
      tmdbId: active.id,
      mediaType: active.mediaType,
      title: active.title,
      posterPath: active.posterPath,
      backdropPath: active.backdropPath,
      voteAverage: active.voteAverage,
    });

  return (
    <section
      className="relative -mx-4 animate-fade-in sm:-mx-6 lg:-mx-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative h-[70vh] max-h-[640px] min-h-[420px] w-full overflow-hidden sm:rounded-xl">
        {/* Stacked crossfading backdrops */}
        {slides.map((m, i) => (
          <div
            key={m.id}
            aria-hidden={i !== index}
            className="absolute inset-0 transition-opacity duration-surface ease-spring"
            style={{ opacity: i === index ? 1 : 0 }}
          >
            {m.backdropPath && (
              <img
                src={m.backdropPath}
                alt=""
                draggable={false}
                onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
                className={`h-full w-full object-cover transition-transform duration-[5000ms] ease-linear ${
                  i === index && !paused && !reduced ? "scale-105" : "scale-100"
                } ${loaded[i] ? "opacity-100" : "opacity-0"}`}
              />
            )}
          </div>
        ))}

        {/* Ambient + gradients */}
        <AmbientGlow imageUrl={active.backdropPath} opacity={0.5} />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas-night via-canvas-night/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas-night/95 via-canvas-night/40 to-transparent" />

        {/* Content — keyed so it re-animates per slide */}
        <div className="relative flex h-full flex-col justify-end px-5 pb-10 pt-32 sm:px-10 lg:px-14">
          <div key={active.id} className="max-w-2xl animate-fade-in-up">
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <span className="eyebrow rounded-xs bg-accent/15 px-2.5 py-1 text-accent">
                {isTV ? t("home.trendingSeries") : t("home.trendingNow")}
              </span>
              <RatingBadge rating={active.voteAverage} />
              <span className="text-sm font-medium text-shade-40">{year}</span>
            </div>

            <h1 className="heading-display text-3xl leading-tight text-on-primary sm:text-5xl lg:text-6xl">
              {active.title}
            </h1>

            {heroGenres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {heroGenres.map((g) => (
                  <span key={g} className="text-xs font-medium tracking-wide text-shade-40">
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-on-primary/75 sm:text-base [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden">
              {active.overview || t("home.noSynopsis")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={handlePlay} className="btn-primary-pill px-7 py-3 text-base">
                <Play className="h-5 w-5" fill="currentColor" />
                {t("home.watchNow")}
              </button>
              <button
                onClick={() => {
                  const added = toggle(toMediaRef(active));
                  toast({
                    message: added ? t("toasts.addedToWatchlist") : t("toasts.removedFromWatchlist"),
                    tone: "success",
                  });
                }}
                className={`btn-outline-on-dark px-6 py-3 text-base ${
                  saved ? "bg-on-primary/15" : ""
                }`}
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="h-5 w-5" /> {t("home.inWatchlist")}
                  </>
                ) : (
                  <>
                    <Bookmark className="h-5 w-5" /> {t("home.addToWatchlist")}
                  </>
                )}
              </button>
              <button
                onClick={() => openDetails(toMediaRef(active))}
                aria-label={t("home.moreInfo")}
                className="btn-icon h-12 w-12"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-5 end-5 flex items-center gap-1.5 sm:end-10 lg:end-14">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => go(i)}
                aria-label={`${i + 1}`}
                aria-current={i === index}
                className="group h-1.5 w-8 overflow-hidden rounded-pill bg-white/20 transition-all duration-ui ease-spring sm:w-10"
              >
                <span
                  className="block h-full rounded-pill bg-accent"
                  style={
                    i === index && !paused && !reduced
                      ? { animation: `heroProgress ${SLIDE_MS}ms linear forwards` }
                      : i < index
                        ? { width: "100%" }
                        : { width: "0%" }
                  }
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Decorative bottom fade into the page */}
      <div className="pointer-events-none absolute -bottom-6 left-0 right-0 h-12 bg-gradient-to-t from-canvas-night to-transparent" />

      <style>{`@keyframes heroProgress { from { width: 0% } to { width: 100% } }`}</style>
    </section>
  );
}

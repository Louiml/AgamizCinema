import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Play, Info } from "lucide-react";
import type { NormalizedMedia } from "@/services/tmdb";
import { usePlayer } from "@/providers/TMDBProvider";
import { useDetails } from "@/providers/DetailsProvider";
import { toMediaRef } from "@/lib/media";
import { NfButton, NfMatchScore } from "./primitives";

interface NetflixHeroProps {
  items: NormalizedMedia[];
  genreMap?: Map<string, string>;
}

const ROTATE_MS = 9000;

/**
 * Full-bleed hero for the featured title.
 *
 * Netflix shows a single title at a time and hands over to the first rail on
 * load. This keeps one, rotates the set on a long timer, and dims the previous
 * slide during the crossfade.
 */
export function NetflixHero({ items, genreMap }: NetflixHeroProps) {
  const { t } = useTranslation();
  const { open } = usePlayer();
  const { open: openDetails } = useDetails();
  const [index, setIndex] = useState(0);
  const timer = useRef<number | null>(null);

  const total = items.length;

  useEffect(() => {
    if (total <= 1) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, ROTATE_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [total]);

  const current = items[Math.min(index, total - 1)];

  const genres = useMemo(() => {
    if (!genreMap || !current) return [];
    return current.genreIds
      .slice(0, 3)
      .map((id) => genreMap.get(String(id)))
      .filter((g): g is string => Boolean(g));
  }, [genreMap, current]);

  if (!current) return null;

  const isTV = current.mediaType === "tv";
  const year = current.releaseDate?.slice(0, 4);
  const ref = toMediaRef(current);

  return (
    <section className="relative -mx-4 mb-8 h-[62vh] min-h-[440px] overflow-hidden sm:-mx-8 sm:h-[70vh] lg:-mx-16">
      {items.map((item, i) => (
        <div
          key={`${item.mediaType}:${item.id}`}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {item.backdropPath && (
            <img
              src={item.backdropPath}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full scale-105 object-cover object-top"
            />
          )}
        </div>
      ))}

      {/* Scrim + page blend. */}
      <div className="nf-scrim absolute inset-0" />

      {/* Copy block. */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-14 sm:px-8 sm:pb-20 lg:px-16">
        <div className="max-w-xl">
          {current.voteAverage > 0 && (
            <div className="mb-3 flex items-center gap-3">
              <NfMatchScore value={current.voteAverage} />
            </div>
          )}

          <h1 className="nf-title text-3xl text-on-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] sm:text-5xl lg:text-6xl">
            {current.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-primary/85">
            {isTV && (
              <span className="rounded-[2px] px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-on-primary/50">
                {t("common.tvSeries")}
              </span>
            )}
            {year && <span>{year}</span>}
            {genres.map((g) => (
              <span key={g} className="text-on-primary/70">
                {g}
              </span>
            ))}
          </div>

          {current.overview && (
            <p className="mt-4 line-clamp-3 max-w-lg text-sm leading-relaxed text-on-primary/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] sm:text-base">
              {current.overview}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <NfButton
              variant="solid"
              className="px-7 py-2.5 text-base"
              onClick={() =>
                open({
                  tmdbId: current.id,
                  mediaType: current.mediaType,
                  title: current.title,
                  posterPath: current.posterPath,
                  backdropPath: current.backdropPath,
                  voteAverage: current.voteAverage,
                })
              }
            >
              <Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
              {isTV ? t("home.playSeries") : t("home.watchNow")}
            </NfButton>

            <NfButton
              variant="ghost"
              className="px-7 py-2.5 text-base"
              onClick={() => openDetails(ref)}
            >
              <Info className="h-5 w-5" />
              {t("home.moreInfo")}
            </NfButton>
          </div>
        </div>
      </div>

      {/* Slide dots. */}
      {total > 1 && (
        <div className="absolute bottom-5 end-8 z-10 hidden items-center gap-1.5 sm:flex">
          {items.map((item, i) => (
            <button
              key={`dot-${item.mediaType}:${item.id}`}
              onClick={() => setIndex(i)}
              aria-label={`${t("home.moreInfo")} ${i + 1}/${total}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-ui ${
                i === index ? "w-6 bg-accent" : "w-1.5 bg-on-primary/40 hover:bg-on-primary/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
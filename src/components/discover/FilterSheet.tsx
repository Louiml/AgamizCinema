import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, X, Check, RotateCcw, Calendar, Star } from "lucide-react";
import type { Genre } from "@/types/tmdb";

export interface SortOption<T extends string> {
  key: T;
  label: string;
  value: T;
}

interface FilterSheetProps<T extends string> {
  open: boolean;
  onClose: () => void;
  title: string;
  genres: Genre[];
  selectedGenres: number[];
  onToggleGenre: (id: number) => void;
  sort: T;
  onSelectSort: (key: T) => void;
  sortOptions: Array<{ key: T; label: string }>;
  yearFrom: number | undefined;
  yearTo: number | undefined;
  onYearChange: (from: number | undefined, to: number | undefined) => void;
  minRating: number;
  onSelectRating: (rating: number) => void;
  onReset: () => void;
  activeCount: number;
}

const RATING_STEPS = [0, 5, 6, 7, 8];

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Unified filter panel. Bottom sheet on mobile, right-side drawer on desktop.
 * Sections: Sort, Genres, Release Year, Minimum Rating.
 */
export function FilterSheet<T extends string>({
  open,
  onClose,
  title,
  genres,
  selectedGenres,
  onToggleGenre,
  sort,
  onSelectSort,
  sortOptions,
  yearFrom,
  yearTo,
  onYearChange,
  minRating,
  onSelectRating,
  onReset,
  activeCount,
}: FilterSheetProps<T>) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const clearGenres = () => selectedGenres.forEach((g) => onToggleGenre(g));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center animate-fade-in md:top-14 md:items-stretch md:justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[88vh] w-full flex-col rounded-t-lg border-t border-hairline-light bg-canvas-night-elevated shadow-elev-4 animate-fade-in-up md:h-full md:max-h-none md:max-w-md md:rounded-none md:border-t-0 md:border-l"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Grab handle (mobile only) */}
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-pill bg-white/20 md:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-hairline-light px-5 pb-3 pt-4">
          <h2 className="flex items-center gap-2 heading-display text-lg text-on-primary">
            <SlidersHorizontal className="h-5 w-5 text-on-primary" />
            {title}
            {activeCount > 0 && (
              <span className="pill-tag-shade-dark">{activeCount}</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="surface-dark flex h-10 items-center gap-1.5 rounded-pill px-3 text-xs font-medium text-shade-40 transition-all duration-ui ease-spring active:scale-95 hover:text-on-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t("discover.reset")}
            </button>
            <button
              onClick={onClose}
              aria-label={t("common.close")}
              className="surface-dark flex h-10 w-10 items-center justify-center rounded-pill text-on-primary transition-all duration-ui ease-spring active:scale-90 active:duration-press hover:border-white/[0.16]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">
          {/* Sort */}
          <p className="eyebrow">{t("discover.sortBy")}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {sortOptions.map((opt) => {
              const active = sort === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => onSelectSort(opt.key)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-sm font-medium transition-all duration-ui ease-spring active:scale-[0.98] ${
                    active
                      ? "border-accent bg-accent/10 text-on-primary"
                      : "surface-dark text-shade-40 hover:text-on-primary"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && (
                    <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Genres */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">{t("discover.genres")}</p>
              {selectedGenres.length > 0 && (
                <button
                  onClick={clearGenres}
                  className="text-xs text-shade-50 transition-colors hover:text-on-primary"
                >
                  {t("discover.clearGenres")}
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {genres.map((g) => {
                const active = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => onToggleGenre(g.id)}
                    className={`chip ${active ? "chip-active" : ""}`}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Release year */}
          <div className="mt-6">
            <p className="eyebrow flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {t("discover.releaseYear")}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="number"
                inputMode="numeric"
                min={1900}
                max={CURRENT_YEAR}
                value={yearFrom ?? ""}
                placeholder={t("discover.yearFrom")}
                onChange={(e) => {
                  const v = e.target.value;
                  onYearChange(v ? Number(v) : undefined, yearTo);
                }}
                className="input-glass w-full"
              />
              <span className="shrink-0 text-shade-50">-</span>
              <input
                type="number"
                inputMode="numeric"
                min={1900}
                max={CURRENT_YEAR}
                value={yearTo ?? ""}
                placeholder={t("discover.yearTo")}
                onChange={(e) => {
                  const v = e.target.value;
                  onYearChange(yearFrom, v ? Number(v) : undefined);
                }}
                className="input-glass w-full"
              />
            </div>
          </div>

          {/* Min rating */}
          <div className="mt-6">
            <p className="eyebrow flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> {t("discover.minRating")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {RATING_STEPS.map((step) => {
                const active = minRating === step;
                return (
                  <button
                    key={step}
                    onClick={() => onSelectRating(step)}
                    className={`chip ${active ? "chip-active" : ""}`}
                  >
                    {step === 0 ? t("discover.any") : `${step}+`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-hairline-light px-5 py-4">
          <button
            onClick={onClose}
            className="btn-primary-pill w-full py-3.5 text-base"
          >
            {t("discover.applyFilters")}
          </button>
        </div>
      </div>
    </div>
  );
}

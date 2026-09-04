import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, X, Check, RotateCcw } from "lucide-react";
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
  onReset: () => void;
  activeCount: number;
}

/**
 * Glassmorphism bottom-sheet drawer for filtering & sorting on mobile. Slides
 * up from the bottom with a grab handle, header actions and scrolled content.
 * Replaces the inline desktop filter row on small screens.
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-deep/70 backdrop-blur-sm animate-fade-in md:hidden"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[82vh] w-full flex-col rounded-t-3xl border-t border-x border-white/[0.08] bg-ink-deep/85 backdrop-blur-2xl shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Grab handle */}
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-white/20" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <h2 className="flex items-center gap-2 heading-display text-lg text-paper">
            <SlidersHorizontal className="h-5 w-5 text-mint-400" />
            {title}
            {activeCount > 0 && (
              <span className="glass-mint flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-mint-300">
                {activeCount}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="glass-panel flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-ash transition-all duration-ui ease-spring active:scale-95 hover:text-mint-300"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t("discover.reset")}
            </button>
            <button
              onClick={onClose}
              aria-label="Close filters"
              className="glass-panel flex h-10 w-10 items-center justify-center rounded-xl text-paper transition-all duration-ui ease-spring active:scale-90 active:duration-press hover:border-mint-500/30 hover:text-mint-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto pb-6">
          {/* Genres */}
          <div className="px-5 pt-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-ash">
              {t("discover.genres")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => selectedGenres.forEach((g) => onToggleGenre(g))}
                className={`chip ${selectedGenres.length === 0 ? "chip-active" : ""}`}
              >
                {t("discover.all")}
              </button>
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

          {/* Sort */}
          <div className="mt-6 px-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-ash">
              {t("discover.sortBy")}
            </p>
            <div className="mt-3 space-y-1.5">
              {sortOptions.map((opt) => {
                const active = sort === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => onSelectSort(opt.key)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-ui ease-spring active:scale-[0.98] ${
                      active
                        ? "border-mint-500/40 bg-mint-500/10 text-mint-300"
                        : "border-white/[0.08] bg-white/[0.03] text-paper hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint-500 text-ink">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Apply */}
        <div className="border-t border-white/[0.06] px-5 py-4">
          <button
            onClick={onClose}
            className="btn-mint w-full py-3.5 text-base"
          >
            {t("discover.applyFilters")}
          </button>
        </div>
      </div>
    </div>
  );
}
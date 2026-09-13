import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  BookOpen,
  Loader2,
  Zap,
  ZapOff,
  List,
  Check,
} from "lucide-react";
import type { MangaChapter, MangaSummary } from "@/services/manga";
import { chapterPages, pageUrl } from "@/services/manga";
import { useSettings } from "@/providers/SettingsProvider";
import { useMangaLibrary } from "@/providers/MangaLibraryProvider";

interface MangaReaderProps {
  manga: MangaSummary;
  chapter: MangaChapter;
  chapters: MangaChapter[];
  onClose: () => void;
}

const HINT_KEY = "agamiz:mangaReaderHint";

export function MangaReader({ manga, chapter, chapters, onClose }: MangaReaderProps) {
  const { t } = useTranslation();
  const { settings, update } = useSettings();
  const { recordProgress } = useMangaLibrary();
  const [current, setCurrent] = useState(chapter);
  const [pages, setPages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [uiVisible, setUiVisible] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [showChapterToast, setShowChapterToast] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showEndCard, setShowEndCard] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [arrowsVisible, setArrowsVisible] = useState(false);
  const [kbHintVisible, setKbHintVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const uiTimer = useRef<number | null>(null);
  const arrowTimer = useRef<number | null>(null);

  const mode = settings.mangaReaderMode;
  const readingRtl = settings.mangaReadingDirection === "rtl";

  const idxInList = chapters.findIndex((c) => c.id === current.id);
  const prevChapter = idxInList > 0 ? chapters[idxInList - 1] : null;
  const nextChapter = idxInList >= 0 && idxInList < chapters.length - 1 ? chapters[idxInList + 1] : null;
  const progress = pages.length > 0 ? ((index + 1) / pages.length) * 100 : 0;
  const atLastPage = pages.length > 0 && index === pages.length - 1;

  // First-use hint
  useEffect(() => {
    try {
      if (!localStorage.getItem(HINT_KEY)) {
        setShowHint(true);
        localStorage.setItem(HINT_KEY, "1");
        const timer = window.setTimeout(() => setShowHint(false), 5000);
        return () => window.clearTimeout(timer);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Keyboard hint (desktop)
  useEffect(() => {
    setKbHintVisible(true);
    const timer = window.setTimeout(() => setKbHintVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const fetchPages = useCallback(
    async (ch: MangaChapter) => {
      setLoading(true);
      setError(null);
      setPages([]);
      setLoaded({});
      setIndex(0);
      setShowEndCard(false);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      try {
        const info = await chapterPages(ch.id);
        const urls = (dataSaver ? info.filesSaver : info.files).map((f) =>
          pageUrl(info.baseUrl, info.hash, f, dataSaver),
        );
        setPages(urls);
        if (mode === "scroll") scrollRef.current?.scrollTo({ top: 0 });
      } catch (e) {
        setError(e instanceof Error ? e.message : t("manga.couldntLoad"));
      } finally {
        setLoading(false);
      }
    },
    [t, dataSaver, mode],
  );

  useEffect(() => {
    setCurrent(chapter);
  }, [chapter]);

  useEffect(() => {
    void fetchPages(current);
  }, [current, fetchPages]);

  // Record progress
  useEffect(() => {
    if (pages.length === 0) return;
    const isLast = idxInList === chapters.length - 1;
    const label = current.chapter ? `${t("manga.chapter")} ${current.chapter}` : current.title || "";
    recordProgress(manga.id, current.id, label, index + 1, pages.length, isLast);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id, index, pages.length]);

  // End-of-chapter card (paged mode)
  useEffect(() => {
    if (mode === "paged" && atLastPage) {
      setShowEndCard(true);
    } else {
      setShowEndCard(false);
    }
  }, [atLastPage, mode]);

  const flashChapterToast = () => {
    setShowChapterToast(true);
    if (uiTimer.current) window.clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => setShowChapterToast(false), 1800);
  };

  const goChapter = (ch: MangaChapter) => {
    setCurrent(ch);
    flashChapterToast();
    setShowChapters(false);
  };

  const nextPage = () => {
    setIndex((i) => {
      if (i + 1 < pages.length) return i + 1;
      if (nextChapter) goChapter(nextChapter);
      return i;
    });
  };

  const prevPage = () => {
    setIndex((i) => {
      if (i > 0) return i - 1;
      if (prevChapter) goChapter(prevChapter);
      return i;
    });
  };

  // In RTL: tap right = next page, tap left = previous
  // In LTR: tap left = next page, tap right = previous

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === " ") { e.preventDefault(); nextPage(); return; }
      if (zoom > 1) return;
      if (mode === "paged") {
        if (e.key === "ArrowRight") (readingRtl ? prevPage : nextPage)();
        if (e.key === "ArrowLeft") (readingRtl ? nextPage : prevPage)();
      }
      if (e.key === "f" || e.key === "F") setUiVisible((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pages.length, prevChapter, nextChapter, readingRtl, onClose, zoom]);

  // Preload next pages in paged mode
  useEffect(() => {
    if (mode !== "paged" || pages.length === 0) return;
    for (let i = 1; i <= 3; i++) {
      const src = pages[index + i];
      if (src) { const img = new Image(); img.src = src; }
    }
  }, [index, pages, mode]);

  // Auto-show arrows on mouse move / touch (paged mode)
  const showArrows = () => {
    setArrowsVisible(true);
    if (arrowTimer.current) window.clearTimeout(arrowTimer.current);
    arrowTimer.current = window.setTimeout(() => setArrowsVisible(false), 2000);
  };

  const switchMode = (m: "scroll" | "paged") => {
    if (m !== mode) {
      update({ mangaReaderMode: m });
      setIndex(0);
      setUiVisible(true);
      if (m === "scroll") scrollRef.current?.scrollTo({ top: 0 });
    }
  };

  const toggleUi = () => setUiVisible((v) => !v);

  // Touch handlers for paged mode
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    showArrows();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || zoom > 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) (readingRtl ? nextPage : prevPage)();
    else (readingRtl ? prevPage : nextPage)();
  };

  // Double-tap to zoom (paged mode, mobile)
  const onDoubleClick = () => {
    if (mode !== "paged") return;
    if (zoom > 1) { setZoom(1); setPanX(0); setPanY(0); }
    else setZoom(2);
  };

  // Scroll progress (scroll mode)
  const [scrollProgress, setScrollProgress] = useState(0);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
  };

  const chapterLabel = current.chapter ? `${t("manga.chapter")} ${current.chapter}` : current.title || "";

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-canvas-night">
      {/* ── Top bar (auto-hide) ── */}
      <div
        className={`absolute inset-x-0 top-0 z-20 border-b border-hairline-light bg-canvas-night-elevated/95 px-3 py-2.5 backdrop-blur-md transition-transform duration-ui ${
          uiVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-on-primary">{manga.title}</p>
            <p className="truncate text-xs text-shade-40">
              {chapterLabel}
              {current.group ? ` · ${current.group}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Data saver */}
            <button
              onClick={() => setDataSaver((d) => !d)}
              className={`flex h-8 items-center gap-1.5 rounded-pill px-2 transition-all duration-ui ${
                dataSaver ? "bg-accent text-accent-on" : "surface-dark text-shade-40 hover:text-on-primary"
              }`}
              title={dataSaver ? t("manga.dataSaverOn") : t("manga.dataSaverOff")}
            >
              {dataSaver ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
              <span className="hidden text-xs md:inline">{dataSaver ? "On" : "Off"}</span>
            </button>

            {/* Reading direction */}
            <button
              onClick={() => update({ mangaReadingDirection: readingRtl ? "ltr" : "rtl" })}
              className="surface-dark flex h-8 items-center rounded-pill px-2 text-xs font-medium text-shade-40 transition-all hover:text-on-primary"
              title={t("manga.readingDirection")}
            >
              {readingRtl ? "RTL" : "LTR"}
            </button>

            {/* Mode toggle */}
            <div className="surface-dark flex items-center gap-0.5 rounded-pill p-0.5">
              <button
                onClick={() => switchMode("scroll")}
                className={`flex h-7 w-7 items-center justify-center rounded-pill transition-all duration-ui ${
                  mode === "scroll" ? "bg-accent text-accent-on" : "text-shade-40 hover:text-on-primary"
                }`}
                title={t("manga.scrollMode")}
              >
                <ScrollText className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => switchMode("paged")}
                className={`flex h-7 w-7 items-center justify-center rounded-pill transition-all duration-ui ${
                  mode === "paged" ? "bg-accent text-accent-on" : "text-shade-40 hover:text-on-primary"
                }`}
                title={t("manga.pagedMode")}
              >
                <BookOpen className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Chapters list */}
            <button
              onClick={() => setShowChapters(true)}
              className="surface-dark flex h-8 items-center gap-1.5 rounded-pill px-2 transition-all hover:text-on-primary"
              title={t("manga.chapters")}
            >
              <List className="h-4 w-4" />
              <span className="hidden text-xs md:inline">{t("manga.chapters")}</span>
            </button>

            {/* Zoom reset */}
            {zoom > 1 && (
              <button
                onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}
                className="bg-accent flex h-8 items-center rounded-pill px-2 text-xs font-medium text-accent-on"
              >
                {t("manga.resetZoom")}
              </button>
            )}

            {prevChapter && (
              <button onClick={() => goChapter(prevChapter)} className="btn-icon h-8 w-8" title={t("manga.prevChapter")}>
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {nextChapter && (
              <button onClick={() => goChapter(nextChapter)} className="btn-icon h-8 w-8" title={t("manga.nextChapter")}>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} aria-label={t("common.close")} className="btn-icon h-8 w-8">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Chapter toast ── */}
      {showChapterToast && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center animate-fade-in">
          <div className="rounded-pill bg-canvas-night-elevated px-4 py-2 text-sm text-on-primary shadow-elev-4">
            {chapterLabel}
          </div>
        </div>
      )}

      {/* ── First-use hint ── */}
      {showHint && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60" onClick={() => setShowHint(false)}>
          <div className="surface-dark mx-6 max-w-sm rounded-lg p-6 text-center animate-scale-in">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-accent" />
            <p className="text-sm leading-relaxed text-on-primary">
              {mode === "paged"
                ? t("manga.hintPaged")
                : t("manga.hintScroll")}
            </p>
            <button onClick={() => setShowHint(false)} className="btn-primary-pill mt-4 px-6 py-2 text-sm">
              {t("common.confirm")}
            </button>
          </div>
        </div>
      )}

      {/* ── Keyboard hint (desktop) ── */}
      {kbHintVisible && !showHint && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 -translate-x-1/2 animate-fade-in rounded-pill bg-canvas-night/80 px-4 py-2 text-xs text-shade-40 backdrop-blur-md">
          ← → {t("manga.tapHint")}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          {mode === "scroll" ? (
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-1 px-2 pt-16">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-96 w-full animate-pulse rounded-sm bg-white/[0.06]" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-80 w-56 animate-pulse rounded-md bg-white/[0.06]" />
              <Loader2 className="h-8 w-8 animate-spin-slow text-on-primary" />
            </div>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <BookOpen className="h-10 w-10 text-shade-70" />
          <p className="max-w-sm text-sm text-shade-40">{error}</p>
          <button onClick={() => void fetchPages(current)} className="btn-outline-on-dark px-5 py-2.5 text-sm">
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* ── Scroll mode ── */}
      {!loading && !error && mode === "scroll" && (
        <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain" onClick={toggleUi} onScroll={onScroll}>
          <div className="mx-auto flex max-w-2xl flex-col items-center px-1 pt-16 pb-20">
            {pages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Page ${i + 1}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
                className={`mb-1 w-full rounded-sm transition-opacity duration-300 ${loaded[i] ? "opacity-100" : "opacity-0"}`}
              />
            ))}
            <div className="flex flex-col items-center gap-3 py-8">
              {nextChapter ? (
                <button
                  onClick={(e) => { e.stopPropagation(); goChapter(nextChapter); }}
                  className="btn-primary-pill px-6 py-2.5 text-sm"
                >
                  <ChevronRight className="h-4 w-4" /> {t("manga.nextChapter")}
                </button>
              ) : (
                <p className="text-sm text-shade-40">{t("manga.endOfManga")}</p>
              )}
              <p className="text-xs text-shade-50">{t("manga.credit")}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Paged mode ── */}
      {!loading && !error && mode === "paged" && pages.length > 0 && (
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onDoubleClick={onDoubleClick}
          onMouseMove={showArrows}
        >
          <img
            key={index}
            src={pages[index]}
            alt={`Page ${index + 1}`}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
              transformOrigin: "center",
            }}
          />

          {/* Visible page-turn arrows */}
          {arrowsVisible && zoom === 1 && (
            <>
              <div
                className={`pointer-events-none absolute inset-y-0 start-0 flex w-16 items-center justify-center bg-gradient-to-r from-black/40 to-transparent transition-opacity duration-300 ${
                  arrowsVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <ChevronLeft className="h-8 w-8 text-white/70" />
              </div>
              <div
                className={`pointer-events-none absolute inset-y-0 end-0 flex w-16 items-center justify-center bg-gradient-to-l from-black/40 to-transparent transition-opacity duration-300 ${
                  arrowsVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <ChevronRight className="h-8 w-8 text-white/70" />
              </div>
            </>
          )}

          {/* End-of-chapter card */}
          {showEndCard && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
              <div className="surface-dark mx-6 max-w-xs rounded-lg p-6 text-center animate-scale-in">
                <p className="text-sm font-medium text-on-primary">{t("manga.endOfChapter")}</p>
                <p className="mt-1 text-xs text-shade-40">{chapterLabel}</p>
                {nextChapter ? (
                  <button
                    onClick={() => goChapter(nextChapter)}
                    className="btn-primary-pill mt-4 px-6 py-2.5 text-sm"
                  >
                    <ChevronRight className="h-4 w-4" /> {t("manga.nextChapter")}
                  </button>
                ) : (
                  <p className="mt-4 text-sm text-accent">{t("manga.youveFinished")}</p>
                )}
              </div>
            </div>
          )}

          {/* Tap zones (disabled when zoomed or end card showing) */}
          {zoom === 1 && !showEndCard && (
            <>
              <button
                className="absolute inset-y-0 start-0 w-1/3 cursor-default"
                aria-label={readingRtl ? t("manga.prevPage") : t("manga.nextPage")}
                onClick={readingRtl ? prevPage : nextPage}
                tabIndex={-1}
              />
              <button
                className="absolute inset-y-0 start-1/3 w-1/3 cursor-default"
                aria-label={t("manga.toggleUi")}
                onClick={toggleUi}
                tabIndex={-1}
              />
              <button
                className="absolute inset-y-0 end-0 w-1/3 cursor-default"
                aria-label={readingRtl ? t("manga.nextPage") : t("manga.prevPage")}
                onClick={readingRtl ? nextPage : prevPage}
                tabIndex={-1}
              />
            </>
          )}
        </div>
      )}

      {/* ── Bottom bar (auto-hide) ── */}
      {!loading && !error && (
        <div
          className={`absolute inset-x-0 bottom-0 z-20 transition-transform duration-ui ${
            uiVisible ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {mode === "paged" ? (
            <div className="flex items-center gap-3 bg-canvas-night-elevated/95 px-4 py-2.5 backdrop-blur-md">
              <span className="shrink-0 text-xs tabular-nums text-shade-40">{index + 1}/{pages.length}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-pill bg-white/10">
                <div className="h-full rounded-pill bg-accent transition-all duration-ui" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-canvas-night-elevated/95 px-4 py-2.5 backdrop-blur-md">
              <span className="shrink-0 text-xs text-shade-40">{Math.round(scrollProgress)}%</span>
              <div className="h-1 flex-1 overflow-hidden rounded-pill bg-white/10">
                <div className="h-full rounded-pill bg-accent transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
              </div>
              {nextChapter && (
                <button
                  onClick={() => goChapter(nextChapter)}
                  className={`shrink-0 flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-medium transition-all ${
                    scrollProgress > 90 ? "bg-accent text-accent-on" : "text-shade-40 hover:text-on-primary"
                  }`}
                >
                  {t("manga.nextChapter")} <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Chapter selector panel ── */}
      {showChapters && (
        <div className="absolute inset-0 z-30 flex justify-end" onClick={() => setShowChapters(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="surface-dark relative flex h-full w-full max-w-xs flex-col animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hairline-light px-4 py-3">
              <h3 className="text-sm font-medium text-on-primary">{t("manga.chapters")}</h3>
              <button onClick={() => setShowChapters(false)} className="btn-icon h-8 w-8">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {chapters.map((c) => {
                const isActive = c.id === current.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => goChapter(c)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all duration-ui ${
                      isActive ? "border border-accent/30 bg-accent/10" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${isActive ? "font-medium text-accent" : "text-on-primary"}`}>
                        {c.chapter ? `${t("manga.chapter")} ${c.chapter}` : c.title || "Untitled"}
                      </p>
                      <p className="truncate text-xs text-shade-50">{c.group || c.language}</p>
                    </div>
                    {isActive && <Check className="h-4 w-4 shrink-0 text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

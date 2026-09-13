import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  X,
  Loader2,
  BookOpen,
  Calendar,
  Check,
  Play,
  Heart,
  Star,
  Users,
  ExternalLink,
  ChevronDown,
  Clock,
} from "lucide-react";
import type { MangaChapter, MangaSummary } from "@/services/manga";
import { getManga, mangaFeed } from "@/services/manga";
import { mangaLangFor } from "@/services/manga";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { Spinner } from "@/components/ui/Spinner";
import { useMangaLibrary } from "@/providers/MangaLibraryProvider";

interface MangaDetailsModalProps {
  mangaId: string;
  initial: MangaSummary | null;
  langs: string[];
  onClose: () => void;
  onRead: (manga: MangaSummary, chapter: MangaChapter, chapters: MangaChapter[]) => void;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function MangaDetailsModal({ mangaId, initial, langs, onClose, onRead }: MangaDetailsModalProps) {
  const { t } = useTranslation();
  const { getProgress, isFinished, isFavorite, toggleFavorite } = useMangaLibrary();
  const [manga, setManga] = useState<MangaSummary | null>(initial);
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const mdLang = langs.map(mangaLangFor);
    const load = async () => {
      try {
        const m = initial ?? (await getManga(mangaId, mdLang));
        if (cancelled) return;
        setManga(m);
        const feed = await mangaFeed(mangaId, mdLang);
        if (cancelled) return;
        setChapters(feed);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("manga.couldntLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const progress = manga ? getProgress(manga.id) : null;
  const finished = manga ? isFinished(manga.id) : false;
  const fav = manga ? isFavorite(manga.id) : false;

  const grouped = useMemo(() => {
    const byLang = new Map<string, MangaChapter[]>();
    for (const c of chapters) {
      const list = byLang.get(c.language) ?? [];
      list.push(c);
      byLang.set(c.language, list);
    }
    return byLang;
  }, [chapters]);

  const primaryLang = langs.map(mangaLangFor).find((l) => grouped.has(l)) ?? "en";
  const list = grouped.get(primaryLang) ?? chapters;
  const continueChapter = progress ? list.find((c) => c.id === progress.chapterId) : null;

  const tagGenres = manga?.tags.filter((tg) => tg.group === "genre").slice(0, 6) ?? [];
  const tagThemes = manga?.tags.filter((tg) => tg.group === "theme").slice(0, 6) ?? [];

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-2 py-4 animate-fade-in sm:px-4 sm:py-6"
      onClick={onClose}
    >
      <AmbientGlow imageUrl={manga?.coverUrl ?? null} />
      <div
        className="surface-dark relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg shadow-elev-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="btn-icon absolute end-3 top-3 z-10 h-9 w-9 bg-black/50"
        >
          <X className="h-4 w-4" />
        </button>

        {loading && !manga ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Spinner className="h-9 w-9" />
            <p className="text-sm text-shade-40">{t("manga.loading")}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <BookOpen className="h-10 w-10 text-shade-70" />
            <p className="max-w-sm text-sm text-shade-40">{error}</p>
          </div>
        ) : manga ? (
          <>
            {/* Header */}
            <div className="shrink-0 gap-4 border-b border-hairline-light p-5 sm:flex sm:p-6">
              <div className="relative mx-auto h-32 w-24 shrink-0 overflow-hidden rounded-md bg-white/[0.04] sm:mx-0 sm:h-40 sm:w-28">
                {manga.coverUrl ? (
                  <img src={manga.coverUrl} alt={manga.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-8 w-8 text-shade-70" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 pt-3 text-center sm:pt-1 sm:text-start">
                <h2 className="heading-display text-xl text-on-primary sm:text-2xl">{manga.title || "Untitled"}</h2>
                {manga.altTitles[0] && (
                  <p className="mt-0.5 truncate text-xs text-shade-40">{manga.altTitles[0]}</p>
                )}
                <div className="mt-2.5 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {manga.rating > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-xs border border-white/[0.12] bg-canvas-night-elevated px-2 py-0.5 text-xs text-on-primary">
                      <Star className="h-3 w-3 text-accent" fill="currentColor" /> {manga.rating}
                    </span>
                  )}
                  {manga.follows > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-xs border border-white/[0.12] bg-canvas-night-elevated px-2 py-0.5 text-xs text-on-primary">
                      <Users className="h-3 w-3" /> {manga.follows > 999 ? `${(manga.follows / 1000).toFixed(0)}k` : manga.follows}
                    </span>
                  )}
                  {manga.year && (
                    <span className="inline-flex items-center gap-1 rounded-xs border border-white/[0.12] bg-canvas-night-elevated px-2 py-0.5 text-xs text-on-primary">
                      <Calendar className="h-3 w-3" /> {manga.year}
                    </span>
                  )}
                  {manga.status && (
                    <span className="inline-flex items-center rounded-xs border border-white/[0.12] bg-canvas-night-elevated px-2 py-0.5 text-xs capitalize text-on-primary">
                      {manga.status}
                    </span>
                  )}
                  {finished && (
                    <span className="inline-flex items-center gap-1 rounded-xs border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      <Check className="h-3 w-3" /> {t("manga.finished")}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-shade-40 sm:justify-start">
                  {manga.author && <span>{t("manga.author")}: <span className="text-on-primary">{manga.author}</span></span>}
                  {manga.artist && manga.artist !== manga.author && (
                    <span>{t("manga.artist")}: <span className="text-on-primary">{manga.artist}</span></span>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Actions */}
              <div className="flex items-center gap-2 px-5 pt-4 sm:px-6">
                {continueChapter && !finished && (
                  <button
                    onClick={() => onRead(manga, continueChapter, list)}
                    className="btn-primary-pill flex-1 px-4 py-2.5 text-sm sm:flex-none"
                  >
                    <Play className="h-4 w-4" fill="currentColor" /> {t("manga.continueReading")}
                    <span className="text-xs opacity-70"> · {progress?.chapterLabel}</span>
                  </button>
                )}
                {list.length > 0 && (!continueChapter || finished) && (
                  <button
                    onClick={() => onRead(manga, list[0], list)}
                    className="btn-primary-pill flex-1 px-4 py-2.5 text-sm sm:flex-none"
                  >
                    <Play className="h-4 w-4" fill="currentColor" /> {t("manga.startReading")}
                  </button>
                )}
                <button
                  onClick={() => toggleFavorite(manga)}
                  className={`btn-outline-on-dark px-4 py-2.5 text-sm ${fav ? "border-accent/40 bg-accent/10 text-accent" : ""}`}
                >
                  <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
                  {fav ? t("manga.inFavorites") : t("manga.addToFavorites")}
                </button>
              </div>

              {/* Tags */}
              {(tagGenres.length > 0 || tagThemes.length > 0) && (
                <div className="px-5 pt-4 sm:px-6">
                  {tagGenres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tagGenres.map((tg) => (
                        <span key={tg.id} className="chip cursor-default px-2.5 py-0.5 text-xs">{tg.name}</span>
                      ))}
                    </div>
                  )}
                  {tagThemes.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {tagThemes.map((tg) => (
                        <span key={tg.id} className="chip cursor-default px-2.5 py-0.5 text-xs opacity-70">{tg.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {manga.description && (
                <div className="px-5 pt-4 sm:px-6">
                  <p
                    className={`text-sm leading-relaxed text-on-primary/70 whitespace-pre-line ${
                      descExpanded ? "" : "[display:-webkit-box] [-webkit-line-clamp:4] [-webkit-box-orient:vertical] overflow-hidden"
                    }`}
                  >
                    {manga.description}
                  </p>
                  {manga.description.length > 200 && (
                    <button
                      onClick={() => setDescExpanded((e) => !e)}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:opacity-70"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${descExpanded ? "rotate-180" : ""}`} />
                      {descExpanded ? t("manga.showLess") : t("manga.showMore")}
                    </button>
                  )}
                </div>
              )}

              {/* External links */}
              {manga.links && Object.keys(manga.links).length > 0 && (
                <div className="flex flex-wrap gap-2 px-5 pt-3 sm:px-6">
                  {manga.links.mal && (
                    <a href={`https://myanimelist.net/manga/${manga.links.mal}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-shade-40 hover:text-on-primary">
                      <ExternalLink className="h-3 w-3" /> MAL
                    </a>
                  )}
                  {manga.links.al && (
                    <a href={`https://anilist.co/manga/${manga.links.al}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-shade-40 hover:text-on-primary">
                      <ExternalLink className="h-3 w-3" /> AniList
                    </a>
                  )}
                </div>
              )}

              {/* Chapters */}
              <div className="px-5 pt-5 pb-3 sm:px-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="eyebrow">{t("manga.chapters")}</h3>
                  {list.length > 0 && <span className="text-xs text-shade-50">{list.length}</span>}
                </div>
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-shade-40">
                    <Loader2 className="h-4 w-4 animate-spin-slow text-on-primary" /> {t("manga.loading")}
                  </div>
                ) : list.length === 0 ? (
                  <p className="text-sm text-shade-40">{t("manga.noChapters")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {list.map((c) => {
                      const isCurrent = progress?.chapterId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => onRead(manga, c, list)}
                          className={`flex w-full items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-all duration-ui ease-spring active:scale-[0.99] ${
                            isCurrent
                              ? "border-accent/30 bg-accent/10"
                              : "border-white/[0.08] bg-canvas-night-elevated hover:border-white/[0.16] hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-on-primary">
                                {c.chapter ? `${t("manga.chapter")} ${c.chapter}` : c.title || "Untitled"}
                              </p>
                              {isCurrent && (
                                <span className="shrink-0 rounded-xs bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-on">
                                  {t("manga.youAreHere")}
                                </span>
                              )}
                            </div>
                            {c.title && c.chapter && (
                              <p className="truncate text-xs text-shade-40">{c.title}</p>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-shade-50">
                              <span className="rounded-xs bg-white/[0.06] px-1 py-0.5">{c.language}</span>
                              {c.group && <span className="truncate">{c.group}</span>}
                              {c.readableAt && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" /> {formatDate(c.readableAt)}
                                </span>
                              )}
                              <span>{c.pages}p</span>
                            </div>
                          </div>
                          <BookOpen className="h-5 w-5 shrink-0 text-shade-50" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="px-5 pb-5 text-center text-xs text-shade-50 sm:px-6">{t("manga.credit")}</p>
            </div>
          </>
        ) : null}
      </div>
      </div>,
      document.body,
    );
  }

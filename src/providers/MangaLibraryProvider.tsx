import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import type { MangaSummary } from "@/services/manga";

export interface MangaProgress {
  chapterId: string;
  chapterLabel: string;
  page: number;
  totalPages: number;
  updatedAt: number;
  finished: boolean;
}

export interface MangaFavorite {
  id: string;
  title: string;
  coverUrl: string | null;
  status: string;
  year: number | null;
  addedAt: number;
}

interface MangaLibraryContextValue {
  progress: Record<string, MangaProgress>;
  favorites: Record<string, MangaFavorite>;
  getProgress: (mangaId: string) => MangaProgress | null;
  recordProgress: (mangaId: string, chapterId: string, chapterLabel: string, page: number, totalPages: number, isLastChapter: boolean) => void;
  isFinished: (mangaId: string) => boolean;
  isChapterRead: (mangaId: string, chapterId: string) => boolean;
  markChapterRead: (mangaId: string, chapterId: string) => void;
  isFavorite: (mangaId: string) => boolean;
  toggleFavorite: (manga: MangaSummary) => void;
  favoriteList: MangaFavorite[];
  readingList: MangaFavorite[];
  finishedList: MangaFavorite[];
}

const MangaLibraryContext = createContext<MangaLibraryContextValue | null>(null);

const PROGRESS_KEY = "agamiz:mangaProgress";
const FAV_KEY = "agamiz:mangaFavorites";

export function MangaLibraryProvider({ children }: { children: ReactNode }) {
  const { value: progressMap, set: setProgress } = usePersistentState<Record<string, MangaProgress>>(
    PROGRESS_KEY,
    {},
  );
  const { value: favoritesMap, set: setFavorites } = usePersistentState<Record<string, MangaFavorite>>(
    FAV_KEY,
    {},
  );

  const getProgress = useCallback(
    (mangaId: string) => progressMap[mangaId] ?? null,
    [progressMap],
  );

  const isFinished = useCallback(
    (mangaId: string) => progressMap[mangaId]?.finished ?? false,
    [progressMap],
  );

  const isChapterRead = useCallback(
    (mangaId: string, chapterId: string) => {
      const p = progressMap[mangaId];
      if (!p) return false;
      return p.chapterId === chapterId;
    },
    [progressMap],
  );

  const markChapterRead = useCallback(
    (mangaId: string, chapterId: string) => {
      setProgress((prev) => {
        const p = prev[mangaId];
        return {
          ...prev,
          [mangaId]: {
            chapterId,
            chapterLabel: p?.chapterLabel ?? "",
            page: p?.page ?? 0,
            totalPages: p?.totalPages ?? 0,
            updatedAt: Date.now(),
            finished: p?.finished ?? false,
          },
        };
      });
    },
    [setProgress],
  );

  const recordProgress = useCallback(
    (mangaId: string, chapterId: string, chapterLabel: string, page: number, totalPages: number, isLastChapter: boolean) => {
      setProgress((prev) => {
        const finished = isLastChapter && page >= totalPages;
        return {
          ...prev,
          [mangaId]: { chapterId, chapterLabel, page, totalPages, updatedAt: Date.now(), finished },
        };
      });
    },
    [setProgress],
  );

  const isFavorite = useCallback(
    (mangaId: string) => !!favoritesMap[mangaId],
    [favoritesMap],
  );

  const toggleFavorite = useCallback(
    (manga: MangaSummary) => {
      setFavorites((prev) => {
        if (prev[manga.id]) {
          const next = { ...prev };
          delete next[manga.id];
          return next;
        }
        return {
          ...prev,
          [manga.id]: {
            id: manga.id,
            title: manga.title,
            coverUrl: manga.coverUrl,
            status: manga.status,
            year: manga.year,
            addedAt: Date.now(),
          },
        };
      });
    },
    [setFavorites],
  );

  const favoriteList = useMemo(() => Object.values(favoritesMap).sort((a, b) => b.addedAt - a.addedAt), [favoritesMap]);
  const readingList = useMemo(
    () => favoriteList.filter((f) => progressMap[f.id] && !progressMap[f.id].finished),
    [favoriteList, progressMap],
  );
  const finishedList = useMemo(
    () => favoriteList.filter((f) => progressMap[f.id]?.finished),
    [favoriteList, progressMap],
  );

  const value = useMemo(
    () => ({
      progress: progressMap,
      favorites: favoritesMap,
      getProgress,
      recordProgress,
      isFinished,
      isChapterRead,
      markChapterRead,
      isFavorite,
      toggleFavorite,
      favoriteList,
      readingList,
      finishedList,
    }),
    [progressMap, favoritesMap, getProgress, recordProgress, isFinished, isChapterRead, markChapterRead, isFavorite, toggleFavorite, favoriteList, readingList, finishedList],
  );

  return <MangaLibraryContext.Provider value={value}>{children}</MangaLibraryContext.Provider>;
}

export function useMangaLibrary(): MangaLibraryContextValue {
  const ctx = useContext(MangaLibraryContext);
  if (!ctx) throw new Error("useMangaLibrary must be used within a MangaLibraryProvider");
  return ctx;
}

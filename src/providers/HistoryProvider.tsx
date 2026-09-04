import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  STORAGE_KEYS,
  type HistoryItem,
  type MediaRef,
} from "@/types/app";

interface HistoryContextValue {
  items: HistoryItem[];
  hydrated: boolean;
  record: (
    item: {
      id: number;
      mediaType: MediaRef["mediaType"];
      title: string;
      progress: number;
      season?: number;
      episode?: number;
      posterPath?: string | null;
      backdropPath?: string | null;
      voteAverage?: number;
      releaseDate?: string;
    },
  ) => void;
  updateProgress: (
    id: number,
    mediaType: MediaRef["mediaType"],
    progress: number,
  ) => void;
  remove: (id: number, mediaType: MediaRef["mediaType"]) => void;
  clear: () => void;
  replace: (items: HistoryItem[]) => void;
  /** Items that have progress > 0 but < 98 — used for Continue Watching. */
  continueWatching: HistoryItem[];
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { value: items, set: setItems, hydrated } = usePersistentState<
    HistoryItem[]
  >(STORAGE_KEYS.history, []);

  const record = useCallback(
    (item: {
      id: number;
      mediaType: MediaRef["mediaType"];
      title: string;
      progress: number;
      season?: number;
      episode?: number;
      posterPath?: string | null;
      backdropPath?: string | null;
      voteAverage?: number;
      releaseDate?: string;
    }) => {
      setItems((prev) => {
        const rest = prev.filter(
          (i) => !(i.id === item.id && i.mediaType === item.mediaType),
        );
        return [
          {
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterPath: item.posterPath ?? null,
            backdropPath: item.backdropPath ?? null,
            voteAverage: item.voteAverage ?? 0,
            releaseDate: item.releaseDate,
            progress: item.progress,
            season: item.season,
            episode: item.episode,
            watchedAt: Date.now(),
          },
          ...rest,
        ].slice(0, 60);
      });
    },
    [setItems],
  );

  const updateProgress = useCallback(
    (id: number, mediaType: MediaRef["mediaType"], progress: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id && i.mediaType === mediaType
            ? { ...i, progress, watchedAt: Date.now() }
            : i,
        ),
      );
    },
    [setItems],
  );

  const remove = useCallback(
    (id: number, mediaType: MediaRef["mediaType"]) => {
      setItems((prev) =>
        prev.filter((i) => !(i.id === id && i.mediaType === mediaType)),
      );
    },
    [setItems],
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  const replace = useCallback((items: HistoryItem[]) => setItems(items), [setItems]);

  const continueWatching = useMemo(
    () =>
      items
        .filter((i) => i.progress > 0 && i.progress < 98)
        .slice(0, 12),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      hydrated,
      record,
      updateProgress,
      remove,
      clear,
      replace,
      continueWatching,
    }),
    [items, hydrated, record, updateProgress, remove, clear, replace, continueWatching],
  );

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return ctx;
}

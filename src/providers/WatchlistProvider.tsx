import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { STORAGE_KEYS, type MediaRef, type WatchlistItem } from "@/types/app";

interface WatchlistContextValue {
  items: WatchlistItem[];
  hydrated: boolean;
  count: number;
  has: (id: number, mediaType: MediaRef["mediaType"]) => boolean;
  add: (item: MediaRef) => void;
  remove: (id: number, mediaType: MediaRef["mediaType"]) => void;
  toggle: (item: MediaRef) => boolean;
  clear: () => void;
  replace: (items: WatchlistItem[]) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { value: items, set: setItems, hydrated } = usePersistentState<
    WatchlistItem[]
  >(STORAGE_KEYS.watchlist, []);

  const has = useCallback(
    (id: number, mediaType: MediaRef["mediaType"]) =>
      items.some((i) => i.id === id && i.mediaType === mediaType),
    [items],
  );

  const add = useCallback(
    (item: MediaRef) => {
      setItems((prev) =>
        prev.some((i) => i.id === item.id && i.mediaType === item.mediaType)
          ? prev
          : [{ ...item, addedAt: Date.now() }, ...prev],
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

  const toggle = useCallback(
    (item: MediaRef): boolean => {
      let added = false;
      setItems((prev) => {
        const exists = prev.some(
          (i) => i.id === item.id && i.mediaType === item.mediaType,
        );
        added = !exists;
        return exists
          ? prev.filter(
              (i) => !(i.id === item.id && i.mediaType === item.mediaType),
            )
          : [{ ...item, addedAt: Date.now() }, ...prev];
      });
      return added;
    },
    [setItems],
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  const replace = useCallback((items: WatchlistItem[]) => setItems(items), [setItems]);

  const value = useMemo(
    () => ({
      items,
      hydrated,
      count: items.length,
      has,
      add,
      remove,
      toggle,
      clear,
      replace,
    }),
    [items, hydrated, has, add, remove, toggle, clear, replace],
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return ctx;
}

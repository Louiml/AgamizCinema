import { useCallback, useEffect, useRef, useState } from "react";
import { readStore, writeStore } from "@/services/storage";

/**
 * Async-backed local state that transparently persists to the Rust backend
 * (Tauri) or falls back to localStorage in the browser.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    let cancelled = false;
    readStore<T>(key, initialRef.current)
      .then((stored) => {
        if (!cancelled) {
          setState(stored);
          setHydrated(true);
        }
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const set = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: T) => T)(prev)
            : updater;
        void writeStore<T>(key, next);
        return next;
      });
    },
    [key],
  );

  return { value: state, set, hydrated };
}

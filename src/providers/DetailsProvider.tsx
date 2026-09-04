import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MediaRef } from "@/types/app";

interface DetailsContextValue {
  media: MediaRef | null;
  open: (media: MediaRef) => void;
  close: () => void;
}

const DetailsContext = createContext<DetailsContextValue | null>(null);

/**
 * Global state for the media info modal. `open()` sets the title to inspect;
 * the modal fetches rich metadata from TMDB and renders it.
 */
export function DetailsProvider({ children }: { children: ReactNode }) {
  const [media, setMedia] = useState<MediaRef | null>(null);

  const open = useCallback((next: MediaRef) => setMedia(next), []);
  const close = useCallback(() => setMedia(null), []);

  const value = useMemo(() => ({ media, open, close }), [media, open, close]);

  return <DetailsContext.Provider value={value}>{children}</DetailsContext.Provider>;
}

export function useDetails(): DetailsContextValue {
  const ctx = useContext(DetailsContext);
  if (!ctx) {
    throw new Error("useDetails must be used within a DetailsProvider");
  }
  return ctx;
}

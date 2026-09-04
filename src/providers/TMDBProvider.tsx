import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PlayerState } from "@/types/app";

interface PlayerContextValue {
  state: PlayerState | null;
  open: (state: PlayerState) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState | null>(null);

  const open = useCallback((next: PlayerState) => setState(next), []);
  const close = useCallback(() => setState(null), []);

  const value = useMemo(() => ({ state, open, close }), [state, open, close]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return ctx;
}

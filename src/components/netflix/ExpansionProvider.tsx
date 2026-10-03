import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NetflixExpandedCard, type ExpandTarget } from "./NetflixExpandedCard";

interface ExpansionContextValue {
  expanded: ExpandTarget | null;
  expand: (target: ExpandTarget) => void;
  collapse: () => void;
}

const ExpansionContext = createContext<ExpansionContextValue | null>(null);

/**
 * Owns the single expanded poster, app-wide.
 *
 * Expansion used to live in each rail, which meant sweeping the cursor down the
 * page left one overlay open per rail — they stacked on top of each other and
 * only the last one you touched would close. One owner also means the overlay
 * can be rendered in exactly one place.
 */
export function ExpansionProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState<ExpandTarget | null>(null);

  const expand = useCallback((target: ExpandTarget) => setExpanded(target), []);
  const collapse = useCallback(() => setExpanded(null), []);

  const value = useMemo(
    () => ({ expanded, expand, collapse }),
    [expanded, expand, collapse],
  );

  return (
    <ExpansionContext.Provider value={value}>
      {children}
      {expanded && (
        <NetflixExpandedCard {...expanded} onClose={collapse} />
      )}
    </ExpansionContext.Provider>
  );
}

export function useExpansion(): ExpansionContextValue {
  const ctx = useContext(ExpansionContext);
  if (!ctx) {
    throw new Error("useExpansion must be used within an ExpansionProvider");
  }
  return ctx;
}
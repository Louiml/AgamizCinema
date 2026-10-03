import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { isTauri } from "@/services/tauri";
import { syncDownloadPath } from "@/services/download";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  type AppSettings,
  type UiDesign,
} from "@/types/app";

interface SettingsContextValue {
  settings: AppSettings;
  hydrated: boolean;
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { value: stored, set: setSettings, hydrated } = usePersistentState<
    AppSettings
  >(STORAGE_KEYS.settings, DEFAULT_SETTINGS);

  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...stored }),
    [stored],
  );

  const update = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [setSettings],
  );

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [setSettings]);

  useEffect(() => {
    if (!hydrated || !isTauri()) return;
    syncDownloadPath(settings.downloadPath).catch((err) => {
      console.warn("[settings] could not sync download path.", err);
    });
  }, [hydrated, settings.downloadPath]);

  const value = useMemo(
    () => ({ settings, hydrated, update, reset }),
    [settings, hydrated, update, reset],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}

/**
 * Which UI skin is active. "classic" is the original design, "netflix" is the
 * Netflix-inspired redesign.
 */
export function useDesign(): UiDesign {
  return useSettings().settings.uiDesign;
}

/** Shorthand for `useDesign() === "netflix"`. */
export function useIsNetflix(): boolean {
  return useSettings().settings.uiDesign === "netflix";
}

/**
 * Whether the app is currently in light mode.
 *
 * The Netflix design is dark-only, so it always reports false — that keeps every
 * existing `useIsLight()` consumer correct without touching a single component.
 */
export function useIsLight(): boolean {
  const { settings } = useSettings();
  if (settings.uiDesign === "netflix") return false;
  return settings.themeMode === "light";
}
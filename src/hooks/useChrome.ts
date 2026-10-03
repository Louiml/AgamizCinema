import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { isTauri } from "@/services/tauri";

interface WindowControls {
  /** True once the Tauri window API has resolved (always false on web). */
  available: boolean;
  isMaximized: boolean;
  isFullscreen: boolean;
  minimize: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  close: () => Promise<void>;
}

const UNAVAILABLE: WindowControls = {
  available: false,
  isMaximized: false,
  isFullscreen: false,
  minimize: async () => {},
  toggleFullscreen: async () => {},
  close: async () => {},
};

/**
 * Native window controls for the desktop (Tauri) build.
 *
 * Lazily imports the Tauri window module and degrades to no-ops on the web,
 * so callers can render the buttons unconditionally.
 */
export function useWindowControls(): WindowControls {
  const [available, setAvailable] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    const unlisten: Array<() => void> = [];

    void (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      if (cancelled) return;
      const win = getCurrentWindow();
      setAvailable(true);

      const refresh = async () => {
        if (cancelled) return;
        try {
          setIsMaximized(await win.isMaximized());
          setIsFullscreen(await win.isFullscreen());
        } catch {
          /* ignore */
        }
      };
      void refresh();

      try {
        unlisten.push(await win.onResized(() => void refresh()));
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      unlisten.forEach((u) => u());
    };
  }, []);

  const minimize = async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().minimize();
  };
  const toggleFullscreen = async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    const next = !(await win.isFullscreen().catch(() => false));
    await win.setFullscreen(next);
    setIsFullscreen(next);
  };
  const close = async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  };

  if (!available) {
    return { ...UNAVAILABLE, available, minimize, toggleFullscreen, close };
  }
  return {
    available,
    isMaximized,
    isFullscreen,
    minimize,
    toggleFullscreen,
    close,
  };
}

/**
 * True once the page has scrolled past `threshold` pixels. Used by both
 * headers to swap between a transparent and a solid background.
 */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

/**
 * Binds the global search palette to ⌘K / Ctrl+K and to `/`.
 *
 * Returns the current open state plus a setter, so the caller stays in
 * control of where the modal is rendered.
 */
export function useSearchHotkey(): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (
        e.key === "/" &&
        !typing &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return [open, setOpen];
}
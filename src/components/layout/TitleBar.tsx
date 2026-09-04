import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Home,
  Compass,
  Bookmark,
  Settings,
  Search,
  Minus,
  Maximize,
  Minimize,
  X,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { SearchModal } from "@/components/search/SearchModal";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { isTauri } from "@/services/tauri";
import { ExternalLinks } from "@/components/ui/ExternalLinks";
import type { Route } from "@/router/useHashRoute";
import logoUrl from "@/logo.png";

interface TitleBarProps {
  route: Route;
  navigate: (r: Route) => void;
}

const NAV_ITEMS: Array<{ id: Route; labelKey: string; icon: typeof Home }> = [
  { id: "home", labelKey: "nav.home", icon: Home },
  { id: "discover", labelKey: "nav.discover", icon: Compass },
  { id: "watchlist", labelKey: "nav.watchlist", icon: Bookmark },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];

function useWindowControls() {
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

  return { available, isMaximized, isFullscreen, minimize, toggleFullscreen, close };
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrolled;
}

export function TitleBar({ route, navigate }: TitleBarProps) {
  const { t } = useTranslation();
  const { count } = useWatchlist();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const windowCtl = useWindowControls();
  const scrolled = useScrolled();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
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
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isMobile) return null;

  return (
    <>
      <header
        data-tauri-drag-region
        className={`glass-chrome sticky top-0 z-40 select-none transition-shadow duration-ui ${
          scrolled ? "shadow-[0_12px_32px_-16px_rgba(0,0,0,0.8)]" : ""
        }`}
      >
        <div
          data-tauri-drag-region
          className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
        >
          {/* Brand (draggable) */}
          <button
            onClick={() => navigate("home")}
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="Agamiz Cinema — Home"
          >
            <span className="glass-mint flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl transition-transform duration-ui ease-spring group-hover:scale-105 group-active:scale-95">
              <img
                src={logoUrl}
                alt=""
                className="h-7 w-7 object-contain"
                draggable={false}
              />
            </span>
            <span className="heading-display hidden text-lg leading-none text-paper lg:block">
              Agamiz<span className="text-gradient-mint"> Cinema</span>
            </span>
          </button>

          {/* Nav links (desktop) — segmented pill group */}
          <nav
            data-tauri-drag-region
            className="hidden items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] p-1 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = route === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-ui ease-spring active:scale-[0.97] active:duration-press ${
                    active
                      ? "bg-white/[0.09] text-paper shadow-edge-light"
                      : "text-ash hover:text-paper"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors duration-ui ${
                      active ? "text-mint-400" : ""
                    }`}
                  />
                  {t(item.labelKey)}
                  {item.id === "watchlist" && count > 0 && (
                    <span className="ms-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-mint-500 px-1.5 text-[10px] font-bold text-ink">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right cluster: language, search + window controls */}
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSelector align="end" className="hidden lg:block" />
            <ExternalLinks className="hidden lg:flex" />
            <button
              onClick={() => setSearchOpen(true)}
              className="glass-panel flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ash transition-all duration-ui ease-spring hover:border-white/[0.16] hover:text-paper active:scale-[0.97] active:duration-press"
            >
              <Search className="h-4 w-4" />
              <span className="hidden xl:inline">{t("common.search")}</span>
              <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-ash xl:inline">
                {t("common.searchShortcut")}
              </kbd>
            </button>

            {windowCtl.available && (
              <div className="flex items-stretch">
                <button
                  onClick={() => void windowCtl.minimize()}
                  aria-label="Minimize window"
                  className="flex h-8 w-9 items-center justify-center rounded-lg text-ash transition-all duration-press hover:bg-white/10 hover:text-paper active:scale-95"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => void windowCtl.toggleFullscreen()}
                  aria-label={windowCtl.isFullscreen ? "Exit full screen" : "Enter full screen"}
                  className="flex h-8 w-9 items-center justify-center rounded-lg text-ash transition-all duration-press hover:bg-white/10 hover:text-paper active:scale-95"
                >
                  {windowCtl.isFullscreen ? (
                    <Minimize className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => void windowCtl.close()}
                  aria-label="Close window"
                  className="flex h-8 w-9 items-center justify-center rounded-lg text-ash transition-all duration-press hover:bg-rose-500 hover:text-white active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

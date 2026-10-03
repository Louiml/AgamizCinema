import { useTranslation } from "react-i18next";
import { Search, Minus, Maximize, Minimize, X } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWindowControls, useScrolled, useSearchHotkey } from "@/hooks/useChrome";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { SearchModal } from "@/components/search/SearchModal";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { ExternalLinks } from "@/components/ui/ExternalLinks";
import { NAV_ITEMS } from "@/components/layout/navItems";
import { Logo } from "@/components/ui/Logo";
import type { Route } from "@/router/useHashRoute";

interface NetflixTitleBarProps {
  route: Route;
  navigate: (r: Route) => void;
}

/**
 * Netflix desktop chrome: a transparent bar over the hero that solidifies to
 * #141414 once you scroll, with the nav left-aligned beside the wordmark
 * instead of centred in a segmented pill.
 */
export function NetflixTitleBar({ route, navigate }: NetflixTitleBarProps) {
  const { t } = useTranslation();
  const { count } = useWatchlist();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useSearchHotkey();
  const windowCtl = useWindowControls();
  const scrolled = useScrolled(16);

  if (isMobile) return null;

  return (
    <>
      <header
        data-tauri-drag-region
        onContextMenu={(e) => e.preventDefault()}
        className={`sticky top-0 z-40 select-none transition-colors duration-surface ${
          scrolled
            ? "border-b border-white/[0.06] bg-canvas-night/95 backdrop-blur-sm"
            : "border-b border-transparent bg-gradient-to-b from-black/70 to-transparent"
        }`}
      >
        <div
          data-tauri-drag-region
          className="flex h-16 items-center gap-8 px-4 sm:px-8 lg:px-16"
        >
          {/* Wordmark */}
          <button
            onClick={() => navigate("home")}
            aria-label="Agamiz Cinema - Home"
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-accent">
              <Logo className="h-6 w-6 text-on-accent" />
            </span>
            <span className="nf-title text-lg text-on-primary">Agamiz Cinema</span>
          </button>

          {/* Left-aligned text nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-1 text-sm transition-colors duration-ui ${
                    active ? "text-on-primary" : "text-on-primary/65 hover:text-on-primary"
                  }`}
                >
                  {t(item.labelKey)}
                  {item.id === "watchlist" && count > 0 && (
                    <span className="ms-1.5 rounded-[2px] bg-accent px-1.5 py-px text-[10px] font-bold text-on-accent">
                      {count}
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-0.5 h-[2px] bg-accent" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="ms-auto flex shrink-0 items-center gap-1">
            <LanguageSelector align="end" className="hidden lg:block" />
            <ExternalLinks className="hidden lg:flex" />
            <button
              onClick={() => setSearchOpen(true)}
              aria-label={t("common.search")}
              className="flex h-9 w-9 items-center justify-center rounded-[2px] text-on-primary/80 transition-colors duration-ui hover:bg-white/10 hover:text-on-primary"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            {windowCtl.available && (
              <div className="ms-2 flex items-stretch">
                <button
                  onClick={() => void windowCtl.minimize()}
                  aria-label="Minimize window"
                  className="flex h-8 w-9 items-center justify-center text-on-primary/70 transition-colors duration-press hover:bg-white/10 hover:text-on-primary"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => void windowCtl.toggleFullscreen()}
                  aria-label={
                    windowCtl.isFullscreen ? "Exit full screen" : "Enter full screen"
                  }
                  className="flex h-8 w-9 items-center justify-center text-on-primary/70 transition-colors duration-press hover:bg-white/10 hover:text-on-primary"
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
                  className="flex h-8 w-9 items-center justify-center transition-colors duration-press hover:bg-accent hover:text-on-accent"
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
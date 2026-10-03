import { useTranslation } from "react-i18next";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { NAV_ITEMS } from "@/components/layout/navItems";
import type { Route } from "@/router/useHashRoute";
import type { Canvas } from "@/router/useHashRoute";

interface BottomNavProps {
  route: Route;
  navigate: (r: Route) => void;
  canvas: Canvas;
}

/**
 * Floating glass bottom navigation shown only on mobile.
 * Thumb-friendly targets, spring-animated active state.
 * The Netflix skin uses NetflixBottomNav instead.
 */
export function BottomNav({ route, navigate, canvas }: BottomNavProps) {
  const { t } = useTranslation();
  const { count } = useWatchlist();
  const isLight = canvas === "cream";

  return (
    <nav
      aria-label="Primary navigation"
      className={`fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 flex items-center justify-around rounded-pill px-4 py-2.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.85)] md:hidden ${
        isLight
          ? "border border-hairline-light bg-canvas-light"
          : "border border-white/[0.08] bg-canvas-night"
      }`}
    >
      {NAV_ITEMS.map((tab) => {
        const active = route === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            aria-label={t(tab.labelKey)}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-12 w-12 min-w-12 items-center justify-center rounded-pill transition-all duration-ui ease-spring active:scale-90 active:duration-press ${
              active
                ? "bg-accent text-accent-on"
                : isLight
                  ? "text-shade-60 hover:text-ink"
                  : "text-shade-40 hover:text-on-primary"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
            {tab.id === "watchlist" && count > 0 && (
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill px-1 text-[9px] font-medium ${
                  active
                    ? "bg-canvas-night/20 text-accent-on"
                    : "bg-aloe text-accent-soft-on"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
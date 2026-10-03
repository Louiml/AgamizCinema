import { useTranslation } from "react-i18next";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { NAV_ITEMS } from "@/components/layout/navItems";
import type { Route } from "@/router/useHashRoute";

interface NetflixBottomNavProps {
  route: Route;
  navigate: (r: Route) => void;
}

/**
 * Mobile navigation for the Netflix skin.
 *
 * The classic design uses a floating pill; this is a full-bleed square bar
 * pinned to the bottom edge, which is closer to how the real service's mobile
 * web app presents its primary destinations. Active tab is marked with red
 * rather than a filled pill.
 */
export function NetflixBottomNav({ route, navigate }: NetflixBottomNavProps) {
  const { t } = useTranslation();
  const { count } = useWatchlist();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-canvas-night/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = route === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-label={t(item.labelKey)}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-14 flex-col items-center justify-center gap-1 transition-colors duration-ui ${
                active ? "text-on-primary" : "text-on-primary/55"
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
                {item.id === "watchlist" && count > 0 && (
                  <span className="absolute -end-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-[2px] bg-accent px-1 text-[9px] font-bold text-on-accent">
                    {count}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none">
                {t(item.labelKey)}
              </span>
              {active && (
                <span className="absolute inset-x-4 top-0 h-[2px] bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
import { useTranslation } from "react-i18next";
import { Home, Compass, Bookmark, Settings } from "lucide-react";
import { useWatchlist } from "@/providers/WatchlistProvider";
import type { Route } from "@/router/useHashRoute";

interface BottomNavProps {
  route: Route;
  navigate: (r: Route) => void;
}

const TABS: Array<{ id: Route; labelKey: string; icon: typeof Home }> = [
  { id: "home", labelKey: "nav.home", icon: Home },
  { id: "discover", labelKey: "nav.discover", icon: Compass },
  { id: "watchlist", labelKey: "nav.watchlist", icon: Bookmark },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];

/**
 * Floating glass bottom navigation shown only on mobile.
 * Thumb-friendly targets, spring-animated active state.
 */
export function BottomNav({ route, navigate }: BottomNavProps) {
  const { t } = useTranslation();
  const { count } = useWatchlist();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 flex items-center justify-around rounded-full border border-white/[0.08] bg-ink-deep/80 px-4 py-2.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl backdrop-saturate-150 md:hidden"
    >
      {TABS.map((tab) => {
        const active = route === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            aria-label={t(tab.labelKey)}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-12 w-12 min-w-12 items-center justify-center rounded-full transition-all duration-ui ease-spring active:scale-90 active:duration-press ${
              active
                ? "bg-mint-500 text-ink shadow-[0_0_20px_-4px_rgba(16,185,129,0.5)]"
                : "text-ash hover:text-paper"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
            {tab.id === "watchlist" && count > 0 && (
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                  active ? "bg-ink text-mint-300" : "bg-mint-500 text-ink"
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

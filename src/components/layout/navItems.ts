import { Home, Compass, Bookmark, Settings } from "lucide-react";
import type { Route } from "@/router/useHashRoute";

export interface NavItem {
  id: Route;
  labelKey: string;
  icon: typeof Home;
}

/**
 * Single source of truth for the app's primary destinations.
 *
 * Both designs render from this list so adding a route can never leave the
 * desktop nav, the mobile bottom nav and the Netflix top bar out of sync.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "home", labelKey: "nav.home", icon: Home },
  { id: "discover", labelKey: "nav.discover", icon: Compass },
  { id: "watchlist", labelKey: "nav.watchlist", icon: Bookmark },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];
import { useCallback, useEffect, useState } from "react";

export type Route = "home" | "discover" | "watchlist" | "settings";

interface ParsedHash {
  route: Route;
  /** Room id carried by a `#/watch?room=…` invite link, if present. */
  roomParam: string | null;
}

const KNOWN_ROUTES: Route[] = ["home", "discover", "watchlist", "settings"];

function parseHash(): ParsedHash {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  const [path, query] = raw.split("?");
  const route = KNOWN_ROUTES.includes(path as Route) ? (path as Route) : "home";

  let roomParam: string | null = null;
  if (path === "watch" && query) {
    const match = query.match(/(?:^|&)room=([^&]+)/);
    if (match) {
      try {
        roomParam = decodeURIComponent(match[1]);
      } catch {
        roomParam = match[1];
      }
    }
  }
  return { route, roomParam };
}

/** Reads the watch-together room id from the current URL, if any. */
function readRoomParam(): string | null {
  return parseHash().roomParam;
}

/**
 * Minimal hash-based router. Supports browser back/forward, deep links and
 * works identically in the plain web build and inside the Tauri shell.
 *
 * `#/watch?room=…` invite links map to the home route; the room id is
 * captured once on load (see `roomParam`) so the watch-together panel can
 * auto-join when the player opens.
 */
export function useHashRoute(): { route: Route; navigate: (r: Route) => void } {
  const [route, setRoute] = useState<Route>(() => parseHash().route);

  useEffect(() => {
    const onHash = () => setRoute(parseHash().route);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((r: Route) => {
    if (parseHash().route === r) return;
    window.location.hash = `/${r}`;
  }, []);

  return { route, navigate };
}

export { readRoomParam };

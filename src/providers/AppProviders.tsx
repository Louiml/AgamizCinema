import type { ReactNode } from "react";
import { ContextMenuProvider } from "./ContextMenuProvider";
import { WatchlistProvider } from "./WatchlistProvider";
import { HistoryProvider } from "./HistoryProvider";
import { SettingsProvider } from "./SettingsProvider";
import { PlayerProvider } from "./TMDBProvider";
import { DetailsProvider } from "./DetailsProvider";
import { MangaLibraryProvider } from "./MangaLibraryProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ContextMenuProvider>
      <SettingsProvider>
        <WatchlistProvider>
          <HistoryProvider>
            <MangaLibraryProvider>
              <PlayerProvider>
                <DetailsProvider>{children}</DetailsProvider>
              </PlayerProvider>
            </MangaLibraryProvider>
          </HistoryProvider>
        </WatchlistProvider>
      </SettingsProvider>
    </ContextMenuProvider>
  );
}

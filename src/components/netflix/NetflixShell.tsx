import { Suspense } from "react";
import { useHashRoute } from "@/router/useHashRoute";
import { VideoPlayerModal } from "@/components/player/VideoPlayerModal";
import { MediaDetailsModal } from "@/components/media/MediaDetailsModal";
import { InstallBanner } from "@/components/ui/InstallBanner";
import { ToastViewport } from "@/components/ui/ToastViewport";
import { UpdateChecker } from "@/components/ui/UpdateChecker";
import { PageLoader } from "@/components/ui/Spinner";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { WatchlistPage } from "@/pages/WatchlistPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NetflixTitleBar } from "./NetflixTitleBar";
import { NetflixMobileHeader } from "./NetflixMobileHeader";
import { NetflixBottomNav } from "./NetflixBottomNav";
import { NetflixFooter } from "./NetflixFooter";
import { NetflixHome } from "./NetflixHome";
import { ExpansionProvider } from "./ExpansionProvider";

/**
 * Application shell for the Netflix design ("New Design (Beta)").
 *
 * Loaded lazily by App.tsx only when the user selects it, so classic users
 * never download any of this.
 *
 * Only the browsing chrome is purpose-built here. Discover, Watchlist, Settings,
 * the player, the details modal, toasts and the rest are the existing
 * components — `netflix.css` re-skins them in place, which keeps the two
 * designs from forking the entire app.
 *
 * ExpansionProvider wraps everything so a poster can only be expanded once, app
 * wide, no matter how many rails the cursor sweeps across.
 */
export function NetflixShell() {
  const { route, navigate } = useHashRoute();

  return (
    <ExpansionProvider>
      <div className="flex min-h-screen flex-col bg-canvas-night">
        <NetflixTitleBar route={route} navigate={navigate} />
        <NetflixMobileHeader navigate={navigate} />

        <main className="flex-1 px-4 pb-24 sm:px-8 md:pb-10 lg:px-16">
          {/* The hero is full-bleed, so the page padding is neutralised by the
              hero's own negative margins. */}
          <div key={route} className="animate-fade-in">
            <Suspense fallback={<PageLoader />}>
              {route === "home" && <NetflixHome />}
              {route !== "home" && (
                <div className="pt-6">
                  {route === "discover" && <DiscoverPage />}
                  {route === "watchlist" && <WatchlistPage navigate={navigate} />}
                  {route === "settings" && <SettingsPage />}
                </div>
              )}
            </Suspense>
          </div>
        </main>

        <NetflixFooter />

        {/* Global overlays — shared with the classic design. */}
        <VideoPlayerModal />
        <MediaDetailsModal />
        <InstallBanner />
        <ToastViewport />
        <UpdateChecker />
        <NetflixBottomNav route={route} navigate={navigate} />
      </div>
    </ExpansionProvider>
  );
}
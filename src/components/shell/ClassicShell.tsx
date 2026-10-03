import { lazy, Suspense } from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { VideoPlayerModal } from "@/components/player/VideoPlayerModal";
import { MediaDetailsModal } from "@/components/media/MediaDetailsModal";
import { InstallBanner } from "@/components/ui/InstallBanner";
import { ExternalLinks } from "@/components/ui/ExternalLinks";
import { LegalDisclaimer } from "@/components/ui/LegalDisclaimer";
import { ToastViewport } from "@/components/ui/ToastViewport";
import { UpdateChecker } from "@/components/ui/UpdateChecker";
import type { Canvas } from "@/router/useHashRoute";
import type { Route } from "@/router/useHashRoute";

const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const DiscoverPage = lazy(() =>
  import("@/pages/DiscoverPage").then((m) => ({ default: m.DiscoverPage })),
);
const WatchlistPage = lazy(() =>
  import("@/pages/WatchlistPage").then((m) => ({ default: m.WatchlistPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

interface ClassicShellProps {
  route: Route;
  navigate: (r: Route) => void;
  /** Active light/dark canvas, resolved by the caller. */
  canvas: Canvas;
}

/**
 * Application shell for the original design ("Old Design").
 *
 * This is the pre-redesign markup, moved out of App.tsx unchanged so the two
 * designs sit side by side and App.tsx only has to pick between them.
 */
export function ClassicShell({ route, navigate, canvas }: ClassicShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TitleBar route={route} navigate={navigate} canvas={canvas} />
      <MobileHeader navigate={navigate} canvas={canvas} />

      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-8 pb-32 sm:px-6 lg:px-8 md:pb-10">
        <div key={route} className="animate-fade-in">
          <Suspense fallback={null}>
            {route === "home" && <HomePage />}
            {route === "discover" && <DiscoverPage />}
            {route === "watchlist" && <WatchlistPage navigate={navigate} />}
            {route === "settings" && <SettingsPage />}
          </Suspense>
        </div>
      </main>

      <footer
        className={`py-8 pb-28 text-center text-xs md:pb-8 ${
          canvas === "cream"
            ? "border-t border-hairline-light text-shade-50"
            : "border-t border-white/[0.05] text-shade-50"
        }`}
      >
        <div className="mb-4 flex justify-center gap-2">
          <ExternalLinks />
          <LegalDisclaimer />
        </div>
        <p>
          Agamiz Cinema made by Louiml using React.js(Web) &amp; Tauri(Desktop).
        </p>
      </footer>

      <VideoPlayerModal />
      <MediaDetailsModal />
      <InstallBanner />
      <ToastViewport />
      <UpdateChecker />
      <BottomNav route={route} navigate={navigate} canvas={canvas} />
    </div>
  );
}
import { lazy, Suspense, useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { AppProviders } from "@/providers/AppProviders";
import { useSettings } from "@/providers/SettingsProvider";
import { useHashRoute, readRoomParam } from "@/router/useHashRoute";
import { useDetails } from "@/providers/DetailsProvider";
import { setPendingRoom } from "@/lib/watchTogether";
import { TitleBar } from "@/components/layout/TitleBar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { VideoPlayerModal } from "@/components/player/VideoPlayerModal";
import { MediaDetailsModal } from "@/components/media/MediaDetailsModal";
import { InstallBanner } from "@/components/ui/InstallBanner";
import { ExternalLinks } from "@/components/ui/ExternalLinks";
import { LegalDisclaimer } from "@/components/ui/LegalDisclaimer";
import { ToastViewport } from "@/components/ui/ToastViewport";

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const DiscoverPage = lazy(() => import("@/pages/DiscoverPage").then((m) => ({ default: m.DiscoverPage })));
const WatchlistPage = lazy(() => import("@/pages/WatchlistPage").then((m) => ({ default: m.WatchlistPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

function RouteSeo() {
  const { route } = useHashRoute();
  const { media } = useDetails();

  if (media) {
    const label = media.mediaType === "tv" ? "TV Series" : "Movie";
    const ogImage = media.backdropPath ?? media.posterPath ?? "";
    return (
      <Helmet>
        <title>{media.title} ({label}) · Agamiz Cinema</title>
        <meta name="description" content={`Watch ${media.title} — a ${label.toLowerCase()} on Agamiz Cinema.`} />
        <meta property="og:title" content={`${media.title} (${label}) · Agamiz Cinema`} />
        <meta property="og:description" content={`Watch ${media.title} — a ${label.toLowerCase()} on Agamiz Cinema.`} />
        <meta property="og:type" content={media.mediaType === "tv" ? "tv_show" : "video.movie"} />
        <meta property="og:url" content={`https://cinema.agamiz.com/#/home?media=${media.id}&type=${media.mediaType}`} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://cinema.agamiz.com/" />
      </Helmet>
    );
  }

  switch (route) {
    case "home":
      return (
        <Helmet>
          <title>Agamiz Cinema — Watch Movies & TV Shows Online</title>
          <meta name="description" content="Discover trending movies, popular TV series, and watch them instantly on Agamiz Cinema. A cinematic streaming experience — no sign-up required." />
          <meta property="og:title" content="Agamiz Cinema — Watch Movies & TV Shows Online" />
          <meta property="og:description" content="Discover trending movies, popular TV series, and watch them instantly on Agamiz Cinema. No sign-up required." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://cinema.agamiz.com/" />
          <meta name="twitter:card" content="summary_large_image" />
          <link rel="canonical" href="https://cinema.agamiz.com/" />
        </Helmet>
      );
    case "discover":
      return (
        <Helmet>
          <title>Discover Movies & TV Series · Agamiz Cinema</title>
          <meta name="description" content="Browse and filter thousands of movies and TV series by genre, popularity, rating, and release date on Agamiz Cinema." />
          <meta property="og:title" content="Discover Movies & TV Series · Agamiz Cinema" />
          <meta property="og:description" content="Browse and filter thousands of movies and TV series by genre, popularity, rating, and release date on Agamiz Cinema." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://cinema.agamiz.com/#/discover" />
          <meta name="twitter:card" content="summary_large_image" />
          <link rel="canonical" href="https://cinema.agamiz.com/#/discover" />
        </Helmet>
      );
    default:
      return (
        <Helmet>
          <title>Agamiz Cinema</title>
          <link rel="canonical" href="https://cinema.agamiz.com/" />
        </Helmet>
      );
  }
}

function PageRouter() {
  const { route, navigate } = useHashRoute();
  const { settings } = useSettings();

  useEffect(() => {
    const room = readRoomParam();
    if (room) {
      setPendingRoom(room);
      history.replaceState(null, "", `${location.pathname}#/home`);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.glass = settings.glassOpacity;
  }, [settings.glassOpacity]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  // Global Light/Dark mode — drives the whole app's canvas (not per-route).
  const canvas = settings.themeMode === "light" ? "cream" : "night";
  useEffect(() => {
    document.documentElement.dataset.canvas = canvas;
  }, [canvas]);

  return (
    <div className="flex min-h-screen flex-col">
      <RouteSeo />

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
      <BottomNav route={route} navigate={navigate} canvas={canvas} />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AppProviders>
        <PageRouter />
      </AppProviders>
    </HelmetProvider>
  );
}

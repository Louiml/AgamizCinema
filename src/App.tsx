import { lazy, Suspense, useEffect } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { AppProviders } from "@/providers/AppProviders";
import { useDesign, useSettings } from "@/providers/SettingsProvider";
import { useHashRoute, readRoomParam } from "@/router/useHashRoute";
import { useDetails } from "@/providers/DetailsProvider";
import { setPendingRoom } from "@/lib/watchTogether";
import { ClassicShell } from "@/components/shell/ClassicShell";

// Lazy: the entire Netflix skin is a separate chunk that classic users never
// download. index.css still carries the shared primitives for both designs.
const NetflixShell = lazy(() =>
  import("@/components/netflix/NetflixShell").then((m) => ({
    default: m.NetflixShell,
  })),
);

function RouteSeo() {
  const { route } = useHashRoute();
  const { media } = useDetails();

  if (media) {
    const label = media.mediaType === "tv" ? "TV Series" : "Movie";
    const ogImage = media.backdropPath ?? media.posterPath ?? "";
    return (
      <Helmet>
        <title>{media.title} ({label}) · Agamiz Cinema</title>
        <meta
          name="description"
          content={`Watch ${media.title} - a ${label.toLowerCase()} on Agamiz Cinema.`}
        />
        <meta property="og:title" content={`${media.title} (${label}) · Agamiz Cinema`} />
        <meta
          property="og:description"
          content={`Watch ${media.title} - a ${label.toLowerCase()} on Agamiz Cinema.`}
        />
        <meta
          property="og:type"
          content={media.mediaType === "tv" ? "tv_show" : "video.movie"}
        />
        <meta
          property="og:url"
          content={`https://cinema.agamiz.com/#/home?media=${media.id}&type=${media.mediaType}`}
        />
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
          <title>Agamiz Cinema</title>
          <meta
            name="description"
            content="Discover trending movies, popular TV series, and watch them instantly on Agamiz Cinema. A cinematic streaming experience — no sign-up required."
          />
          <meta property="og:title" content="Agamiz Cinema - Watch Movies & TV Shows Online" />
          <meta
            property="og:description"
            content="Discover trending movies, popular TV series, and watch them instantly on Agamiz Cinema. No sign-up required."
          />
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
          <meta
            name="description"
            content="Browse and filter thousands of movies and TV series by genre, popularity, rating, and release date on Agamiz Cinema."
          />
          <meta property="og:title" content="Discover Movies & TV Series · Agamiz Cinema" />
          <meta
            property="og:description"
            content="Browse and filter thousands of movies and TV series by genre, popularity, rating, and release date on Agamiz Cinema."
          />
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
  const design = useDesign();

  useEffect(() => {
    const room = readRoomParam();
    if (room) {
      setPendingRoom(room);
      history.replaceState(null, "", `${location.pathname}#/home`);
    }
  }, []);

  // Selects which design skin is live. Read by netflix.css.
  useEffect(() => {
    document.documentElement.dataset.design = design;
  }, [design]);

  // Glass is meaningless in the Netflix skin — flat surfaces only.
  useEffect(() => {
    document.documentElement.dataset.glass =
      design === "netflix" ? "off" : settings.glassOpacity;
  }, [design, settings.glassOpacity]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  // Global Light/Dark mode - drives the whole app's canvas (not per-route).
  // The Netflix design is dark-only, so it pins the canvas to night and keeps
  // the user's saved themeMode untouched for when they switch back.
  const canvas = design === "netflix" || settings.themeMode === "dark" ? "night" : "cream";
  useEffect(() => {
    document.documentElement.dataset.canvas = canvas;
  }, [canvas]);

  return (
    <>
      <RouteSeo />
      {design === "netflix" ? (
        <Suspense fallback={null}>
          <NetflixShell />
        </Suspense>
      ) : (
        <ClassicShell route={route} navigate={navigate} canvas={canvas} />
      )}
    </>
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
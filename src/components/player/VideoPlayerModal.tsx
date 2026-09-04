import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  MonitorPlay,
  Loader2,
  ListVideo,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Film,
  Copy,
  Users,
  PictureInPicture2,
  Wand2,
  SkipForward,
  Scissors,
} from "lucide-react";
import { usePlayer } from "@/providers/TMDBProvider";
import { useHistory } from "@/providers/HistoryProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { tmdb, backdropUrl } from "@/services/tmdb";
import type { Episode, TMDBDetails } from "@/types/tmdb";
import { embedUrl, sourceList, sourceOf } from "@/services/vidsync";
import type { VideoSource } from "@/types/app";
import type { PlayerController } from "@/lib/watchTogether";
import { loadSkipSegments, upsertCustomSkip, type SkipSegment } from "@/services/skip";
import { useGlobalMediaControls } from "@/hooks/useGlobalMediaControls";
import { useCleanView } from "@/hooks/useCleanView";
import { useAutoSkip } from "@/hooks/useAutoSkip";
import { SkipIntroToast } from "@/components/player/SkipIntroToast";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { TrailerModal } from "@/components/player/TrailerModal";
import { WatchTogetherPanel } from "@/components/player/WatchTogetherPanel";
import { ContextMenuTrigger } from "@/components/ui/ContextMenuTrigger";
import { toast } from "@/lib/toast";
import {
  downloadSupported,
  onDownloadError,
  onDownloadFinished,
  openDownloadWindow,
} from "@/services/download";
import { setDiscordPresence } from "@/services/discord";

const PROGRESS_TICK_MS = 15_000;
const PROGRESS_PER_TICK = 3.5;

/**
 * Best-effort player controller for a cross-origin embed, bridged over
 * postMessage using the same `{ __watch: true, type }` protocol the Watch
 * Together panel speaks. The embed won't reveal its clock, so `getSnapshot`
 * returns neutral values (auto-skip stays idle for embeds).
 */
function iframeController(iframeRef: RefObject<HTMLIFrameElement | null>): PlayerController {
  const post = (message: Record<string, unknown>) => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ __watch: true, ...message }, "*");
    } catch {
      /* cross-origin safety — ignore */
    }
  };
  return {
    play: () => post({ type: "PLAY" }),
    pause: () => post({ type: "PAUSE" }),
    seekTo: (seconds) => post({ type: "SEEK", time: seconds }),
    getSnapshot: () => ({ playing: false, currentTime: 0, duration: 0 }),
  };
}

export function VideoPlayerModal() {
  const { t, i18n } = useTranslation();
  const { state, close } = usePlayer();
  const { record } = useHistory();
  const { settings, update } = useSettings();

  const [details, setDetails] = useState<TMDBDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [skipSegments, setSkipSegments] = useState<SkipSegment[]>([]);

  const progressRef = useRef(2);
  const timerRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const introStartRef = useRef(0);

  const isTV = state?.mediaType === "tv";

  const watchMediaKey = state
    ? state.mediaType === "tv"
      ? `tv:${state.tmdbId}:${season}:${episode}`
      : `movie:${state.tmdbId}`
    : undefined;

  const embed = useMemo(() => {
    if (!state) return "";
    return embedUrl(
      settings.defaultSource,
      state.mediaType,
      state.tmdbId,
      season,
      episode,
    );
  }, [state, settings.defaultSource, season, episode]);

  useEffect(() => {
    if (!state) return;
    setDetails(null);
    setEpisodes([]);
    setError(null);
    setIframeLoading(true);
    setDownloadStatus(null);
    progressRef.current = 2;

    if (state.mediaType === "tv") {
      setSeason(state.season ?? 1);
      setEpisode(state.episode ?? 1);
    }
  }, [state?.tmdbId, state?.mediaType, state?.season, state?.episode]);

  useEffect(() => {
    if (!state) return;
    let cancelled = false;
    tmdb
      .details(state.mediaType, state.tmdbId)
      .then((d) => {
        if (!cancelled) setDetails(d);
      })
      .catch(() => {
        if (!cancelled) console.warn(`[player] could not load details for ${state.tmdbId}`);
      });
    return () => {
      cancelled = true;
    };
  }, [state?.tmdbId, state?.mediaType, t]);

  useEffect(() => {
    if (!state || state.mediaType !== "tv" || !season) return;
    let cancelled = false;
    setEpisodesLoading(true);
    tmdb
      .episodes(state.tmdbId, season)
      .then((eps) => {
        if (!cancelled) {
          const list = Array.isArray(eps) ? eps : [];
          setEpisodes(list);
          if (!episodes.length) setEpisode(list[0]?.episode_number ?? 1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEpisodes([]);
          setEpisode(1);
        }
      })
      .finally(() => {
        if (!cancelled) setEpisodesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state?.tmdbId, season, t]);

  useEffect(() => {
    if (!watchMediaKey) {
      setSkipSegments([]);
      return;
    }
    let cancelled = false;
    loadSkipSegments({ mediaKey: watchMediaKey })
      .then((segs) => {
        if (!cancelled) setSkipSegments(segs);
      })
      .catch(() => {
        if (!cancelled) setSkipSegments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [watchMediaKey]);

  useEffect(() => {
    if (!state) return;
    const mediaType = state.mediaType;
    const base = {
      id: state.tmdbId,
      mediaType,
      title: state.title,
      posterPath: state.posterPath ?? null,
      backdropPath: state.backdropPath ?? null,
      voteAverage: state.voteAverage ?? 0,
      releaseDate: undefined,
    };

    record({ ...base, progress: progressRef.current });

    timerRef.current = window.setInterval(() => {
      progressRef.current = Math.min(97, progressRef.current + PROGRESS_PER_TICK);
      record({
        ...base,
        season: mediaType === "tv" ? season : undefined,
        episode: mediaType === "tv" ? episode : undefined,
        progress: progressRef.current,
      });
    }, PROGRESS_TICK_MS);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [state?.tmdbId, season, episode]);

  useEffect(() => {
    if (!settings.discordRpc || !state) {
      setDiscordPresence(null);
      return;
    }
    setDiscordPresence({
      title: state.title,
      mediaType: state.mediaType,
      season: state.mediaType === "tv" ? season : undefined,
      episode: state.mediaType === "tv" ? episode : undefined,
    });
  }, [settings.discordRpc, state, season, episode]);

  useEffect(() => {
    if (!state) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state]);

  useEffect(() => {
    if (!downloadSupported()) return;
    let unlisteners: Array<() => void> = [];
    onDownloadFinished(({ success, path }) => {
      setDownloadStatus(
        success
          ? t("player.downloadFinished", {
              path: path ?? t("player.downloadsFolder"),
            })
          : t("player.downloadFailed"),
      );
    }).then((un) => unlisteners.push(un));
    onDownloadError(({ error }) => {
      setDownloadStatus(t("player.downloadError", { error }));
    }).then((un) => unlisteners.push(un));
    return () => {
      unlisteners.forEach((un) => un());
    };
  }, [t]);

  const handleDownload = async () => {
    if (!state || downloading) return;
    setDownloading(true);
    setDownloadStatus(t("player.openingDownload"));
    try {
      await openDownloadWindow({
        tmdbId: state.tmdbId,
        mediaType: state.mediaType,
        title: state.title,
        season: isTV ? season : undefined,
        episode: isTV ? episode : undefined,
      });
      setDownloadStatus(t("player.downloadWindowOpened"));
    } catch (err) {
      console.warn("[player] could not open download window.", err);
      setDownloadStatus(t("player.couldntOpenDownload"));
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyPlayerLink = async () => {
    if (!embed) return;
    try {
      await navigator.clipboard.writeText(embed);
      toast({ message: t("player.linkCopiedToast"), tone: "success" });
    } catch {
      toast({ message: t("player.couldntOpenDownload"), tone: "error" });
    }
  };

  const handlePictureInPicture = async () => {
    const pipApi = (window as Window & { documentPictureInPicture?: { requestWindow: () => Promise<Window> } })
      .documentPictureInPicture;
    if (pipApi) {
      try {
        await pipApi.requestWindow();
        toast({ message: t("player.pipOpened"), tone: "success" });
      } catch {
        toast({ message: t("player.pipFailed"), tone: "error" });
      }
      return;
    }
    toast({ message: t("player.pipFailed"), tone: "error" });
  };

  const { activeSegment, skipNow } = useAutoSkip({
    enabled: settings.autoSkip,
    segments: skipSegments,
    getPlayer: () => iframeController(iframeRef),
  });

  const skipActionLabel = (seg: SkipSegment): string => {
    const kind =
      seg.kind === "intro"
        ? t("skip.kindIntro")
        : seg.kind === "recap"
          ? t("skip.kindRecap")
          : t("skip.kindOutro");
    return t("skip.action", { kind });
  };

  const handleMarkIntro = (edge: "start" | "end") => {
    if (!state || !watchMediaKey) return;
    const time = iframeController(iframeRef).getSnapshot().currentTime;
    if (edge === "start") {
      introStartRef.current = time;
      toast({ message: t("skip.markedStart"), tone: "success" });
      return;
    }
    const start = introStartRef.current;
    if (time <= start) {
      toast({ message: t("skip.markStartFirst"), tone: "error" });
      return;
    }
    upsertCustomSkip(
      watchMediaKey,
      state.mediaType === "tv" ? episode : undefined,
      { start, end: time, kind: "intro", source: "custom" },
    );
    toast({ message: t("skip.saved"), tone: "success" });
    loadSkipSegments({ mediaKey: watchMediaKey })
      .then(setSkipSegments)
      .catch(() => undefined);
  };

  const playerMenuItems = [
    { key: "copy", label: t("player.copyLink"), icon: Copy, onClick: handleCopyPlayerLink },
    { key: "sync", label: t("player.syncPlayback"), icon: Users, onClick: () => setWatchOpen(true) },
    { key: "pip", label: t("player.pictureInPicture"), icon: PictureInPicture2, onClick: handlePictureInPicture },
    ...(activeSegment
      ? [{ key: "skipNow", label: skipActionLabel(activeSegment), icon: SkipForward, onClick: skipNow }]
      : []),
    { key: "markStart", label: t("skip.markStart"), icon: Scissors, onClick: () => handleMarkIntro("start") },
    { key: "markEnd", label: t("skip.markEnd"), icon: Scissors, onClick: () => handleMarkIntro("end") },
  ];

  const seasonNumbers = useMemo(
    () =>
      (details?.seasons ?? [])
        .filter((s) => s.season_number > 0)
        .map((s) => s.season_number),
    [details],
  );

  const maxEpisode = useMemo(() => {
    if (!episodes.length) return 0;
    return Math.max(...episodes.map((ep) => ep.episode_number));
  }, [episodes]);

  const seasonIndex = seasonNumbers.indexOf(season);

  const hasPrevEpisode =
    episode > 1 || (seasonIndex > 0 && seasonNumbers[seasonIndex - 1] !== undefined);
  const hasNextEpisode =
    episode < maxEpisode ||
    (seasonIndex >= 0 && seasonIndex < seasonNumbers.length - 1);

  const goPrev = () => {
    if (episode > 1) {
      setEpisode(episode - 1);
      return;
    }
    const prevSeason = seasonNumbers[seasonIndex - 1];
    if (prevSeason !== undefined) {
      setSeason(prevSeason);
      setEpisode(1);
    }
  };

  const goNext = () => {
    if (episode < maxEpisode) {
      setEpisode(episode + 1);
      return;
    }
    const nextSeason = seasonNumbers[seasonIndex + 1];
    if (nextSeason !== undefined) {
      setSeason(nextSeason);
      setEpisode(1);
    }
  };

  useGlobalMediaControls({
    getPlayer: () => iframeController(iframeRef),
    onNext: goNext,
    onPrevious: goPrev,
  });

  useCleanView(settings.cleanView, iframeRef);

  useEffect(() => {
    setIframeLoading(true);
  }, [embed]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  if (!state) return null;

  const handleClose = () => {
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/85 p-0 backdrop-blur-md animate-fade-in md:px-3 md:py-4">
      <AmbientGlow
        imageUrl={
          details?.backdrop_path
            ? backdropUrl(details.backdrop_path)
            : null
        }
      />
      <div
        className="relative flex h-full w-full max-w-6xl flex-col animate-scale-in"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="glass-mint flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <MonitorPlay className="h-5 w-5 text-mint-300" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-paper">{state.title}</p>
              <p className="text-xs text-ash">
                {isTV
                  ? t("player.seasonEpisode", { season, episode })
                  : t("common.movie")}{" "}
                • {t("player.playingOn", { source: sourceOf(settings.defaultSource).name })}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => update({ cleanView: !settings.cleanView })}
              title={t("player.cleanViewTitle")}
              aria-pressed={settings.cleanView}
              className={`btn-glass text-sm ${
                settings.cleanView ? "text-mint-300 ring-1 ring-mint-400/40" : ""
              }`}
            >
              <Wand2 className="h-4 w-4" /> {t("player.cleanView")}
            </button>
            <button
              onClick={() => setTrailerOpen(true)}
              title={t("player.watchTrailer")}
              className="btn-glass text-sm"
            >
              <Film className="h-4 w-4" /> {t("player.trailer")}
            </button>
            <button
              onClick={() => setWatchOpen((o) => !o)}
              title={t("player.watchTogetherTitle")}
              aria-pressed={watchOpen}
              className={`btn-glass text-sm ${
                watchOpen ? "text-mint-300 ring-1 ring-mint-400/40" : ""
              }`}
            >
              <Users className="h-4 w-4" /> {t("player.watchTogether")}
            </button>
            <button
              onClick={() => {
                const names = sourceList().map((s) => s.name) as VideoSource[];
                const idx = names.indexOf(settings.defaultSource);
                const next = names[(idx + 1) % names.length] ?? names[0];
                update({ defaultSource: next });
              }}
              title={t("player.switchSourceTitle")}
              className="btn-glass text-sm"
            >
              <RefreshCw className="h-4 w-4" /> {t("player.switchSource")}
            </button>
            {downloadSupported() && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                title={
                  isTV
                    ? t("player.downloadTvTitle", { season, episode })
                    : t("player.downloadMovieTitle")
                }
                className="btn-glass text-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                <Download className="h-4 w-4" />
                {downloading ? "…" : t("player.download")}
              </button>
            )}
            <button onClick={handleClose} aria-label={t("common.close")} className="btn-icon">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* TV controls */}
        {isTV && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ash">
              <ListVideo className="h-4 w-4 text-mint-400" />
              {t("player.season")}
              <GlassSelect
                value={season}
                onChange={(v) => {
                  setSeason(v);
                  setEpisode(1);
                }}
                options={(seasonNumbers.length ? seasonNumbers : [1]).map((s) => ({
                  value: s,
                  label: t("player.seasonOption", { season: s }),
                }))}
                compact
                ariaLabel={t("player.selectSeason")}
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-ash">
              {t("player.episode")}
              <GlassSelect
                value={episode}
                onChange={setEpisode}
                disabled={episodesLoading}
                placeholder={t("player.loadingEpisode")}
                options={episodes.map((ep) => ({
                  value: ep.episode_number,
                  label: ep.name
                    ? `E${ep.episode_number} · ${ep.name}`
                    : t("player.episodeOption", { episode: ep.episode_number }),
                }))}
                compact
                ariaLabel={t("player.selectEpisode")}
              />
            </label>

            <div className="ms-auto flex items-center gap-1.5">
              <button
                onClick={goPrev}
                disabled={!hasPrevEpisode}
                aria-label={t("player.prevEpisode")}
                title={t("player.prevEpisode")}
                className="btn-icon h-9 w-9 disabled:opacity-30 disabled:pointer-events-none"
              >
                {i18n.dir() === "rtl" ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={goNext}
                disabled={!hasNextEpisode}
                aria-label={t("player.nextEpisode")}
                title={t("player.nextEpisode")}
                className="btn-icon h-9 w-9 disabled:opacity-30 disabled:pointer-events-none"
              >
                {i18n.dir() === "rtl" ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* 16:9 glass player */}
        <ContextMenuTrigger items={playerMenuItems}>
          <div className="glass-panel relative w-full flex-1 overflow-hidden rounded-none p-2 md:rounded-3xl">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-ink-deep">
              {error ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="text-sm text-rose-300">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setRetryNonce((n) => n + 1);
                    }}
                    className="btn-glass"
                  >
                    <RefreshCw className="h-4 w-4" /> {t("player.retry")}
                  </button>
                </div>
              ) : (
                <>
                  <iframe
                    ref={iframeRef}
                    key={`${embed}-${retryNonce}`}
                    src={embed}
                    title={t("player.playTitle", { title: state.title })}
                    className={`h-full w-full border-0 transition-all duration-500 ${
                      iframeLoading ? "blur-sm opacity-40" : "blur-0 opacity-100"
                    }`}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    onLoad={() => setIframeLoading(false)}
                  />
                  {iframeLoading && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin-slow text-mint-400" />
                      <p className="text-sm text-ash">{t("player.contacting")}</p>
                    </div>
                  )}
                  {}
                  {activeSegment && !settings.autoSkip && (
                    <SkipIntroToast segment={activeSegment} onSkip={skipNow} />
                  )}
                </>
              )}
            </div>
          </div>
        </ContextMenuTrigger>

        {/* Watch Together (peer-to-peer playback sync) */}
        {watchOpen && (
          <div className="pt-3">
            <WatchTogetherPanel
              mediaKey={watchMediaKey}
              iframeRef={iframeRef}
              open
              onOpenChange={setWatchOpen}
            />
          </div>
        )}

        {/* Footer hint */}
        <p className="pt-3 text-center text-xs text-ash-dim">
          {downloadStatus ??
            t("player.sourceDelivered", {
              source: sourceOf(settings.defaultSource).name,
            })}
        </p>
      </div>

      <TrailerModal
        open={trailerOpen}
        mediaType={state.mediaType}
        tmdbId={state.tmdbId}
        title={state.title}
        onClose={() => setTrailerOpen(false)}
      />
    </div>
  );
}

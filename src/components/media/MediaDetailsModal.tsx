import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Play,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Clapperboard,
  Film,
  Calendar,
  Clock,
  Layers,
  Activity,
  Languages,
  User,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { tmdb, backdropUrl, posterUrl, type NormalizedMedia } from "@/services/tmdb";
import type { Cast, TMDBDetails } from "@/types/tmdb";
import { useDetails } from "@/providers/DetailsProvider";
import { usePlayer } from "@/providers/TMDBProvider";
import { useWatchlist } from "@/providers/WatchlistProvider";
import { toast } from "@/lib/toast";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { MediaCard } from "@/components/media/MediaCard";
import { TrailerModal } from "@/components/player/TrailerModal";
import { ActorProfileModal } from "@/components/actor/ActorProfileModal";

function MetaChip({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-ash backdrop-blur-md">
      <Icon className="h-3.5 w-3.5 text-mint-400" />
      {text}
    </span>
  );
}

export function MediaDetailsModal() {
  const { t } = useTranslation();
  const { media, close } = useDetails();
  const { open: openPlayer } = usePlayer();
  const { has, toggle } = useWatchlist();

  const [details, setDetails] = useState<TMDBDetails | null>(null);
  const [recommendations, setRecommendations] = useState<NormalizedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [activePerson, setActivePerson] = useState<Cast | null>(null);

  const isTV = media?.mediaType === "tv";
  const saved = media ? has(media.id, media.mediaType) : false;

  useEffect(() => {
    if (!media) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetails(null);
    setRecommendations([]);
    tmdb
      .details(media.mediaType, media.id)
      .then((d) => {
        if (!cancelled) setDetails(d);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("details.couldntLoad"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    tmdb
      .recommendations(media.mediaType, media.id)
      .then((list) => {
        if (!cancelled) setRecommendations(list.slice(0, 12));
      })
      .catch(() => {
        /* recommendations are optional */
      });
    return () => {
      cancelled = true;
    };
  }, [media?.id, media?.mediaType, t]);

  useEffect(() => {
    if (!media) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [media, close]);

  const meta = useMemo(() => {
    if (!media) return [];
    const chips: { icon: LucideIcon; text: string }[] = [];
    const year = media.releaseDate?.slice(0, 4);
    if (year) chips.push({ icon: Calendar, text: year });
    if (isTV) {
      if (details?.number_of_seasons)
        chips.push({
          icon: Layers,
          text: t("details.seasons", { count: details.number_of_seasons }),
        });
      if (details?.number_of_episodes)
        chips.push({
          icon: Clapperboard,
          text: t("details.episodes", { count: details.number_of_episodes }),
        });
    } else if (details?.runtime) {
      chips.push({ icon: Clock, text: t("details.runtime", { minutes: details.runtime }) });
    }
    if (details?.status) chips.push({ icon: Activity, text: details.status });
    if (details?.original_language)
      chips.push({ icon: Languages, text: details.original_language.toUpperCase() });
    return chips;
  }, [media, details, isTV, t]);

  const genres = useMemo(
    () => (details?.genres ?? []).map((g) => g.name),
    [details],
  );

  const cast = useMemo(
    () =>
      [...(details?.credits?.cast ?? [])]
        .sort((a, b) => a.order - b.order)
        .slice(0, 12),
    [details],
  );

  const glowImage = details?.poster_path
    ? posterUrl(details.poster_path, "w500")
    : media?.posterPath ?? null;

  if (!media) return null;

  const title = details?.title ?? details?.name ?? media.title;
  const heroImage = details?.backdrop_path
    ? backdropUrl(details.backdrop_path)
    : media.backdropPath;

  const handlePlay = () => {
    openPlayer({
      tmdbId: media.id,
      mediaType: media.mediaType,
      title: media.title,
    });
    close();
  };

  const handleWatchlist = () => {
    const added = toggle(media);
    toast({
      message: added ? t("toasts.addedToWatchlist") : t("toasts.removedFromWatchlist"),
      tone: "success",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-deep/75 px-4 py-6 backdrop-blur-sm animate-fade-in"
      onClick={close}
    >
      <AmbientGlow imageUrl={glowImage} />
      <div
        className="glass-panel relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl shadow-pop animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={close}
          aria-label={t("common.close")}
          className="btn-icon absolute end-3 top-3 z-10 h-9 w-9 bg-ink-deep/50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero backdrop */}
        <div className="relative h-52 shrink-0 sm:h-64">
          {heroImage ? (
            <img src={heroImage} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-float to-ink-deep">
              {isTV ? (
                <Clapperboard className="h-14 w-14 text-mint-500/40" />
              ) : (
                <Film className="h-14 w-14 text-mint-500/40" />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="absolute inset-x-5 bottom-4 flex flex-wrap items-center gap-2.5 sm:inset-x-8">
            <span className="glass-mint rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-mint-300">
              {isTV ? t("common.tvSeries") : t("common.movie")}
            </span>
            <RatingBadge rating={details?.vote_average ?? media.voteAverage} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 pt-5 sm:p-8">
          <h2 className="heading-display text-2xl text-paper sm:text-3xl">{title}</h2>
          {details?.tagline && (
            <p className="mt-1.5 text-sm italic text-ash">{details.tagline}</p>
          )}

          {meta.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {meta.map((m) => (
                <MetaChip key={m.text} icon={m.icon} text={m.text} />
              ))}
            </div>
          )}

          {genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <span key={g} className="chip cursor-default px-3 py-0.5 text-xs">
                  {g}
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <div className="mt-6 flex items-center gap-3 text-sm text-ash">
              <Loader2 className="h-5 w-5 animate-spin-slow text-mint-400" />
              {t("details.loading")}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          ) : (
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-paper/80 sm:text-base">
              {details?.overview || t("home.noSynopsis")}
            </p>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <div className="mt-7">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ash">
                {t("details.cast")}
              </h3>
              <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {cast.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => setActivePerson(person)}
                    className="group w-[88px] shrink-0 text-center transition-all duration-ui ease-spring hover:-translate-y-0.5"
                    title={t("details.viewProfile", { name: person.name })}
                  >
                    <div className="relative mx-auto h-[110px] w-[88px] overflow-hidden rounded-xl bg-white/[0.04] transition-all duration-ui group-hover:border-mint-500/40 group-hover:shadow-glow-soft">
                      {person.profile_path ? (
                        <img
                          src={posterUrl(person.profile_path, "w185") ?? undefined}
                          alt={person.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-surface ease-spring group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-ash-dim">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent opacity-0 transition-opacity duration-ui group-hover:opacity-100" />
                    </div>
                    <p className="mt-1.5 truncate text-xs font-medium text-paper group-hover:text-mint-300">
                      {person.name}
                    </p>
                    <p className="truncate text-[10px] text-ash">{person.character ?? ""}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* More Like This */}
          {recommendations.length > 0 && (
            <div className="mt-7">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-ash">
                <Sparkles className="h-4 w-4 text-mint-400" />
                {t("details.moreLikeThis")}
              </h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {recommendations.slice(0, 6).map((m, i) => (
                  <MediaCard key={`${m.mediaType}:${m.id}`} media={m} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button onClick={handlePlay} className="btn-mint px-7 py-3">
              <Play className="h-5 w-5" fill="currentColor" />
              {isTV ? t("home.playSeries") : t("home.watchNow")}
            </button>
            <button onClick={() => setTrailerOpen(true)} className="btn-glass px-6 py-3">
              <Film className="h-5 w-5" /> {t("player.trailer")}
            </button>
            <button
              onClick={handleWatchlist}
              className={`btn-glass px-6 py-3 ${
                saved ? "border-mint-500/40 bg-mint-500/15 text-mint-300" : ""
              }`}
            >
              {saved ? (
                <>
                  <BookmarkCheck className="h-5 w-5" /> {t("home.inWatchlist")}
                </>
              ) : (
                <>
                  <Bookmark className="h-5 w-5" /> {t("home.addToWatchlist")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <TrailerModal
        open={trailerOpen}
        mediaType={media.mediaType}
        tmdbId={media.id}
        title={title}
        onClose={() => setTrailerOpen(false)}
      />
      <ActorProfileModal
        person={activePerson}
        onClose={() => setActivePerson(null)}
      />
    </div>
  );
}

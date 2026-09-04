import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Film, Loader2, Clapperboard, Video } from "lucide-react";
import { tmdb, pickTrailer } from "@/services/tmdb";
import type { MediaType } from "@/types/tmdb";

interface TrailerModalProps {
  open: boolean;
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  onClose: () => void;
}

export function TrailerModal({
  open,
  mediaType,
  tmdbId,
  title,
  onClose,
}: TrailerModalProps) {
  const { t } = useTranslation();
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setVideoKey(null);
    tmdb
      .details(mediaType, tmdbId)
      .then((d) => {
        if (cancelled) return;
        const trailer = pickTrailer(d.videos);
        if (trailer) setVideoKey(trailer.key);
        else setError(t("trailer.none"));
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("trailer.couldntLoad"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mediaType, tmdbId, t]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-deep/85 px-4 py-6 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl shadow-pop animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="glass-mint flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <Film className="h-5 w-5 text-mint-300" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-paper">
                {t("trailer.watch", { title })}
              </p>
              <p className="text-xs text-ash">
                {mediaType === "tv" ? t("common.tvSeries") : t("common.movie")}{" "}
                • {t("trailer.official")}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label={t("common.close")} className="btn-icon h-9 w-9">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="relative aspect-video w-full bg-ink-deep">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin-slow text-mint-400" />
              <p className="text-sm text-ash">{t("trailer.loading")}</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <Clapperboard className="h-10 w-10 text-mint-500/40" />
              <p className="text-sm text-ash">{error}</p>
            </div>
          ) : videoKey ? (
            <iframe
              key={videoKey}
              src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
              title={t("trailer.title", { title })}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : null}
        </div>

        <p className="flex items-center justify-center gap-1.5 px-5 py-3 text-center text-xs text-ash-dim">
          <Video className="h-3.5 w-3.5" />
          {t("player.escToClose")}
        </p>
      </div>
    </div>
  );
}

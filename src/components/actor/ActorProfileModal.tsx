import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, User, Calendar, MapPin, Briefcase, Play } from "lucide-react";
import { tmdb, normalizePersonCredit, posterUrl } from "@/services/tmdb";
import type { Cast, PersonCombinedCredit, PersonDetails } from "@/types/tmdb";
import { useDetails } from "@/providers/DetailsProvider";
import { toMediaRef } from "@/lib/media";
import { formatDate } from "@/lib/media";
import { RatingBadge } from "@/components/ui/RatingBadge";

interface ActorProfileModalProps {
  person: Cast | null;
  onClose: () => void;
}

export function ActorProfileModal({ person, onClose }: ActorProfileModalProps) {
  const { t } = useTranslation();
  const { open: openDetails } = useDetails();
  const [data, setData] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!person) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    tmdb
      .person(person.id)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("actor.couldntLoad"),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [person]);

  useEffect(() => {
    if (!person) return;
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
  }, [person, onClose]);

  const filmography = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const credits: Array<PersonCombinedCredit & { role: string }> = [];

    for (const c of data.combined_credits.cast) {
      const key = `${c.media_type}:${c.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      credits.push({ ...c, role: c.character ?? t("actor.cast") });
    }
    for (const c of data.combined_credits.crew) {
      const key = `${c.media_type}:${c.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      credits.push({ ...c, role: c.job ?? t("actor.crew") });
    }

    return credits
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, 12);
  }, [data, t]);

  if (!person) return null;

  const handleSelect = (credit: PersonCombinedCredit) => {
    const title = credit.title ?? credit.name ?? t("actor.untitled");
    onClose();
    openDetails(
      toMediaRef({ ...normalizePersonCredit(credit), title }),
    );
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-ink-deep/85 px-4 py-6 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl shadow-pop animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="btn-icon absolute end-3 top-3 z-10 h-9 w-9 bg-ink-deep/50"
        >
          <X className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-10 w-10 animate-spin-slow text-mint-400" />
            <p className="text-sm text-ash">{t("actor.loading")}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <User className="h-10 w-10 text-mint-500/40" />
            <p className="max-w-sm text-sm text-ash">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-start gap-4 border-b border-white/[0.08] p-5 sm:p-6">
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.04] sm:h-36 sm:w-24">
                {data.profile_path ? (
                  <img
                    src={posterUrl(data.profile_path, "w342") ?? undefined}
                    alt={data.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-mist/40">
                    <User className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="min-w-0 pt-1">
                <h2 className="heading-display text-xl text-paper sm:text-2xl">
                  {data.name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ash">
                  {data.known_for_department && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-mint-400" />
                      {data.known_for_department}
                    </span>
                  )}
                  {data.birthday && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-mint-400" />
                      {t("actor.born", { date: formatDate(data.birthday) })}
                    </span>
                  )}
                  {data.place_of_birth && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-mint-400" />
                      {data.place_of_birth}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {data.biography ? (
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold uppercase tracking-widest text-ash">
                    {t("actor.biography")}
                  </h3>
                  <p className="text-sm leading-relaxed text-paper/80 [display:-webkit-box] [-webkit-line-clamp:6] [-webkit-box-orient:vertical] overflow-hidden">
                    {data.biography}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ash">{t("actor.noBio")}</p>
              )}

              {/* Filmography */}
              {filmography.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ash">
                    {t("actor.topFilmography")}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {filmography.map((c) => {
                      const title = c.title ?? c.name ?? t("actor.untitled");
                      const year = (
                        c.release_date ?? c.first_air_date ?? ""
                      ).slice(0, 4);
                      return (
                        <button
                          key={`${c.media_type}:${c.id}`}
                          onClick={() => handleSelect(c)}
                          className="group flex flex-col items-start overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] text-left transition-all duration-ui ease-spring hover:border-mint-500/30 hover:bg-white/[0.06]"
                        >
                          <div className="relative aspect-[2/3] w-full overflow-hidden bg-white/[0.04]">
                            {c.poster_path ? (
                              <img
                                src={posterUrl(c.poster_path, "w342") ?? undefined}
                                alt={title}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-surface ease-spring group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-ash-dim">
                                <Play className="h-6 w-6" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
                            <div className="absolute bottom-2 start-2 end-2">
                              <p className="line-clamp-2 text-xs font-semibold text-white drop-shadow">
                                {title}
                              </p>
                              <p className="mt-0.5 text-[10px] text-white/70">
                                {c.media_type === "tv"
                                  ? t("common.tvSeries")
                                  : t("common.movie")}
                                {year ? ` · ${year}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex w-full items-center justify-between gap-2 px-2.5 py-2">
                            <span className="truncate text-[11px] text-ash">{c.role}</span>
                            <RatingBadge rating={c.vote_average ?? 0} size="sm" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

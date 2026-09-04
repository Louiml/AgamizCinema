import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingBag } from "lucide-react";

type AgeGate = "idle" | "verified" | "declined";

export function AdBanner() {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === "rtl";
  const [ageGate, setAgeGate] = useState<AgeGate>("idle");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || ageGate === "declined") return null;

  const handleVisit = () => {
    window.open("https://agamiz.com", "_blank", "noopener,noreferrer");
  };

  const gated = ageGate === "idle";

  return (
    <section className="animate-fade-in-up">
      <div className="glass-card group relative overflow-hidden rounded-3xl border-white/[0.08] bg-ink-float/30 backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-16 -right-16 z-0 h-40 w-40 rounded-full bg-gradient-to-br from-rose-500/10 to-amber-400/5 blur-3xl" />

        {/* Age gate overlay */}
        {gated && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 rounded-3xl bg-ink-deep/85 px-6 py-8 backdrop-blur-2xl">
            <p className="heading-display text-center text-base text-paper sm:text-lg">
              {t("ads.ageGate")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setAgeGate("verified")}
                className="btn-mint px-6 py-2.5 text-sm"
              >
                {t("ads.ageConfirm")}
              </button>
              <button
                onClick={() => setAgeGate("declined")}
                className="btn-glass px-6 py-2.5 text-sm text-ash"
              >
                {t("ads.ageDecline")}
              </button>
            </div>
          </div>
        )}

        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/15 backdrop-blur-xl">
              <ShoppingBag className="h-5 w-5 text-rose-300" />
            </div>
            <div>
              <h3 className="heading-display text-lg text-paper sm:text-xl">
                {t("ads.title")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ash">
                {t("ads.bannerText")}
              </p>
            </div>
          </div>

          <button
            onClick={handleVisit}
            className="btn-mint shrink-0 px-5 py-2.5 text-sm self-start sm:self-center"
          >
            {t("ads.cta")}
          </button>
        </div>

        {/* Sponsored badge — doubles as dismiss */}
        <div
          className={`absolute ${rtl ? "left-3" : "right-3"} top-3 z-10`}
        >
          <button
            onClick={() => setDismissed(true)}
            aria-label={t("common.close")}
            className="glass-mint flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-mint-300/80 transition-colors hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/30"
          >
            {t("ads.sponsored")} <span className="text-[9px] opacity-60">X</span>
          </button>
        </div>
      </div>
    </section>
  );
}
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, X } from "lucide-react";

export function LegalDisclaimer() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 py-2 text-xs font-semibold text-ash transition-all duration-ui ease-spring hover:bg-white/10 hover:text-paper active:scale-95 active:duration-press"
      >
        <ShieldAlert className="h-4 w-4" />
        <span>{t("disclaimer.button")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-deep/70 px-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-pop animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="heading-display text-lg text-paper">
                    {t("disclaimer.title")}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="btn-icon h-9 w-9"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-ash">
              <p>{t("disclaimer.content1")}</p>
              <p>{t("disclaimer.content2")}</p>
              <p>{t("disclaimer.content3")}</p>
              <p>{t("disclaimer.content4")}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="btn-mint inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
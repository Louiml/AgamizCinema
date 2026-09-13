import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, X, ServerOff, FileX, Copyright, Info } from "lucide-react";
import { createPortal } from "react-dom";

export function LegalDisclaimer() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const sections = [
    { icon: ServerOff, title: t("disclaimer.noHosting"), text: t("disclaimer.noHostingText") },
    { icon: FileX, title: t("disclaimer.removalRequests"), text: t("disclaimer.removalRequestsText") },
    { icon: Copyright, title: t("disclaimer.copyright"), text: t("disclaimer.copyrightText") },
    { icon: Info, title: t("disclaimer.disclaimer"), text: t("disclaimer.disclaimerText") },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-canvas-night-elevated px-3 py-2 text-xs font-medium text-shade-40 transition-all duration-ui ease-spring hover:border-white/[0.16] hover:text-on-primary active:scale-95 active:duration-press"
      >
        <ShieldAlert className="h-4 w-4" />
        <span>{t("disclaimer.button")}</span>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 animate-fade-in"
            onClick={() => setOpen(false)}
          >
            <div
              className="surface-dark w-full max-w-lg overflow-hidden rounded-lg shadow-elev-4 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-hairline-light p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="heading-display text-lg text-on-primary">
                      {t("disclaimer.title")}
                    </h3>
                    <p className="mt-0.5 text-xs text-shade-50">Agamiz Cinema</p>
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

              {/* Scrollable body */}
              <div className="max-h-[60vh] overflow-y-auto p-5">
                <div className="space-y-5">
                  {sections.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.title}>
                        <div className="flex items-center gap-2 pb-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <h4 className="text-sm font-medium text-on-primary">{s.title}</h4>
                        </div>
                        <p className="pl-9 text-sm leading-relaxed text-shade-40">{s.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t border-hairline-light p-4">
                <button
                  onClick={() => setOpen(false)}
                  className="btn-primary-pill px-5 py-2.5 text-sm font-medium"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

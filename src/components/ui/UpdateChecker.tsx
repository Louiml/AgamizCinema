import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Download, X, Sparkles } from "lucide-react";
import { checkUpdate, downloadUpdate, type LatestRelease } from "@/services/update";

/**
 * Checks GitHub for a newer release once per session (desktop only, after a
 * short delay) and shows a small prompt with a download button that opens
 * the release page in the system browser.
 */
export function UpdateChecker() {
  const { t } = useTranslation();
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      checkUpdate().then((r) => {
        if (!cancelled && r) setRelease(r);
      });
    }, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!release || dismissed) return null;

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 px-4 animate-fade-in">
      <div className="surface-dark w-full max-w-sm rounded-lg p-5 shadow-elev-4 animate-scale-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-medium text-on-primary">
                {t("update.title", { version: release.tag })}
              </h3>
              <p className="mt-0.5 text-xs text-shade-50">{t("update.desc")}</p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} aria-label={t("common.close")} className="btn-icon h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>

        {release.notes && (
          <p className="mt-3 max-h-32 overflow-y-auto whitespace-pre-line rounded-md border border-hairline-light bg-canvas-elevated/40 p-3 text-xs leading-relaxed text-shade-50">
            {release.notes}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={() => setDismissed(true)} className="btn-outline-on-dark px-4 py-2.5 text-sm">
            {t("update.later")}
          </button>
          <button
            onClick={() => {
              downloadUpdate(release);
              setDismissed(true);
            }}
            className="btn-primary-pill px-5 py-2.5 text-sm"
          >
            <Download className="h-4 w-4" /> {t("update.download")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

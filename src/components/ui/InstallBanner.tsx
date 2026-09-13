import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MonitorDown, X } from "lucide-react";
import { isTauri } from "@/services/tauri";
import { useIsMobile } from "@/hooks/useIsMobile";
import { openExternal } from "@/services/links";
import { APPS_URL } from "@/components/ui/ExternalLinks";

const DISMISS_KEY = "agamiz:installPromptDismissed";
const SHOW_DELAY_MS = 2000;
export function InstallBanner() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isTauri() || isMobile) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled && !localStorage.getItem(DISMISS_KEY)) {
        setVisible(true);
      }
    }, SHOW_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isMobile]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore storage errors */
    }
    setVisible(false);
  };

  const handleDownload = () => {
    handleDismiss();
    void openExternal(APPS_URL);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible || isMobile) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 animate-fade-in"
      onClick={handleDismiss}
    >
      <div
        className="surface-dark w-full max-w-md rounded-lg p-6 shadow-elev-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-elevated-dark text-on-primary">
              <MonitorDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="heading-display text-lg text-on-primary">
                {t("install.title")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-shade-40">
                {t("install.desc")}
              </p>
            </div>
          </div>
          <button onClick={handleDismiss} aria-label={t("common.close")} className="btn-icon h-9 w-9">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={handleDismiss} className="btn-glass px-5 py-2.5 text-sm">
            {t("install.later")}
          </button>
          <button onClick={handleDownload} className="btn-primary-pill px-5 py-2.5 text-sm">
            <MonitorDown className="h-4 w-4" /> {t("install.install")}
          </button>
        </div>
      </div>
    </div>
  );
}

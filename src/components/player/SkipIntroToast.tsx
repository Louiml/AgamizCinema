import { useEffect, useRef, useState } from "react";
import { SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SkipSegment } from "@/services/skip";

interface SkipIntroToastProps {
  segment: SkipSegment;
  onSkip: () => void;
  autoHideMs?: number;
}

const KIND_LABEL_KEY: Record<SkipSegment["kind"], string> = {
  intro: "skip.kindIntro",
  recap: "skip.kindRecap",
  outro: "skip.kindOutro",
};

export function SkipIntroToast({ segment, onSkip, autoHideMs = 8000 }: SkipIntroToastProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const dismissTimer = useRef<number | null>(null);

  useEffect(() => {
    setDismissed(false);
    if (autoHideMs > 0) {
      dismissTimer.current = window.setTimeout(() => setDismissed(true), autoHideMs);
    }
    return () => {
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
    };
  }, [segment, autoHideMs]);

  if (dismissed) return null;

  const label = t(KIND_LABEL_KEY[segment.kind]);

  return (
    <button
      type="button"
      onClick={() => {
        setDismissed(true);
        onSkip();
      }}
      className="absolute bottom-6 end-6 z-20 flex items-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-medium text-accent-on shadow-elev-4 transition-transform duration-ui ease-spring hover:scale-105 active:scale-95 active:duration-press focus:outline-none focus:ring-2 focus:ring-accent/50"
    >
      <SkipForward className="h-4 w-4" />
      {t("skip.action", { kind: label })}
    </button>
  );
}

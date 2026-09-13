import { useTranslation } from "react-i18next";
import { MonitorDown } from "lucide-react";
import { isTauri } from "@/services/tauri";
import { openExternal } from "@/services/links";

export const CINEMA_URL = "https://cinema.agamiz.com";
export const APPS_URL = "https://apps.agamiz.com";

interface ExternalLinksProps {
  className?: string;
}

export function ExternalLinks({ className = "" }: ExternalLinksProps) {
  const { t } = useTranslation();
  if (isTauri()) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => void openExternal(APPS_URL)}
        className="flex items-center gap-1.5 rounded-pill bg-contrast px-3 py-2 text-xs font-medium text-on-contrast transition-all duration-ui ease-spring hover:brightness-95 active:scale-95 active:duration-press"
        title={t("external.downloadApp")}
      >
        <MonitorDown className="h-4 w-4" />
        <span>{t("common.download")}</span>
      </button>
    </div>
  );
}
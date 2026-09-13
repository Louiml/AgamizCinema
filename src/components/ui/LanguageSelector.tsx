import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  changeLanguage,
  type AppLanguage,
} from "@/i18n";
import { useIsLight } from "@/providers/SettingsProvider";

const LANGUAGES: Array<{ code: AppLanguage; label: string; labelCode: string; country: string }> = [
  { code: "en", label: "English", labelCode: "EN", country: "gb" },
  { code: "he", label: "עברית", labelCode: "HE", country: "il" },
  { code: "ru", label: "Русский", labelCode: "RU", country: "ru" },
  { code: "de", label: "Deutsch", labelCode: "DE", country: "de" },
  { code: "ar", label: "العربية", labelCode: "AR", country: "sa" },
  { code: "it", label: "Italiano", labelCode: "IT", country: "it" },
  { code: "ja", label: "日本語", labelCode: "JA", country: "jp" },
];

interface LanguageSelectorProps {
  align?: "start" | "end";
  className?: string;
}

export function LanguageSelector({
  align = "end",
  className = "",
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isLight = useIsLight();

  const active = i18n.language as AppLanguage;
  const activeMeta =
    LANGUAGES.find((l) => l.code === active) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (code: AppLanguage) => {
    setOpen(false);
    void changeLanguage(code);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("settings.language")}
        className={`inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-all duration-ui ease-spring active:scale-95 active:duration-press ${
          isLight
            ? "border border-hairline-light bg-canvas-light text-ink hover:border-ink/30"
            : "surface-dark text-on-primary hover:border-white/[0.16]"
        } ${open ? (isLight ? "border-ink/30" : "border-white/[0.2]") : ""}`}
      >
        <Globe className={`h-4 w-4 shrink-0 ${isLight ? "text-ink" : "text-on-primary"}`} />
        <span className={`fi fi-${activeMeta.country} text-[1.15em] leading-none`} aria-hidden />
        <span className="tabular-nums tracking-wide">{activeMeta.labelCode}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("settings.language")}
          className={`absolute top-full z-[70] mt-2 max-h-[min(70vh,20rem)] w-44 min-w-[12rem] origin-top animate-scale-in overflow-y-auto rounded-md p-1.5 shadow-elev-4 ${
            isLight ? "surface-light" : "surface-dark"
          } ${align === "end" ? "end-0" : "start-0"}`}
        >
          {LANGUAGES.map((lang) => {
            const activeLang = lang.code === active;
            return (
              <button
                key={lang.code}
                role="menuitemradio"
                aria-checked={activeLang}
                onClick={() => pick(lang.code)}
                className={`flex w-full items-center justify-between gap-3 rounded-xs px-3 py-2.5 text-sm transition-colors duration-150 ${
                  activeLang
                    ? isLight
                      ? "bg-shade-30 text-ink"
                      : "bg-white/10 text-on-primary"
                    : isLight
                      ? "text-shade-60 hover:bg-shade-30/60 hover:text-ink"
                      : "text-shade-40 hover:bg-white/5 hover:text-on-primary"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`fi fi-${lang.country} text-[1.1em] leading-none`} aria-hidden />
                  <span>{t(`lang.${lang.code}`)}</span>
                </span>
                {activeLang && (
                  <Check className={`h-4 w-4 shrink-0 ${isLight ? "text-ink" : "text-on-primary"}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
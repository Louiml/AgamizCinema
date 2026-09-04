import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  changeLanguage,
  type AppLanguage,
} from "@/i18n";

const LANGUAGES: Array<{ code: AppLanguage; label: string; labelCode: string }> = [
  { code: "en", label: "English", labelCode: "EN" },
  { code: "he", label: "עברית", labelCode: "HE" },
  { code: "ru", label: "Русский", labelCode: "RU" },
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
        className={`glass-panel inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-paper transition-all duration-ui ease-spring hover:border-mint-500/30 active:scale-95 active:duration-press ${
          open ? "border-mint-500/40" : ""
        }`}
      >
        <Globe className="h-4 w-4 shrink-0 text-mint-400" />
        <span className="tabular-nums tracking-wide">{activeMeta.labelCode}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("settings.language")}
          className={`glass-panel absolute top-full z-[70] mt-2 w-40 min-w-[11rem] origin-top animate-scale-in rounded-2xl p-1.5 shadow-pop ${
            align === "end" ? "end-0" : "start-0"
          }`}
        >
          {LANGUAGES.map((lang) => {
            const activeLang = lang.code === active;
            return (
              <button
                key={lang.code}
                role="menuitemradio"
                aria-checked={activeLang}
                onClick={() => pick(lang.code)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
                  activeLang
                    ? "bg-white/10 text-paper"
                    : "text-ash hover:bg-white/5 hover:text-paper"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-8 items-center justify-center rounded-md text-[10px] font-bold ${
                      activeLang
                        ? "bg-mint-500 text-ink"
                        : "border border-white/10 bg-white/5 text-ash"
                    }`}
                  >
                    {lang.labelCode}
                  </span>
                  <span>{t(`lang.${lang.code}`)}</span>
                </span>
                {activeLang && (
                  <Check className="h-4 w-4 shrink-0 text-mint-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
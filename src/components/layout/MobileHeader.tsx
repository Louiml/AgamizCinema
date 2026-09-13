import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { SearchModal } from "@/components/search/SearchModal";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { Logo } from "@/components/ui/Logo";
import type { Route, Canvas } from "@/router/useHashRoute";

interface MobileHeaderProps {
  navigate: (r: Route) => void;
  canvas: Canvas;
}

export function MobileHeader({ navigate, canvas }: MobileHeaderProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const isLight = canvas === "cream";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 md:hidden ${
          isLight
            ? "border-b border-hairline-light bg-canvas-cream"
            : "border-b border-white/[0.06] bg-canvas-night"
        }`}
      >
        <div className="flex h-14 items-center gap-2 px-4">
          {/* Brand */}
          <button
            onClick={() => navigate("home")}
            className="group flex min-w-0 flex-1 items-center gap-2.5 text-start"
            aria-label="Agamiz Cinema — Home"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 transition-transform duration-300 group-hover:scale-105"
            >
              <Logo className="h-7 w-7 text-accent" />
            </span>
            <span
              className={`heading-display truncate text-lg leading-none ${
                isLight ? "text-ink" : "text-on-primary"
              }`}
            >
              Agamiz Cinema
            </span>
          </button>

          {/* Language + search triggers (no download button on mobile) */}
          <LanguageSelector align="end" />
          <button
            onClick={() => setSearchOpen(true)}
            aria-label={t("common.searchPlaceholder")}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-all duration-ui ease-spring active:scale-90 active:duration-press ${
              isLight
                ? "border border-hairline-light bg-canvas-light text-ink hover:border-ink/30"
                : "border border-white/[0.08] bg-canvas-night-elevated text-on-primary hover:border-white/[0.16]"
            }`}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
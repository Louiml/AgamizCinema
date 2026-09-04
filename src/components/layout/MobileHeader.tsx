import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { SearchModal } from "@/components/search/SearchModal";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import type { Route } from "@/router/useHashRoute";
import logoUrl from "@/logo.png";

interface MobileHeaderProps {
  navigate: (r: Route) => void;
}

/**
 * Sticky top header for the mobile layout: brand mark on the left and an
 * inline search trigger on the right. There is intentionally no "download"
 * button here — the desktop download prompt is Windows-only and omitted on
 * mobile (see {@link InstallBanner}).
 */
export function MobileHeader({ navigate }: MobileHeaderProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);

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
      <header className="glass-chrome sticky top-0 z-40 md:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          {/* Brand */}
          <button
            onClick={() => navigate("home")}
            className="group flex min-w-0 flex-1 items-center gap-2.5 text-start"
            aria-label="Agamiz Cinema — Home"
          >
            <span className="glass-mint flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-105">
              <img
                src={logoUrl}
                alt=""
                className="h-7 w-7 object-contain"
                draggable={false}
              />
            </span>
            <span className="heading-display truncate text-lg leading-none text-paper">
              Agamiz<span className="text-gradient-mint"> Cinema</span>
            </span>
          </button>

          {/* Language + search triggers (no download button on mobile) */}
          <LanguageSelector align="end" />
          <button
            onClick={() => setSearchOpen(true)}
            aria-label={t("common.searchPlaceholder")}
            className="glass-panel flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-paper transition-all duration-ui ease-spring hover:border-white/[0.16] active:scale-90 active:duration-press hover:text-mint-300"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { useScrolled, useSearchHotkey } from "@/hooks/useChrome";
import { SearchModal } from "@/components/search/SearchModal";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { Logo } from "@/components/ui/Logo";
import type { Route } from "@/router/useHashRoute";

interface NetflixMobileHeaderProps {
  navigate: (r: Route) => void;
}

/**
 * Mobile counterpart to NetflixTitleBar: solid square brand bar with the search
 * affordance. Kept deliberately minimal — the bottom nav carries navigation.
 */
export function NetflixMobileHeader({ navigate }: NetflixMobileHeaderProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useSearchHotkey();
  const scrolled = useScrolled(8);

  return (
    <>
      <header
        className={`sticky top-0 z-40 select-none transition-colors duration-ui md:hidden ${
          scrolled
            ? "border-b border-white/[0.06] bg-canvas-night"
            : "border-b border-transparent bg-canvas-night"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={() => navigate("home")}
            aria-label="Agamiz Cinema - Home"
            className="flex items-center gap-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-[2px] bg-accent">
              <Logo className="h-5 w-5 text-on-accent" />
            </span>
            <span className="nf-title text-base text-on-primary">Agamiz Cinema</span>
          </button>

          <div className="flex items-center gap-1">
            <LanguageSelector align="end" />
            <button
              onClick={() => setSearchOpen(true)}
              aria-label={t("common.search")}
              className="flex h-9 w-9 items-center justify-center rounded-[2px] text-on-primary/80 transition-colors duration-ui hover:bg-white/10 hover:text-on-primary"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
import { ExternalLinks } from "@/components/ui/ExternalLinks";
import { LegalDisclaimer } from "@/components/ui/LegalDisclaimer";

/**
 * Minimal square footer for the Netflix skin. Netflix's real footer is a dense
 * link matrix; this keeps the legal/disclaimer affordances the app needs
 * without pretending to be a page we do not have.
 */
export function NetflixFooter() {
  return (
    <footer className="mt-16 border-t border-white/[0.06] px-4 py-10 pb-28 text-center text-xs text-on-primary/50 sm:px-8 md:pb-10 lg:px-16">
      <div className="mb-4 flex justify-center gap-2">
        <ExternalLinks />
        <LegalDisclaimer />
      </div>
      <p>
        Agamiz Cinema made by Louiml using React.js(Web) &amp; Tauri(Desktop).
      </p>
    </footer>
  );
}
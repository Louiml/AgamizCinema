import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Shared atoms for the Netflix design skin.
 *
 * Everything here is flat and square: 2px corners, no shadows beyond the
 * single hairline, and Netflix's standard UI easing instead of the classic
 * springs. Colour always comes from the semantic tokens so the skin stays in
 * sync with the red accent.
 */

type NfButtonVariant = "solid" | "ghost";

interface NfButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NfButtonVariant;
  children: ReactNode;
}

/**
 * The solid white "Play" pill. `--contrast` resolves to white in this skin
 * and black in the classic dark theme, so no colour is hardcoded here.
 */
export function NfButton({
  variant = "ghost",
  className = "",
  children,
  ...rest
}: NfButtonProps) {
  const base =
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-[2px] px-5 py-2 text-sm font-semibold " +
    "transition-colors duration-ui ease-out active:brightness-90 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-on-primary/50 " +
    "disabled:pointer-events-none disabled:opacity-40";

  const variants: Record<NfButtonVariant, string> = {
    solid: "bg-contrast text-on-contrast hover:bg-contrast/85",
    ghost:
      "bg-shade-70/70 text-on-primary hover:bg-shade-70/50 " +
      "ring-1 ring-inset ring-on-primary/25",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

interface NfRowHeadingProps {
  title: string;
  /** Small grey qualifier rendered under the title. */
  subtitle?: string;
  /** Right-aligned controls (typically the row's scroll arrows). */
  actions?: ReactNode;
}

/**
 * Section heading for a poster rail. Netflix keeps this deliberately small —
 * it is chrome, not a page title.
 */
export function NfRowHeading({ title, subtitle, actions }: NfRowHeadingProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="nf-title text-xl text-on-primary sm:text-[1.4rem]">
          {title}
        </h2>
        {subtitle && <p className="nf-meta mt-0.5 truncate text-[13px]">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

/** Scroll arrows for a rail. Fades out when the rail is already at that end. */
export function NfRailArrow({
  direction,
  onClick,
  disabled,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  const glyph = direction === "prev" ? "‹" : "›";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-[2px] bg-black/60 text-2xl leading-none text-white/90 transition-all duration-ui hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
        disabled ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <span aria-hidden className="-mt-0.5 block">
        {glyph}
      </span>
    </button>
  );
}

/**
 * Red match score, e.g. "97% Match".
 *
 * `value` is the raw 0-10 score and is scaled to a percentage here. Passing an
 * already-divided 0-1 value would render "8% Match" for a well-rated title.
 */
export function NfMatchScore({ value }: { value: number }) {
  return <span className="text-sm font-semibold text-accent">{Math.round(value * 10)}% Match</span>;
}
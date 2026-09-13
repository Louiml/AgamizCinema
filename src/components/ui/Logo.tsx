interface LogoProps {
  className?: string;
}

/**
 * Agamiz Cinema logo. A rounded "screen" with a play triangle, drawn with
 * `currentColor` so it inherits the active theme's accent color from its
 * parent (`text-accent`). The screen frame is 30% opacity, the play
 * triangle is full opacity — the focus is the play, the frame is context.
 */
export function Logo({ className = "" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Screen frame */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.3"
      />
      {/* Film strip top bar (clapperboard nod) */}
      <rect x="5" y="3.5" width="14" height="2.5" rx="1" fill="currentColor" opacity="0.35" />
      {/* Play triangle */}
      <path
        d="M9.5 8.5L17 12L9.5 15.5V8.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

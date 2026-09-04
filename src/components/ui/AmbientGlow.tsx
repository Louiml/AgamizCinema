interface AmbientGlowProps {
  imageUrl?: string | null;
  className?: string;
  opacity?: number;
}

export function AmbientGlow({
  imageUrl,
  className = "",
  opacity = 1,
}: AmbientGlowProps) {
  if (!imageUrl) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="absolute -left-1/4 -top-1/4 h-[150%] w-[150%] scale-150 object-cover blur-3xl"
        style={{ opacity: 0.45 * opacity, transform: "scale(1.5) scaleX(-1)" }}
      />
    </div>
  );
}
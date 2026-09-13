import { Star } from "lucide-react";

interface RatingBadgeProps {
  rating: number;
  className?: string;
  size?: "sm" | "md";
}

export function RatingBadge({
  rating,
  className = "",
  size = "md",
}: RatingBadgeProps) {
  const padding = size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-hairline-light bg-canvas-night-elevated font-medium text-on-primary ${padding} ${className}`}
      title={`${rating.toFixed(1)} / 10`}
    >
      <Star className={`${size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} text-accent`} fill="currentColor" />
      {rating > 0 ? rating.toFixed(1) : "NR"}
    </span>
  );
}

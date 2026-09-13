import type { LucideIcon } from "lucide-react";
import { useIsLight } from "@/providers/SettingsProvider";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const isLight = useIsLight();
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg px-8 py-16 text-center animate-fade-in ${
        isLight ? "surface-light" : "surface-dark"
      }`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-lg ${
          isLight ? "bg-aloe" : "bg-surface-elevated-dark"
        }`}
      >
        <Icon className={`h-8 w-8 ${isLight ? "text-accent-soft-on" : "text-on-primary"}`} />
      </div>
      <h3
        className={`heading-display text-lg ${isLight ? "text-ink" : "text-on-primary"}`}
      >
        {title}
      </h3>
      {description && (
        <p className={`max-w-sm text-sm ${isLight ? "text-shade-60" : "text-shade-40"}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

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
  return (
    <div className="glass-panel flex flex-col items-center justify-center gap-3 rounded-3xl px-8 py-16 text-center animate-fade-in">
      <div className="glass-mint flex h-16 w-16 items-center justify-center rounded-2xl">
        <Icon className="h-8 w-8 text-mint-300" />
      </div>
      <h3 className="heading-display text-lg text-paper">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ash">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

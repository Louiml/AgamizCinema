import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { dismiss, subscribe, type Toast } from "@/lib/toast";

const TONE_RING: Record<string, string> = {
  default: "text-mint-400",
  success: "text-mint-400",
  error: "text-rose-400",
};

/**
 * Renders the global toast stack, fixed to the bottom-end corner above the
 * mobile bottom nav. Each toast enters with a spring; tapping it dismisses.
 * Mounted once at the app root.
 */
export function ToastViewport() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => subscribe(setItems), []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-6 sm:end-6 sm:items-end"
    >
      {items.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className="glass-panel pointer-events-auto flex max-w-sm animate-toast-in items-center gap-3 rounded-2xl px-4 py-3 text-start shadow-pop"
          >
            {Icon && <Icon className={`h-4.5 w-4.5 shrink-0 ${TONE_RING[t.tone ?? "default"]}`} />}
            <span className="text-sm font-medium text-paper">{t.message}</span>
            <X className="h-3.5 w-3.5 shrink-0 text-ash-dim" />
          </button>
        );
      })}
    </div>
  );
}

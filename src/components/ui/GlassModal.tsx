import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, type LucideIcon } from "lucide-react";

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function GlassModal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
}: GlassModalProps) {
  const { t } = useTranslation();
  const effectiveConfirm = confirmLabel ?? t("common.confirm");
  const effectiveCancel = cancelLabel ?? t("common.cancel");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-deep/70 px-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-pop animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {Icon && (
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  destructive
                    ? "bg-rose-500/15 text-rose-300"
                    : "glass-mint text-mint-300"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="heading-display text-lg text-paper">{title}</h3>
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-ash">{description}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label={t("common.close")} className="btn-icon h-9 w-9">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-glass px-5 py-2.5 text-sm">
            {effectiveCancel}
          </button>
          <button
            onClick={handleConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-ui ease-spring active:scale-[0.97] active:duration-press ${
              destructive
                ? "bg-gradient-to-r from-rose-500 to-rose-400 text-white hover:shadow-[0_0_28px_-6px_rgba(244,63,94,0.6)]"
                : "btn-mint"
            }`}
          >
            {effectiveConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

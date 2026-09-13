import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, type LucideIcon } from "lucide-react";
import { useIsLight } from "@/providers/SettingsProvider";

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
  const isLight = useIsLight();
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
      className={`fixed inset-0 z-[60] flex items-center justify-center px-4 animate-fade-in ${
        isLight ? "bg-black/30" : "bg-black/70"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-lg p-6 shadow-elev-4 animate-scale-in ${
          isLight ? "surface-light" : "surface-dark"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {Icon && (
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                  destructive
                    ? "bg-rose-500/15 text-rose-400"
                    : isLight
                      ? "bg-aloe text-accent-soft-on"
                      : "bg-surface-elevated-dark text-on-primary"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3
                className={`heading-display text-lg ${isLight ? "text-ink" : "text-on-primary"}`}
              >
                {title}
              </h3>
              {description && (
                <p
                  className={`mt-1 text-sm leading-relaxed ${
                    isLight ? "text-shade-60" : "text-shade-40"
                  }`}
                >
                  {description}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label={t("common.close")} className="btn-icon h-9 w-9">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className={isLight ? "btn-outline-on-light px-5 py-2.5 text-sm" : "btn-glass px-5 py-2.5 text-sm"}
          >
            {effectiveCancel}
          </button>
          <button
            onClick={handleConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-sm font-medium transition-all duration-ui ease-spring active:scale-[0.97] active:duration-press ${
              destructive
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : "bg-contrast text-on-contrast hover:brightness-95"
            }`}
          >
            {effectiveConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

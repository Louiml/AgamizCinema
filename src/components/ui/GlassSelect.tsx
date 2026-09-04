import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

export interface GlassSelectOption<T extends string | number = string | number> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

interface GlassSelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: GlassSelectOption<T>[];
  placeholder?: string;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  disabled?: boolean;
  compact?: boolean;
  ariaLabel?: string;
  className?: string;
}

const GAP = 6;

/**
 * Custom glassmorphic dropdown. Replaces the native <select> everywhere so the
 * trigger and the option list both follow the app's design language. The menu
 * is portaled to <body>, keeps the trigger's width, flips upward when there's
 * no room below, and supports full keyboard navigation.
 */
export function GlassSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  disabled = false,
  compact = false,
  ariaLabel,
  className = "",
}: GlassSelectProps<T>) {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder ?? t("common.select");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; minWidth: number } | null>(null);

  const selectedOption = options.find((o) => o.value === value);

  const enabledIndices = options
    .map((o, i) => (o.disabled ? -1 : i))
    .filter((i) => i >= 0);

  const openMenu = () => {
    if (disabled || options.length === 0) return;
    const idx = options.findIndex((o) => o.value === value);
    setHighlight(enabledIndices.includes(idx) ? idx : (enabledIndices[0] ?? 0));
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menu = menuRef.current;
    const menuHeight = menu ? menu.getBoundingClientRect().height : 0;
    const menuWidth = menu ? menu.getBoundingClientRect().width : 0;
    let top = rect.bottom + GAP;
    if (menuHeight + GAP > window.innerHeight - rect.bottom) {
      top = Math.max(GAP, rect.top - menuHeight - GAP);
    }
    const left = Math.min(
      Math.max(GAP, rect.left),
      window.innerWidth - menuWidth - GAP,
    );
    setPos({ left, top, minWidth: rect.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Tab") {
        setOpen(false);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const opt = options[highlight];
        if (opt && !opt.disabled) {
          onChange(opt.value);
          setOpen(false);
          triggerRef.current?.focus();
        }
        return;
      }
      if (enabledIndices.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const idx = enabledIndices.indexOf(highlight);
        setHighlight(enabledIndices[(idx + 1) % enabledIndices.length]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const idx = enabledIndices.indexOf(highlight);
        setHighlight(
          enabledIndices[(idx - 1 + enabledIndices.length) % enabledIndices.length],
        );
      } else if (e.key === "Home") {
        e.preventDefault();
        setHighlight(enabledIndices[0]);
      } else if (e.key === "End") {
        e.preventDefault();
        setHighlight(enabledIndices[enabledIndices.length - 1]);
      }
    };

    const onScroll = () => setOpen(false);
    const onResize = () => setOpen(false);

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, options, highlight, onChange]);

  const selectOption = (opt: GlassSelectOption<T>) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const Trailing = TrailingIcon ?? ChevronDown;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (open) return;
          if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={`glass-panel inline-flex cursor-pointer items-center gap-2 rounded-2xl text-sm text-paper transition-all duration-ui ease-spring focus:outline-none focus:border-mint-500/40 focus:shadow-glow-soft disabled:cursor-not-allowed disabled:opacity-50 ${
          compact ? "px-3.5 py-1.5" : "px-4 py-2.5"
        } ${open ? "border-mint-500/40" : ""} ${className}`}
      >
        {LeadingIcon && (
          <LeadingIcon className="h-4 w-4 shrink-0 text-mint-400" />
        )}
        <span className="max-w-[220px] truncate">
          {selectedOption ? selectedOption.label : effectivePlaceholder}
        </span>
        <Trailing
          className={`h-4 w-4 shrink-0 text-ash transition-transform duration-ui ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              left: pos?.left ?? 0,
              top: pos?.top ?? 0,
              minWidth: pos?.minWidth,
            }}
            className="glass-panel fixed z-[95] w-max max-w-[80vw] origin-top-left animate-scale-in rounded-2xl p-1.5 shadow-pop"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-ash-dim">{effectivePlaceholder}</div>
            ) : (
              options.map((opt, i) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  disabled={opt.disabled}
                  onMouseEnter={() => !opt.disabled && setHighlight(i)}
                  onClick={() => selectOption(opt)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150 ${
                    opt.disabled
                      ? "cursor-not-allowed text-ash-dim"
                      : i === highlight
                        ? "bg-white/10 text-paper"
                        : "text-ash hover:bg-white/5 hover:text-paper"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && (
                    <Check className="h-4 w-4 shrink-0 text-mint-400" />
                  )}
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

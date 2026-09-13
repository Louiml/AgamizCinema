import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ContextMenuProps {
  state: ContextMenuState | null;
  onClose: () => void;
}

const EDGE_PADDING = 8;

export function ContextMenu({ state, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!state) {
      setPos(null);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const { innerWidth, innerHeight } = window;
    const rect = el.getBoundingClientRect();
    setPos({
      left: Math.max(EDGE_PADDING, Math.min(state.x, innerWidth - rect.width - EDGE_PADDING)),
      top: Math.max(EDGE_PADDING, Math.min(state.y, innerHeight - rect.height - EDGE_PADDING)),
    });
  }, [state]);

  useEffect(() => {
    if (!state) return;

    const isOutside = (e: Event) => {
      const target = e.target as Node;
      return ref.current ? !ref.current.contains(target) : true;
    };

    const onContextMenu = (e: MouseEvent) => {
      if (!isOutside(e)) return;
      onClose();
    };

    const onClick = (e: MouseEvent) => {
      if (!isOutside(e)) return;
      e.stopPropagation();
      onClose();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onScroll = () => onClose();

    window.addEventListener("contextmenu", onContextMenu, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);

    return () => {
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [state, onClose]);

  if (!state) return null;

  const handleItem = (item: ContextMenuItem) => {
    if (item.disabled) return;
    onClose();
    item.onClick();
  };

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left: pos?.left ?? state.x, top: pos?.top ?? state.y }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="surface-dark fixed z-[90] w-56 origin-top-left animate-scale-in rounded-md p-1.5 shadow-elev-4"
    >
      {state.items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => handleItem(item)}
            className={`flex w-full items-center gap-2.5 rounded-xs px-3 py-2 text-left text-sm font-medium transition-colors duration-150 ${
              item.disabled
                ? "cursor-default text-shade-50"
                : item.destructive
                  ? "text-rose-300 hover:bg-rose-500/15"
                  : "text-on-primary hover:bg-white/10"
            }`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

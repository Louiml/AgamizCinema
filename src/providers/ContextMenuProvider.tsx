import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ContextMenu,
  type ContextMenuItem,
} from "@/components/ui/ContextMenu";
import {
  getContextMenuItems,
  isNativeEditableTarget,
} from "@/lib/contextMenu";

interface MenuRequest {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ContextMenuContextValue {
  open: (request: MenuRequest) => void;
  close: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

/**
 * App-wide context menu host (existing imperative API) PLUS a single delegated
 * `contextmenu` listener that implements the selective `data-context-menu`
 * system.
 *
 * Dispatch rules (this is the key to "only elements that opt in get a custom
 * menu"):
 *  - Right-click an element carrying `data-context-menu` that is registered in
 *    the trigger registry  ->  custom menu opens (preventDefault).
 *  - Right-click on a native editable surface (input/textarea/select/content
 *    editable)             ->  the browser's own menu is untouched.
 *  - Right-click on an element explicitly marked `data-context-menu="none"` ->
 *    native menu (opt-out from an enclosing trigger).
 *  - Everything else       ->  nothing happens here; the browser shows its
 *    default context menu.
 */
export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuRequest | null>(null);

  const open = useCallback((request: MenuRequest) => setMenu(request), []);
  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      if (isNativeEditableTarget(target)) return;

      if (target.closest("[data-context-menu='none']")) return;

      const trigger = target.closest("[data-context-menu]");
      if (!trigger) return;

      const items = getContextMenuItems(trigger);
      if (!items || items.length === 0) return;

      e.preventDefault();
      e.stopPropagation();
      setMenu({ x: e.clientX, y: e.clientY, items });
    };
    window.addEventListener("contextmenu", onContextMenu);
    return () => window.removeEventListener("contextmenu", onContextMenu);
  }, []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
      <ContextMenu state={menu} onClose={close} />
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu(): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    throw new Error("useContextMenu must be used within a ContextMenuProvider");
  }
  return ctx;
}
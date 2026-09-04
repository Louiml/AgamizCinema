import { cloneElement, useCallback, useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactElement } from "react";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";
import {
  CONTEXT_MENU_ATTR,
  registerContextMenu,
  unregisterContextMenu,
} from "@/lib/contextMenu";

interface ContextMenuTriggerProps {
  items: ContextMenuItem[] | (() => ContextMenuItem[]);
  children: ReactElement;
  allowNative?: boolean;
}

export function ContextMenuTrigger({
  items,
  children,
  allowNative = false,
}: ContextMenuTriggerProps) {
  const domRef = useRef<HTMLElement | null>(null);

  const getItems = useMemo(
    () => (typeof items === "function" ? items : () => items),
    [items],
  );
  const getItemsRef = useRef(getItems);
  getItemsRef.current = getItems;

  const childRef = (children as ReactElement & { ref?: unknown }).ref;
  const mergedRef = useCallback(
    (node: unknown) => {
      domRef.current = (node as HTMLElement | null) ?? null;
      if (typeof childRef === "function") childRef(node);
      else if (childRef && typeof childRef === "object" && "current" in childRef) {
        (childRef as MutableRefObject<unknown>).current = node;
      }
    },
    [childRef],
  );

  useLayoutEffect(() => {
    const el = domRef.current;
    if (!el) return;
    if (allowNative) {
      el.setAttribute("data-context-menu", "none");
      unregisterContextMenu(el);
      return () => el.removeAttribute("data-context-menu");
    }
    el.setAttribute(CONTEXT_MENU_ATTR, "");
    registerContextMenu(el, () => getItemsRef.current());
    return () => {
      el.removeAttribute(CONTEXT_MENU_ATTR);
      unregisterContextMenu(el);
    };
  }, [allowNative]);

  return cloneElement(children, {
    ref: mergedRef,
    "data-context-menu": allowNative ? "none" : "",
  });
}

export function useContextMenuTrigger<T extends HTMLElement = HTMLElement>(
  items: ContextMenuItem[] | (() => ContextMenuItem[]),
) {
  const ref = useRef<T | null>(null);

  const getItems = useMemo(
    () => (typeof items === "function" ? items : () => items),
    [items],
  );
  const getItemsRef = useRef(getItems);
  getItemsRef.current = getItems;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute(CONTEXT_MENU_ATTR, "");
    registerContextMenu(el, () => getItemsRef.current());
    return () => {
      el.removeAttribute(CONTEXT_MENU_ATTR);
      unregisterContextMenu(el);
    };
  }, []);

  return ref;
}
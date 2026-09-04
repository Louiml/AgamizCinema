import { type Ref, type RefCallback, type ReactElement } from "react";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";

const registry = new WeakMap<Element, () => ContextMenuItem[]>();

export function registerContextMenu(el: Element, getItems: () => ContextMenuItem[]): void {
  registry.set(el, getItems);
}

export function unregisterContextMenu(el: Element): void {
  registry.delete(el);
}

export function getContextMenuItems(el: Element): ContextMenuItem[] | null {
  const factory = registry.get(el);
  return factory ? factory() : null;
}

export function isNativeEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

export function mergeRefs<T = unknown>(
  ...refs: Array<Ref<T> | undefined | null>
): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref && "current" in ref) (ref as { current: T | null }).current = node;
    }
  };
}

export const CONTEXT_MENU_ATTR = "data-context-menu";
export const CONTEXT_MENU_OPT_OUT = "data-context-menu='none'";

export type ContextMenuTriggerProps<T extends ReactElement> = {
  items: ContextMenuItem[] | (() => ContextMenuItem[]);
  children: T;
};

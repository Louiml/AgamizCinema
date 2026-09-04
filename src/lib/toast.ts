/**
 * Tiny global toast bus. Decouples emit sites (watchlist toggle, copy, errors)
 * from the viewport that renders them — any module can call `toast()` without
 * a React context or prop drilling. The {@link ToastViewport} subscribes and
 * renders the stack; auto-dismiss is handled here so callers stay one-liners.
 */

import { Check, TriangleAlert, Info } from "lucide-react";
import type { ComponentType } from "react";

export type ToastTone = "default" | "success" | "error";

export interface ToastInput {
  message: string;
  tone?: ToastTone;
  icon?: ComponentType<{ className?: string }>;
  /** ms before auto-dismiss; 0 keeps it until dismissed. Defaults to 2800. */
  duration?: number;
}

/** A toast after it has been enqueued (id assigned). */
export interface Toast extends ToastInput {
  id: number;
}

let counter = 0;
let toasts: Toast[] = [];
const listeners = new Set<(t: Toast[]) => void>();

function emit() {
  for (const l of listeners) l(toasts);
}

export function toast(input: ToastInput): number {
  const id = ++counter;
  const tone = input.tone ?? "default";
  const icon =
    input.icon ?? (tone === "success" ? Check : tone === "error" ? TriangleAlert : Info);
  const next: Toast = { id, ...input, tone, icon };
  toasts = [...toasts, next];
  emit();

  const duration = input.duration ?? 2800;
  if (duration > 0) {
    window.setTimeout(() => dismiss(id), duration);
  }
  return id;
}

export function dismiss(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribe(listener: (t: Toast[]) => void): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

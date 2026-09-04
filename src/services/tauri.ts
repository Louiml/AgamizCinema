/**
 * Thin bridge over the Rust (Tauri) backend commands. Detects the Tauri
 * runtime at runtime and exposes safe helpers so the rest of the app can stay
 * framework-agnostic. All callers must guard for the browser-only fallback.
 */

export const isTauri = (): boolean => "__TAURI_INTERNALS__" in window;

export async function runInTauri<T>(
  command: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!isTauri()) {
    throw new Error("Tauri runtime is not available in this environment.");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

/**
 * Local persistence layer. When running inside the Tauri shell, reads/writes
 * are routed through the Rust backend (JSON files in the app data dir) for a
 * durable, sandboxed store. In the plain browser it falls back to localStorage.
 */

const BACKEND_STORE = "__agamiz_backend";

export async function readStore<T>(key: string, fallback: T): Promise<T> {
  if ("__TAURI_INTERNALS__" in window) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const res = await invoke<unknown>(BACKEND_STORE, { op: "read", key });
      return res === null || res === undefined ? fallback : (res as T);
    } catch (err) {
      console.warn("[storage] backend read failed, using localStorage.", err);
    }
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeStore<T>(key: string, value: T): Promise<void> {
  if ("__TAURI_INTERNALS__" in window) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke(BACKEND_STORE, { op: "write", key, value });
      return;
    } catch (err) {
      console.warn("[storage] backend write failed, using localStorage.", err);
    }
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export async function clearStore(key: string): Promise<void> {
  if ("__TAURI_INTERNALS__" in window) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke(BACKEND_STORE, { op: "clear", key });
      return;
    } catch (err) {
      console.warn("[storage] backend clear failed, using localStorage.", err);
    }
  }
  localStorage.removeItem(key);
}

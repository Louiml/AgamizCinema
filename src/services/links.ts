import { isTauri } from "@/services/tauri";

/**
 * Opens a URL in the user's default browser. Uses the Tauri opener plugin when
 * running inside the desktop shell, otherwise falls back to a new browser tab.
 */
export async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
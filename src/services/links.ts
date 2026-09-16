import { isTauri } from "@/services/tauri";

/**
 * Opens a URL in the user's default browser. Uses the Tauri opener plugin when
 * running inside the desktop shell, otherwise falls back to a new browser tab
 * (with a synthetic anchor-click fallback if window.open is blocked).
 */
export async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
    return;
  }
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
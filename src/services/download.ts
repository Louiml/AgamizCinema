import { isTauri, runInTauri } from "@/services/tauri";

/**
 * Download helpers.
 *
 * The embed sources don't hand out direct .mp4/.m3u8 URLs (Turnstile-protected,
 * encrypted), so the app can't fetch a file itself. Instead:
 *  - Desktop (Tauri): opens the chosen source's embed in a dedicated window
 *    with a download hook. If the source's player fires a real download, the
 *    hook routes the file into the folder set in Settings.
 *  - Web / mobile browser: opens the source's embed in a new tab so the user
 *    can use the source's own save/offline option.
 */

export interface DownloadWindowOptions {
  /** The embed URL to load (built from the user's selected source). */
  url: string;
  title: string;
  season?: number;
  episode?: number;
}

export interface DownloadFinishedPayload {
  url: string;
  path: string | null;
  success: boolean;
}

export const downloadSupported = (): boolean => isTauri();

/** Web/mobile: open the source's embed in a new tab. Synchronous so popup
 *  blockers don't kill it (must run inside the click handler). */
export function openInSource(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Desktop: opens (or focuses) a download window for a movie / TV episode. */
export async function openDownloadWindow(
  opts: DownloadWindowOptions,
): Promise<string> {
  return runInTauri<string>("open_download_window", {
    url: opts.url,
    title: opts.title,
    season: opts.season,
    episode: opts.episode,
  });
}

/** Keeps the Rust download hook in sync with the setting value. */
export async function syncDownloadPath(path: string): Promise<void> {
  await runInTauri("set_download_path", { path });
}

/** The OS default Downloads folder (used when no custom path is set). */
export async function getDefaultDownloadDir(): Promise<string> {
  return runInTauri<string>("get_default_download_dir", {});
}

/** Reveals a folder in the OS file manager. */
export async function openDownloadFolder(path: string): Promise<void> {
  await runInTauri("open_download_folder", { path });
}

/** Native "pick a folder" dialog. Returns null when cancelled. */
export async function pickDownloadFolder(): Promise<string | null> {
  if (!isTauri()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  const picked = await open({ directory: true, title: "Choose downloads folder" });
  return typeof picked === "string" && picked.trim() ? picked : null;
}

/** Subscribes to download lifecycle events emitted by the Rust backend. */
export async function onDownloadFinished(
  handler: (payload: DownloadFinishedPayload) => void,
): Promise<() => void> {
  const { listen } = await import("@tauri-apps/api/event");
  return listen<DownloadFinishedPayload>("download://finished", (event) =>
    handler(event.payload),
  );
}

/** Subscribes to download errors emitted by the Rust backend. */
export async function onDownloadError(
  handler: (payload: { url: string; error: string }) => void,
): Promise<() => void> {
  const { listen } = await import("@tauri-apps/api/event");
  return listen<{ url: string; error: string }>("download://error", (event) =>
    handler(event.payload),
  );
}

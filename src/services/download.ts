import { isTauri, runInTauri } from "@/services/tauri";
import type { MediaType } from "@/types/tmdb";

/**
 * Desktop download helpers.
 *
 * vidsync.live hands out its streams through a Turnstile-protected, encrypted
 * API, so the app can't produce direct .mp4/.m3u8 URLs. Instead the Rust
 * backend hosts a compact download window with the vidsync player for the
 * title, and a download hook on every window routes any download that starts
 * inside the app (including the player's own download option) into the folder
 * configured in Settings. These helpers drive that flow.
 */

export interface DownloadWindowOptions {
  tmdbId: number;
  mediaType: MediaType;
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

/** Opens (or focuses) a download window for a movie / TV episode. */
export async function openDownloadWindow(
  opts: DownloadWindowOptions,
): Promise<string> {
  return runInTauri<string>("open_download_window", {
    tmdbId: opts.tmdbId,
    mediaType: opts.mediaType,
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

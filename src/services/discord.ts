import { isTauri, runInTauri } from "@/services/tauri";
import type { MediaType } from "@/types/tmdb";

export interface DiscordPresence {
  title: string;
  mediaType: MediaType;
  season?: number;
  episode?: number;
}

export async function setDiscordPresence(
  presence: DiscordPresence | null,
): Promise<void> {
  if (!isTauri()) return;
  try {
    await runInTauri("set_discord_presence", { presence });
  } catch {
  }
}

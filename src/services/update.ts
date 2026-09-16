import { isTauri } from "@/services/tauri";
import { openExternal } from "@/services/links";
import pkg from "../../package.json";

const REPO = "Louiml/AgamizCinema";
const APP_VERSION = pkg.version;

export interface LatestRelease {
  tag: string;
  url: string;
  notes: string;
}

function parseVersion(v: string): number[] {
  return v
    .replace(/^v/, "")
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
}

/** True when `tag` (e.g. "v2.1.0") is strictly newer than `current`. */
export function isNewer(tag: string, current: string): boolean {
  const a = parseVersion(tag);
  const b = parseVersion(current);
  for (let i = 0; i < 3; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

/**
 * Checks GitHub for a release newer than the running app (desktop only -
 * the web build is always whatever is deployed). Returns null when up to
 * date, on non-desktop, or when the check fails (never throws).
 */
export async function checkUpdate(): Promise<LatestRelease | null> {
  if (!isTauri()) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      tag_name?: string;
      html_url?: string;
      body?: string;
    };
    const tag = data.tag_name;
    if (!tag || !isNewer(tag, APP_VERSION)) return null;
    return {
      tag,
      url: data.html_url ?? `https://github.com/${REPO}/releases/latest`,
      notes: (data.body ?? "").slice(0, 600),
    };
  } catch {
    return null;
  }
}

/** Opens the release download page in the system browser. */
export function downloadUpdate(release: LatestRelease): void {
  void openExternal(release.url);
}

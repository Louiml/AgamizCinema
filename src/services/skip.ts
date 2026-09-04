/**
 * Skip-segment data layer (AniSkip / SponsorBlock + local cache).
 *
 * - AniSkip: community-verified anime openings/recaps/endings keyed by a
 *   MyAnimeList id + episode number.
 * - SponsorBlock: crowdsourced segment timestamps for YouTube-style video ids
 *   (intros/outros are mapped from its categories).
 * - Local cache: every resolved (and any user-defined) segment is persisted in
 *   `localStorage` under `agamiz:skip-segments`, keyed by media + episode, so
 *   repeated plays are instant and offline-safe.
 */

export type SkipKind = "intro" | "outro" | "recap";

export interface SkipSegment {
  start: number;
  end: number;
  kind: SkipKind;
  source: "aniskip" | "sponsorblock" | "custom";
}

const CACHE_KEY = "agamiz:skip-segments";

/** Cache shape: `{ [mediaKey]: { [episodeKey]: SkipSegment[] } }`. */
type SkipCache = Record<string, Record<string, SkipSegment[]>>;

function episodeKey(episode?: number): string {
  return episode !== undefined ? String(episode) : "movie";
}

function readCache(): SkipCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as SkipCache) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: SkipCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage full / unavailable — skip silently */
  }
}

/** Returns cached segments for a media + episode (never throws). */
export function getCachedSkip(mediaKey: string, episode?: number): SkipSegment[] {
  return readCache()[mediaKey]?.[episodeKey(episode)] ?? [];
}

/** Overwrites the cached segments for a media + episode. */
export function cacheSkip(mediaKey: string, episode: number | undefined, segments: SkipSegment[]): void {
  const cache = readCache();
  cache[mediaKey] = { ...cache[mediaKey], [episodeKey(episode)]: segments };
  writeCache(cache);
}

/**
 * Adds or replaces a user-defined segment (e.g. "mark intro start/end").
 * Custom segments shadow API-provided ones for the same kind.
 */
export function upsertCustomSkip(
  mediaKey: string,
  episode: number | undefined,
  seg: SkipSegment,
): void {
  const segments = getCachedSkip(mediaKey, episode).filter(
    (s) => !(s.kind === seg.kind && s.source === "custom"),
  );
  cacheSkip(mediaKey, episode, [...segments, seg]);
}

/** Removes all segments (or only a specific episode's) for a media. */
export function clearSkip(mediaKey: string, episode?: number): void {
  const cache = readCache();
  if (episode !== undefined) {
    if (cache[mediaKey]) delete cache[mediaKey][episodeKey(episode)];
  } else {
    delete cache[mediaKey];
  }
  writeCache(cache);
}

export async function fetchAniSkipSegments(
  malId: number,
  episode: number,
  signal?: AbortSignal,
): Promise<SkipSegment[]> {
  const url = `https://api.aniskip.com/v2/override/${malId}?episode=${episode}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    found?: boolean;
    results?: Array<{
      skipTimes?: {
        intro?: { start?: number; end?: number };
        recap?: { start?: number; end?: number };
        outro?: { start?: number; end?: number };
      };
    }>;
  };
  if (json.found !== true || !Array.isArray(json.results) || json.results.length === 0) {
    return [];
  }
  const skipTimes = json.results[0]?.skipTimes ?? {};
  const out: SkipSegment[] = [];
  const push = (kind: SkipKind, st?: { start?: number; end?: number }) => {
    if (st && typeof st.start === "number" && typeof st.end === "number" && st.end > st.start) {
      out.push({ kind, start: st.start, end: st.end, source: "aniskip" });
    }
  };
  push("intro", skipTimes.intro);
  push("recap", skipTimes.recap);
  push("outro", skipTimes.outro);
  return out;
}

/**
 * SponsorBlock — https://sponsor.ajay.app/api/skipSegments?videoID=…
 * Only intro/outro categories map to skip kinds; everything else is ignored.
 */
export async function fetchSponsorBlockSegments(
  videoId: string,
  signal?: AbortSignal,
): Promise<SkipSegment[]> {
  const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(videoId)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as Array<{
    start?: number;
    end?: number;
    category?: string;
  }>;
  if (!Array.isArray(json)) return [];
  const out: SkipSegment[] = [];
  for (const seg of json) {
    if (typeof seg.start !== "number" || typeof seg.end !== "number" || seg.end <= seg.start) continue;
    if (seg.category !== "intro" && seg.category !== "outro") continue;
    out.push({
      kind: seg.category,
      start: seg.start,
      end: seg.end,
      source: "sponsorblock",
    });
  }
  return out;
}

export interface SkipResolveInput {
  /** Stable media key, e.g. `movie:123` or `tv:123:1:2`. */
  mediaKey: string;
  episode?: number;
  /** MyAnimeList id — enables AniSkip lookups (anime). */
  malId?: number;
  /** YouTube-style video id — enables SponsorBlock lookups. */
  videoId?: string;
  /** Bypass the cache and hit the network again. */
  refresh?: boolean;
}

export async function loadSkipSegments(
  input: SkipResolveInput,
  signal?: AbortSignal,
): Promise<SkipSegment[]> {
  const cached = getCachedSkip(input.mediaKey, input.episode);
  const results: SkipSegment[] = [...cached];
  const seen = new Set(cached.map((s) => `${s.kind}:${s.start}:${s.end}`));

  const pushUnique = (seg: SkipSegment) => {
    const key = `${seg.kind}:${seg.start}:${seg.end}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(seg);
    }
  };

  if (input.malId) {
    for (const seg of await fetchAniSkipSegments(input.malId, input.episode ?? 1, signal)) {
      pushUnique(seg);
    }
  }
  if (input.videoId) {
    for (const seg of await fetchSponsorBlockSegments(input.videoId, signal)) {
      pushUnique(seg);
    }
  }

  results.sort((a, b) => a.start - b.start);

  if (input.malId || input.videoId || results.length) {
    cacheSkip(input.mediaKey, input.episode, results);
  }
  return results;
}

export function findSkipSegmentAt(segments: SkipSegment[], time: number): SkipSegment | null {
  return segments.find((s) => time >= s.start && time < s.end) ?? null;
}

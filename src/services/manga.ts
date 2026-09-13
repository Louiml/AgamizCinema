import { isTauri, runInTauri } from "@/services/tauri";

/**
 * MangaDex client. MangaDex sends no CORS headers and blocks hotlinked images
 * from its own domains, so on desktop everything goes through the Rust proxy:
 *  - API JSON via the `manga_proxy` invoke command.
 *  - Cover and chapter-page images via the `mdximg://` URI scheme.
 *
 * The web build has no backend, so the service throws `desktopOnly` outside
 * Tauri; callers gate the UI on `mangaSupported()`.
 */

const API = "https://api.mangadex.org";

/** Content ratings we serve. MangaDex policy: we keep it family-friendly. */
const CONTENT_RATINGS = ["safe", "suggestive"] as const;

export class MangaError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "MangaError";
  }
}

export interface MangaTag {
  id: string;
  name: string;
  group: string;
}

export interface MangaSummary {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  status: string;
  year: number | null;
  contentRating: string;
  coverUrl: string | null;
  follows: number;
  rating: number;
  tags: MangaTag[];
  availableLanguages: string[];
  author: string | null;
  artist: string | null;
  links: Record<string, string> | null;
}

export interface MangaChapter {
  id: string;
  volume: string | null;
  chapter: string | null;
  title: string;
  language: string;
  pages: number;
  readableAt: string;
  group: string | null;
  mangaId: string;
}

export interface ChapterPages {
  baseUrl: string;
  hash: string;
  files: string[];
  filesSaver: string[];
}

interface MdEntity {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Array<{ id: string; type: string; attributes?: Record<string, unknown> }>;
}

interface MdCollection {
  result: string;
  data: MdEntity[];
  limit: number;
  offset: number;
  total: number;
}

function pickLocalized(map: Record<string, string> | undefined, langs: string[]): string {
  if (!map) return "";
  for (const l of langs) {
    const v = map[l];
    if (v) return v;
  }
  const en = map.en;
  if (en) return en;
  const first = Object.values(map)[0];
  return first ?? "";
}

function related(entity: MdEntity, type: string): MdEntity | undefined {
  return entity.relationships?.find((r) => r.type === type);
}

function coverFileName(entity: MdEntity): string | null {
  const c = related(entity, "cover_art");
  return (c?.attributes?.fileName as string) ?? null;
}

export function mangaSupported(): boolean {
  return isTauri();
}

async function mangaFetch<T>(path: string, params: Record<string, string | number | string[] | undefined>): Promise<T> {
  if (!isTauri()) throw new MangaError("desktopOnly");
  const url = new URL(`${API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, String(v));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await runInTauri<{ ok: boolean; status?: number; data?: T }>("manga_proxy", {
    url: url.toString(),
  });
  if (!res.ok || res.data === undefined) {
    throw new MangaError("MangaDex request failed", res.status);
  }
  return res.data;
}

export function coverUrl(mangaId: string, fileName: string): string {
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
}

export function pageUrl(baseUrl: string, hash: string, file: string, dataSaver = false): string {
  const seg = dataSaver ? "data-saver" : "data";
  return `${baseUrl}/${seg}/${hash}/${file}`;
}

function toSummary(entity: MdEntity, langs: string[]): MangaSummary {
  const a = entity.attributes as Record<string, unknown>;
  const titleMap = a.title as Record<string, string> | undefined;
  const altTitles = (a.altTitles as Array<Record<string, string>> | undefined)?.map((t) =>
    pickLocalized(t, langs),
  ).filter(Boolean) ?? [];
  const descMap = a.description as Record<string, string> | undefined;
  const tags: MangaTag[] = (a.tags as MdEntity[] | undefined)?.map((t) => ({
    id: t.id,
    name: pickLocalized(t.attributes?.name as Record<string, string>, ["en"]),
    group: (t.attributes?.group as string) ?? "theme",
  })) ?? [];
  const fname = coverFileName(entity);
  const author = related(entity, "author");
  const artist = related(entity, "artist");
  const ratingObj = a.rating as Record<string, unknown> | undefined;
  return {
    id: entity.id,
    title: pickLocalized(titleMap, langs),
    altTitles,
    description: pickLocalized(descMap, langs),
    status: (a.status as string) ?? "",
    year: (a.year as number | null) ?? null,
    contentRating: (a.contentRating as string) ?? "safe",
    coverUrl: fname ? coverUrl(entity.id, fname) : null,
    follows: (a.followedCount as number) ?? 0,
    rating: ratingObj?.bayesian != null ? Number((ratingObj.bayesian as number).toFixed(1)) : 0,
    tags,
    availableLanguages: (a.availableTranslatedLanguages as string[]) ?? [],
    author: author ? pickLocalized(author.attributes?.name as Record<string, string>, ["en"]) : null,
    artist: artist ? pickLocalized(artist.attributes?.name as Record<string, string>, ["en"]) : null,
    links: (a.links as Record<string, string> | null) ?? null,
  };
}

function toChapter(entity: MdEntity): MangaChapter {
  const a = entity.attributes as Record<string, unknown>;
  const group = related(entity, "scanlation_group");
  const manga = related(entity, "manga");
  return {
    id: entity.id,
    volume: (a.volume as string) ?? null,
    chapter: (a.chapter as string) ?? null,
    title: (a.title as string) ?? "",
    language: (a.translatedLanguage as string) ?? "en",
    pages: (a.pages as number) ?? 0,
    readableAt: (a.readableAt as string) ?? "",
    group: group ? pickLocalized(group.attributes?.name as Record<string, string>, ["en"]) : null,
    mangaId: manga?.id ?? "",
  };
}

export async function searchManga(opts: {
  title?: string;
  tagIds?: string[];
  status?: string;
  order?: string;
  limit?: number;
  offset?: number;
  langs: string[];
}): Promise<{ results: MangaSummary[]; total: number }> {
  const order = opts.order ?? "followedCount";
  const res = await mangaFetch<MdCollection>("/manga", {
    title: opts.title,
    "includedTags[]": opts.tagIds,
    "status[]": opts.status ? [opts.status] : undefined,
    "contentRating[]": [...CONTENT_RATINGS],
    "order[followedCount]": order === "followedCount" ? "desc" : undefined,
    "order[rating]": order === "rating" ? "desc" : undefined,
    "order[year]": order === "year" ? "desc" : undefined,
    "order[latestUploadedChapter]": order === "latest" ? "desc" : undefined,
    "includes[]": "cover_art",
    limit: opts.limit ?? 24,
    offset: opts.offset ?? 0,
  });
  return {
    results: res.data.map((e) => toSummary(e, opts.langs)),
    total: res.total,
  };
}

export async function getManga(id: string, langs: string[]): Promise<MangaSummary> {
  const res = await mangaFetch<{ data: MdEntity }>("/manga/" + id, {
    "includes[]": ["author", "artist", "cover_art"],
  });
  return toSummary(res.data, langs);
}

export async function mangaFeed(id: string, langs: string[]): Promise<MangaChapter[]> {
  const translated = Array.from(new Set(["en", ...langs]));
  const res = await mangaFetch<MdCollection>(`/manga/${id}/feed`, {
    "translatedLanguage[]": translated,
    "order[chapter]": "asc",
    "contentRating[]": [...CONTENT_RATINGS],
    "includes[]": "scanlation_group",
    limit: 200,
    offset: 0,
  });
  return res.data
    .map(toChapter)
    .filter((c) => c.pages > 0)
    .sort((a, b) => {
      const an = parseFloat(a.chapter ?? "0");
      const bn = parseFloat(b.chapter ?? "0");
      return an - bn;
    });
}

export async function chapterPages(chapterId: string): Promise<ChapterPages> {
  const res = await mangaFetch<{ baseUrl: string; chapter: { hash: string; data: string[]; dataSaver: string[] } }>(
    "/at-home/server/" + chapterId,
    {},
  );
  return {
    baseUrl: res.baseUrl,
    hash: res.chapter.hash,
    files: res.chapter.data,
    filesSaver: res.chapter.dataSaver,
  };
}

let tagCache: MangaTag[] | null = null;
export async function mangaTags(): Promise<MangaTag[]> {
  if (tagCache) return tagCache;
  const res = await mangaFetch<{ data: MdEntity[] }>("/manga/tag", {});
  const groupFilter = new Set(["genre", "theme", "content"]);
  tagCache = res.data
    .map((t) => ({
      id: t.id,
      name: pickLocalized(t.attributes?.name as Record<string, string>, ["en"]),
      group: (t.attributes?.group as string) ?? "theme",
    }))
    .filter((t) => groupFilter.has(t.group))
    .sort((a, b) => a.name.localeCompare(b.name));
  return tagCache;
}

/** MangaDex language code for an interface language (en/he/ru/de/ar/it). */
export function mangaLangFor(lang: string): string {
  return lang.toLowerCase().slice(0, 2);
}

// MangaDex API client (SFW only)
// Docs: https://api.mangadex.org/docs/

// Use same-origin API/image proxies so reading stays inside the app
const API = "/api/mangadex";
const IMAGE_PROXY = "/api/image?url=";

function proxiedImage(url: string): string {
  return `${IMAGE_PROXY}${encodeURIComponent(url)}`;
}

// Strict SFW: only "safe" content rating, exclude all suggestive/erotica/porn
const SFW_PARAMS = "contentRating[]=safe";

export type Manga = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  status: string;
  year: number | null;
  tags: string[];
  contentRating: string;
};

export type Chapter = {
  id: string;
  chapter: string | null;
  title: string | null;
  language: string;
  pages: number;
  publishAt: string;
  scanlator: string;
};

function pickTitle(attr: any): string {
  const t = attr.title ?? {};
  return t.en ?? t["ja-ro"] ?? t.ja ?? Object.values(t)[0] ?? "Untitled";
}

function pickDescription(attr: any): string {
  const d = attr.description ?? {};
  return d.en ?? Object.values(d)[0] ?? "";
}

function getCoverUrl(manga: any): string {
  const cover = manga.relationships?.find((r: any) => r.type === "cover_art");
  const fileName = cover?.attributes?.fileName;
  if (!fileName) return "";
  return proxiedImage(`https://uploads.mangadex.org/covers/${manga.id}/${fileName}.512.jpg`);
}

function mapManga(m: any): Manga {
  const a = m.attributes;
  return {
    id: m.id,
    title: pickTitle(a),
    description: pickDescription(a),
    coverUrl: getCoverUrl(m),
    status: a.status,
    year: a.year,
    tags: (a.tags ?? []).map((t: any) => t.attributes?.name?.en).filter(Boolean),
    contentRating: a.contentRating,
  };
}

export async function getPopular(limit = 24): Promise<Manga[]> {
  const url = `${API}/manga?${SFW_PARAMS}&limit=${limit}&order[followedCount]=desc&includes[]=cover_art&hasAvailableChapters=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch popular manga");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getRecentlyUpdated(limit = 18): Promise<Manga[]> {
  const url = `${API}/manga?${SFW_PARAMS}&limit=${limit}&order[latestUploadedChapter]=desc&includes[]=cover_art&hasAvailableChapters=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch recent manga");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function searchManga(query: string, limit = 30): Promise<Manga[]> {
  const url = `${API}/manga?${SFW_PARAMS}&limit=${limit}&title=${encodeURIComponent(query)}&includes[]=cover_art&order[relevance]=desc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getManga(id: string): Promise<Manga> {
  const url = `${API}/manga/${id}?includes[]=cover_art`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Manga not found");
  const json = await res.json();
  return mapManga(json.data);
}

export async function getChapters(mangaId: string, limit = 100): Promise<Chapter[]> {
  const url = `${API}/manga/${mangaId}/feed?limit=${limit}&translatedLanguage[]=en&order[chapter]=asc&${SFW_PARAMS}&includes[]=scanlation_group&includeExternalUrl=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load chapters");
  const json = await res.json();
  return json.data
    .map((c: any) => {
      const a = c.attributes;
      const sg = c.relationships?.find((r: any) => r.type === "scanlation_group");
      return {
        id: c.id,
        chapter: a.chapter,
        title: a.title,
        language: a.translatedLanguage,
        pages: a.pages,
        publishAt: a.publishAt,
        scanlator: sg?.attributes?.name ?? "Unknown",
        externalUrl: a.externalUrl ?? null,
      };
    })
    .filter((c: any) => c.pages > 0 && !c.externalUrl);
}

export async function getChapterPages(chapterId: string): Promise<{ urls: string[]; chapterId: string }> {
  const res = await fetch(`${API}/at-home/server/${chapterId}`);
  if (!res.ok) throw new Error("Failed to load chapter pages");
  const json = await res.json();
  const base = json.baseUrl;
  const hash = json.chapter.hash;
  const files: string[] = json.chapter.data;
  return {
    chapterId,
    urls: files.map((f) => proxiedImage(`${base}/data/${hash}/${f}`)),
  };
}

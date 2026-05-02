// MangaDex API client (SFW only)
// Docs: https://api.mangadex.org/docs/

// Use same-origin image proxy so reading stays inside the app
const API = "https://api.mangadex.org";
const IMAGE_PROXY = "/api/image?url=";

function proxiedImage(url: string): string {
  return `${IMAGE_PROXY}${encodeURIComponent(url)}`;
}

// Strict SFW: only "safe" content rating, exclude all suggestive/erotica/porn
const SFW_PARAMS = "contentRating[]=safe";
const NSFW_PARAMS = "contentRating[]=erotica&contentRating[]=pornographic";

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

// Common genre tag UUIDs from MangaDex
export const GENRE_TAGS: Record<string, string> = {
  Action: "391b0423-d847-456f-aff0-8b0cfc03066b",
  Adventure: "87cc87cd-a395-47af-b27a-93258283bbc6",
  Comedy: "4d32cc48-9f00-4cca-9b5a-a839f0764984",
  Drama: "b9af3a63-f058-46de-a9a0-e0c13906197a",
  Fantasy: "cdc58593-87dd-415e-bbc0-2ec27bf404cc",
  Horror: "cdad7e68-1419-41dd-bdce-27753074a640",
  Mystery: "ee968100-4191-4968-93d3-f82d72be7e46",
  Romance: "423e2eae-a7a2-4a8b-ac03-a8351462d71d",
  "Sci-Fi": "256c8bd9-4904-4360-bf4f-508a76d67183",
  "Slice of Life": "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
  Sports: "69964a64-2f90-4d33-beeb-f3ed2875eb4c",
  Supernatural: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
  Thriller: "07251805-a27e-4d59-b488-f0bfbec15168",
  Historical: "33771934-028e-4cb3-8744-691e866a923e",
};

export const LANGUAGES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  "es-la": "Spanish (LATAM)",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  "pt-br": "Portuguese (BR)",
  ru: "Russian",
  id: "Indonesian",
  vi: "Vietnamese",
  th: "Thai",
  tr: "Turkish",
  ar: "Arabic",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  "zh-hk": "Chinese (HK)",
};

function buildFilterParams(genres?: string[], language?: string): string {
  const parts: string[] = [];
  if (genres && genres.length) {
    for (const g of genres) {
      const id = GENRE_TAGS[g];
      if (id) parts.push(`includedTags[]=${id}`);
    }
    parts.push("includedTagsMode=OR");
  }
  if (language) parts.push(`availableTranslatedLanguage[]=${language}`);
  return parts.join("&");
}

export async function getPopular(limit = 24, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const url = `${API}/manga?${SFW_PARAMS}&limit=${limit}&order[followedCount]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch popular manga");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getRecentlyUpdated(limit = 18, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const url = `${API}/manga?${SFW_PARAMS}&limit=${limit}&order[latestUploadedChapter]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch recent manga");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getTopRated(limit = 18, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const url = `${API}/manga?${SFW_PARAMS}&limit=${limit}&order[rating]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch top rated manga");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getNewReleases(limit = 18, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const url = `${API}/manga?${SFW_PARAMS}&limit=${limit}&order[createdAt]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch new releases");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getByGenre(genre: string, limit = 12, language?: string): Promise<Manga[]> {
  const filters = buildFilterParams([genre], language);
  const url = `${API}/manga?${SFW_PARAMS}&limit=${limit}&order[followedCount]=desc&includes[]=cover_art&hasAvailableChapters=true&${filters}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${genre} manga`);
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

export async function getMatureContent(limit = 24, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const url = `${API}/manga?${NSFW_PARAMS}&limit=${limit}&order[followedCount]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch mature content");
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

export async function getChapters(mangaId: string, limit = 200, language?: string): Promise<Chapter[]> {
  const langParam = language ? `&translatedLanguage[]=${language}` : "";
  const url = `${API}/manga/${mangaId}/feed?limit=${limit}${langParam}&order[chapter]=asc&${SFW_PARAMS}&includes[]=scanlation_group&includeExternalUrl=0`;
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

export async function getAvailableLanguages(mangaId: string): Promise<string[]> {
  const url = `${API}/manga/${mangaId}?includes[]=cover_art`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.attributes?.availableTranslatedLanguages ?? [];
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

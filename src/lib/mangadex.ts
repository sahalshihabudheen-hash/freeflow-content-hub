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
const NSFW_PARAMS = "contentRating[]=erotica&contentRating[]=pornographic&availableTranslatedLanguage[]=en";
const ALL_CONTENT_PARAMS = "contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic";
const MOTION_COMIC_TAG = "32fd93a2-7e01-49c3-9b1a-02e03071835e";

export type Manga = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  status: string;
  year: number | null;
  tags: string[];
  contentRating: string;
  lastChapter: string | null;
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
    lastChapter: a.lastChapter,
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
  "School Life": "caaa4430-df38-44c2-8059-43c09101019d",
  Gore: "b77146d9-f5c4-4615-872a-ae69fbcc81ce",
  "Sexual Violence": "9789f22c-7033-4041-9d18-971ef2863864",
  BDSM: "9466c479-8199-4795-870d-906cfedc900d",
  Incest: "5bd3376c-3dc0-4966-9e9b-986c75f560e9",
  Netorare: "2d1f5d5a-fa68-49d4-839c-76e93e231bc5",
  Doujinshi: "b13b2a48-c720-44a9-9c77-39c9979373fb",
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
    // MangaDex can fail with too many tags, limit to top 10
    const limitedGenres = genres.slice(0, 10);
    for (const g of limitedGenres) {
      const id = GENRE_TAGS[g];
      if (id) parts.push(`includedTags[]=${id}`);
    }
    parts.push("includedTagsMode=OR");
  }
  if (language) parts.push(`availableTranslatedLanguage[]=${language}`);
  return parts.join("&");
}

export async function getPopular(limit = 24, offset = 0, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const url = `${API}/manga?${ALL_CONTENT_PARAMS}&limit=${limit}&offset=${offset}&order[followedCount]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch popular manga");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getRecentlyUpdated(limit = 18, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const url = `${API}/manga?${ALL_CONTENT_PARAMS}&limit=${limit}&order[latestUploadedChapter]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch recent manga");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getTopRated(limit = 18, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const url = `${API}/manga?${ALL_CONTENT_PARAMS}&limit=${limit}&order[rating]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch top rated manga");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getNewReleases(limit = 18, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const url = `${API}/manga?${ALL_CONTENT_PARAMS}&limit=${limit}&order[createdAt]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch new releases");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getByGenre(genre: string, limit = 12, language?: string): Promise<Manga[]> {
  const filters = buildFilterParams([genre], language);
  const url = `${API}/manga?${ALL_CONTENT_PARAMS}&limit=${limit}&order[followedCount]=desc&includes[]=cover_art&hasAvailableChapters=true&${filters}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${genre} manga`);
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function searchManga(query: string, limit = 30, offset = 0): Promise<Manga[]> {
  const url = `${API}/manga?${ALL_CONTENT_PARAMS}&limit=${limit}&offset=${offset}&title=${encodeURIComponent(query)}&includes[]=cover_art&order[relevance]=desc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getMatureContent(limit = 24, offset = 0, genres?: string[], language?: string, originalLanguage?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  const origLangParam = originalLanguage ? `&originalLanguage[]=${originalLanguage}` : "";
  const url = `${API}/manga?${NSFW_PARAMS}&limit=${limit}&offset=${offset}&order[followedCount]=desc&includes[]=cover_art&hasAvailableChapters=true${origLangParam}${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch mature content");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getAnimatedComics(limit = 12, isAdult = false): Promise<Manga[]> {
  const params = isAdult ? NSFW_PARAMS : SFW_PARAMS;
  const url = `${API}/manga?${params}&limit=${limit}&includedTags[]=${MOTION_COMIC_TAG}&includes[]=cover_art&hasAvailableChapters=true&order[followedCount]=desc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch animated comics");
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

export async function getHentai(limit = 24, offset = 0, genres?: string[], language?: string): Promise<Manga[]> {
  const filters = buildFilterParams(genres, language);
  // Content rating 'pornographic' is what most people mean by Hentai on MangaDex
  const HENTAI_PARAMS = "contentRating[]=pornographic";
  const url = `${API}/manga?${HENTAI_PARAMS}&limit=${limit}&offset=${offset}&order[followedCount]=desc&includes[]=cover_art&hasAvailableChapters=true${filters ? `&${filters}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch hentai content");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getDoujinshi(limit = 24, offset = 0, language?: string): Promise<Manga[]> {
  const DOUJIN_TAG = "b13b2a48-c720-44a9-9c77-39c9979373fb";
  const langParam = language ? `&availableTranslatedLanguage[]=${language}` : "";
  const url = `${API}/manga?contentRating[]=erotica&contentRating[]=pornographic&includedTags[]=${DOUJIN_TAG}&limit=${limit}&offset=${offset}&order[followedCount]=desc&includes[]=cover_art&hasAvailableChapters=true${langParam}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch doujinshi content");
  const json = await res.json();
  return json.data.map(mapManga);
}

export async function getChapters(mangaId: string, _limit = 500, language?: string): Promise<Chapter[]> {
  const langParam = language ? `&translatedLanguage[]=${language}` : "";
  const PAGE_SIZE = 500; // MangaDex max per request
  let offset = 0;
  let allRaw: any[] = [];

  // Paginate until we have all chapters
  while (true) {
    const url = `${API}/manga/${mangaId}/feed?limit=${PAGE_SIZE}&offset=${offset}${langParam}&order[chapter]=asc&${ALL_CONTENT_PARAMS}&includes[]=scanlation_group`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load chapters");
    const json = await res.json();
    const batch: any[] = json.data ?? [];
    allRaw = allRaw.concat(batch);

    // If we got fewer results than PAGE_SIZE, we've reached the end
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;

    // Safety: don't loop more than 10 pages (5000 chapters)
    if (offset >= 5000) break;
  }

  const rawChapters = allRaw.map((c: any) => {
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
  });

  // Only drop chapters that have 0 pages AND no externalUrl AND no chapter number
  // (i.e. truly empty entries). Keep chapters with 0 pages if they have a chapter number —
  // MangaDex sometimes doesn't store page counts for all entries.
  const filtered = rawChapters.filter((c: any) => {
    if (c.externalUrl) return true;        // always keep external chapters
    if (c.pages > 0) return true;           // has pages, definitely valid
    if (c.chapter != null) return true;     // has a chapter number, keep it
    return false;                           // truly empty, drop it
  });

  // Deduplicate: for same chapter+language, prefer entry with most pages.
  // If pages are equal, prefer the one with an externalUrl (can always be opened).
  const uniqueMap = new Map<string, any>();
  for (const c of filtered) {
    const key = `${c.chapter}-${c.language}`;
    const existing = uniqueMap.get(key);
    if (!existing) {
      uniqueMap.set(key, c);
    } else if (c.pages > existing.pages) {
      uniqueMap.set(key, c);
    } else if (c.pages === existing.pages && c.externalUrl && !existing.externalUrl) {
      uniqueMap.set(key, c);
    }
  }

  let chapters = Array.from(uniqueMap.values()).sort((a, b) => {
    const aNum = parseFloat(a.chapter || "0");
    const bNum = parseFloat(b.chapter || "0");
    return aNum - bNum;
  });

  // Inject manhwaread chapters for Stepmother's Friends (English) as MangaDex is missing them
  if (mangaId === "e87483f7-3099-4594-a166-d9974b205d9a" && (!language || language === "en")) {
    try {
      const res = await fetch("/api/manhwaread?action=chapters&slug=my-stepmother-s-friends");
      if (res.ok) {
        const data = await res.json();
        if (data.chapters && data.chapters.length > 0) {
          const existingChaps = new Set(chapters.map(c => c.chapter));
          const missingChaps = data.chapters.filter((c: any) => !existingChaps.has(c.chapter));
          if (missingChaps.length > 0) {
            chapters = [...chapters, ...missingChaps].sort((a, b) => {
              const aNum = parseFloat(a.chapter || "0");
              const bNum = parseFloat(b.chapter || "0");
              return aNum - bNum;
            });
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load manhwaread fallback", e);
    }
  }

  return chapters;
}

export async function getAvailableLanguages(mangaId: string): Promise<string[]> {
  // Fetch all chapter entries (no lang filter) to count chapters per language
  // This lets us sort languages by how many chapters they have
  try {
    const res = await fetch(
      `${API}/manga/${mangaId}/feed?limit=500&order[chapter]=asc&${ALL_CONTENT_PARAMS}&includes[]=scanlation_group`
    );
    if (!res.ok) {
      // Fallback: just return availableTranslatedLanguages from manga metadata
      const mRes = await fetch(`${API}/manga/${mangaId}?includes[]=cover_art`);
      if (!mRes.ok) return [];
      const mJson = await mRes.json();
      return mJson.data?.attributes?.availableTranslatedLanguages ?? [];
    }
    const json = await res.json();
    const entries: any[] = json.data ?? [];

    // Count unique chapters per language
    const langChapterSets: Map<string, Set<string>> = new Map();
    for (const c of entries) {
      const lang = c.attributes?.translatedLanguage;
      const ch = c.attributes?.chapter;
      if (!lang || !ch) continue;
      if (!langChapterSets.has(lang)) langChapterSets.set(lang, new Set());
      langChapterSets.get(lang)!.add(ch);
    }

    // Sort by chapter count descending so the richest language comes first
    return Array.from(langChapterSets.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .map(([lang]) => lang);
  } catch {
    return [];
  }
}

export async function getChapterPages(chapterId: string): Promise<{ urls: string[]; chapterId: string }> {
  // Handle our custom manhwaread proxy chapters
  if (chapterId.startsWith('manhwaread-')) {
    const match = chapterId.match(/manhwaread-(.+)-([\d.]+)/);
    if (match) {
      const slug = match[1];
      const chapterNum = match[2];
      const res = await fetch(`/api/manhwaread?action=pages&slug=${slug}&chapter=${chapterNum}`);
      if (!res.ok) throw new Error("Failed to load manhwaread chapter pages");
      const json = await res.json();
      return {
        chapterId,
        urls: json.urls,
      };
    }
  }

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

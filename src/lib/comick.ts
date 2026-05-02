import type { Manga } from "./mangadex";

const API = "https://api.comick.dev";
const IMAGE_BASE = "https://meo.comick.pictures";

function mapComick(c: any): Manga {
  return {
    id: `comick-${c.slug || c.hid}`, // Prefix to distinguish from MangaDex UUIDs
    title: c.title ?? "Untitled",
    description: c.desc ?? "",
    coverUrl: c.md_covers && c.md_covers.length > 0 ? `${IMAGE_BASE}/${c.md_covers[0].b2key}` : "",
    status: c.status === 1 ? "ongoing" : c.status === 2 ? "completed" : "unknown",
    year: c.year ?? null,
    tags: (c.md_comic_md_genres ?? []).map((g: any) => g.md_genres?.name).filter(Boolean),
    contentRating: c.content_rating ?? "safe",
  };
}

export async function getComickAdult(limit = 24): Promise<Manga[]> {
  // Comick search for high rating adult/mature manhwa (webtoons)
  // genres: mature, smut, adult
  const url = `${API}/v1.0/search?type=comic&tachiyomi=true&limit=${limit}&genres=smut&sort=follow`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch Comick mature content");
  const json = await res.json();
  return json.map(mapComick);
}

export async function searchComick(query: string, limit = 24): Promise<Manga[]> {
  const url = `${API}/v1.0/search?q=${encodeURIComponent(query)}&limit=${limit}&tachiyomi=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed");
  const json = await res.json();
  return json.map(mapComick);
}

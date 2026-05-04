// Anime API client
// Proxies through /api/anime to avoid CORS and status 451 issues

const API = "/api/anime";

export interface Anime {
  id: string;
  title: string;
  image: string;
  type?: string;
  releaseDate?: string;
  totalEpisodes?: number;
}

export async function fetchJikanAdultAnime(page = 1): Promise<Anime[]> {
  const res = await fetch(`${API}/jikan/anime?genres=12&order_by=popularity&sort=desc&page=${page}`);
  if (!res.ok) throw new Error("Jikan fetch failed");
  const data = await res.json();
  return data.data.map((a: any) => ({
    id: a.mal_id.toString(),
    title: a.title,
    image: a.images.jpg.large_image_url,
    type: a.type,
    releaseDate: a.status,
    totalEpisodes: a.episodes
  }));
}

export async function searchJikan(query: string, page = 1): Promise<Anime[]> {
  const res = await fetch(`${API}/jikan/anime?q=${encodeURIComponent(query)}&genres=12&page=${page}`);
  if (!res.ok) throw new Error("Jikan search failed");
  const data = await res.json();
  return data.data.map((a: any) => ({
    id: a.mal_id.toString(),
    title: a.title,
    image: a.images.jpg.large_image_url,
    type: a.type,
    releaseDate: a.status,
    totalEpisodes: a.episodes
  }));
}

export type Episode = {
  id: string;
  number: number;
  url: string;
  title?: string;
};

export type AnimeDetails = Anime & {
  episodes: Episode[];
};

export type StreamingLink = {
  url: string;
  isM3U8: boolean;
  quality?: string;
};

export async function getAnimeInfo(id: string): Promise<AnimeDetails> {
  const res = await fetch(`${API}/jikan/anime/${id}/full`);
  if (!res.ok) throw new Error("Anime details not found");
  const data = await res.json();
  const a = data.data;
  
  // For streaming, we need to find the Consumet ID.
  // We'll search by title on Consumet.
  const searchRes = await fetch(`${API}/hentaihaven/${encodeURIComponent(a.title)}`);
  const searchData = await searchRes.json();
  const consumetId = searchData.results?.[0]?.id || a.title.toLowerCase().replace(/ /g, '-');

  return {
    id: a.mal_id.toString(),
    title: a.title,
    image: a.images.jpg.large_image_url,
    description: a.synopsis,
    genres: a.genres.map((g: any) => g.name),
    status: a.status,
    releaseDate: a.aired.string,
    type: a.type,
    episodes: Array.from({ length: a.episodes || 1 }).map((_, i) => ({
      id: `${consumetId}-episode-${i + 1}`,
      number: i + 1,
      title: `Episode ${i + 1}`
    }))
  };
}

export async function getEpisodeSources(episodeId: string): Promise<StreamingLink[]> {
  const res = await fetch(`${API}/hentaihaven/watch/${episodeId}`);
  if (!res.ok) throw new Error("Failed to load episode sources");
  const data = await res.json();
  return data.sources || [];
}

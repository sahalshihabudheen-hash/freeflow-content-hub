
// Anime API client
// Proxies through /api/anime to avoid CORS and status 451 issues

const API = "/api/anime";

export type Anime = {
  id: string;
  title: string;
  image: string;
  url?: string;
  genres?: string[];
  status?: string;
  releaseDate?: string;
  description?: string;
  totalEpisodes?: number;
  type?: string;
};

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

export async function getTrendingAnime(page = 1): Promise<Anime[]> {
  const res = await fetch(`${API}/hentaihaven/top-airing?page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch trending anime");
  const data = await res.json();
  return data.results || [];
}

export async function getRecentEpisodes(page = 1): Promise<Anime[]> {
  const res = await fetch(`${API}/hentaihaven/recent-episodes?page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch recent episodes");
  const data = await res.json();
  return data.results || [];
}

export async function searchAnime(query: string, page = 1): Promise<Anime[]> {
  const res = await fetch(`${API}/hentaihaven/${encodeURIComponent(query)}?page=${page}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.results || [];
}

export async function getAnimeInfo(id: string): Promise<AnimeDetails> {
  const res = await fetch(`${API}/hentaihaven/info/${id}`);
  if (!res.ok) throw new Error("Anime not found");
  return await res.json();
}

export async function getEpisodeSources(episodeId: string): Promise<StreamingLink[]> {
  const res = await fetch(`${API}/hentaihaven/watch/${episodeId}`);
  if (!res.ok) throw new Error("Failed to load episode sources");
  const data = await res.json();
  return data.sources || [];
}

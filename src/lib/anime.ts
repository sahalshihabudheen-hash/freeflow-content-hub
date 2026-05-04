
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

// We now use AniList for metadata, but we still need this for streaming info
export async function getAnimeInfo(id: string): Promise<AnimeDetails> {
  const res = await fetch(`${API}/meta/anilist/info/${id}`);
  if (!res.ok) throw new Error("Anime not found");
  return await res.json();
}

export async function getEpisodeSources(episodeId: string): Promise<StreamingLink[]> {
  const res = await fetch(`${API}/meta/anilist/watch/${episodeId}`);
  if (!res.ok) throw new Error("Failed to load episode sources");
  const data = await res.json();
  return data.sources || [];
}

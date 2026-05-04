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
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?genres=12&order_by=popularity&sort=desc&page=${page}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) {
        return data.data.map((a: any) => ({
          id: a.mal_id.toString(),
          title: a.title,
          image: a.images.jpg.large_image_url,
          type: a.type,
          releaseDate: a.status,
          totalEpisodes: a.episodes
        }));
      }
    }
  } catch (e) {
    console.error("Jikan failed, trying AniList fallback...", e);
  }

  // Fallback to AniList
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(type: ANIME, isAdult: true, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { large }
          format
          status
          episodes
        }
      }
    }
  `;
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { page } })
    });
    const data = await res.json();
    return data.data.Page.media.map((a: any) => ({
      id: a.id.toString(),
      title: a.title.english || a.title.romaji,
      image: a.coverImage.large,
      type: a.format,
      releaseDate: a.status,
      totalEpisodes: a.episodes
    }));
  } catch (e) {
    console.error("AniList fallback failed too.", e);
    return [];
  }
}

export async function searchJikan(query: string, page = 1): Promise<Anime[]> {
  // Similar fallback logic for search
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&genres=12&page=${page}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) {
        return data.data.map((a: any) => ({
          id: a.mal_id.toString(),
          title: a.title,
          image: a.images.jpg.large_image_url,
          type: a.type,
          releaseDate: a.status,
          totalEpisodes: a.episodes
        }));
      }
    }
  } catch (e) {}

  const aniQuery = `
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 20) {
        media(search: $search, type: ANIME, isAdult: true) {
          id
          title { romaji english }
          coverImage { large }
          format
          status
          episodes
        }
      }
    }
  `;
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: aniQuery, variables: { search: query, page } })
    });
    const data = await res.json();
    return data.data.Page.media.map((a: any) => ({
      id: a.id.toString(),
      title: a.title.english || a.title.romaji,
      image: a.coverImage.large,
      type: a.format,
      releaseDate: a.status,
      totalEpisodes: a.episodes
    }));
  } catch (e) {
    return [];
  }
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
  const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
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

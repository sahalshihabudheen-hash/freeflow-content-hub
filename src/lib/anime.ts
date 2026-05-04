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
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 24) {
        media(type: ANIME, isAdult: true) {
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
    const res = await fetch(`${API}/anilist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { page } })
    });
    const data = await res.json();
    const results = data.data.Page.media.map((a: any) => ({
      id: a.id.toString(),
      title: a.title.english || a.title.romaji,
      image: a.coverImage.large,
      type: a.format,
      releaseDate: a.status,
      totalEpisodes: a.episodes
    }));

    if (results.length === 0) {
      console.warn("AniList returned empty results, adding debug item");
      return [{
        id: "debug-1",
        title: "If you see this, AniList is empty",
        image: "https://via.placeholder.com/400x600?text=AniList+Empty",
        type: "DEBUG",
        releaseDate: "NOW",
        totalEpisodes: 0
      }];
    }
    return results;
  } catch (e: any) {
    console.error("AniList fetch failed", e);
    return [{
      id: "error-1",
      title: "Fetch Error: " + e.message,
      image: "https://via.placeholder.com/400x600?text=Fetch+Error",
      type: "ERROR",
      releaseDate: "ERROR",
      totalEpisodes: 0
    }];
  }
}

export async function searchJikan(queryStr: string, page = 1): Promise<Anime[]> {
  const query = `
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 24) {
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
    const res = await fetch(`${API}/anilist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: queryStr, page } })
    });
    const data = await res.json();
    const results = data.data.Page.media.map((a: any) => ({
      id: a.id.toString(),
      title: a.title.english || a.title.romaji,
      image: a.coverImage.large,
      type: a.format,
      releaseDate: a.status,
      totalEpisodes: a.episodes
    }));

    if (results.length === 0) {
      return [{
        id: "debug-search-empty",
        title: "Search returned 0 results",
        image: "https://via.placeholder.com/400x600?text=Search+Empty",
        type: "DEBUG",
        releaseDate: "NOW",
        totalEpisodes: 0
      }];
    }
    return results;
  } catch (e: any) {
    console.error("AniList search failed", e);
    return [{
      id: "error-search",
      title: "Search Error: " + e.message,
      image: "https://via.placeholder.com/400x600?text=Search+Error",
      type: "ERROR",
      releaseDate: "ERROR",
      totalEpisodes: 0
    }];
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
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        id
        title { romaji english }
        coverImage { large }
        description
        genres
        status
        format
        episodes
      }
    }
  `;
  const res = await fetch(`${API}/anilist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id: parseInt(id) } })
  });
  if (!res.ok) throw new Error("Anime details not found");
  const data = await res.json();
  const a = data.data.Media;
  
  // For streaming, we'll search by title on Consumet.
  const searchRes = await fetch(`${API}/hentaihaven/${encodeURIComponent(a.title.english || a.title.romaji)}`);
  const searchData = await searchRes.json();
  const consumetId = searchData.results?.[0]?.id || (a.title.english || a.title.romaji).toLowerCase().replace(/ /g, '-');

  return {
    id: a.id.toString(),
    title: a.title.english || a.title.romaji,
    image: a.coverImage.large,
    description: a.description,
    genres: a.genres,
    status: a.status,
    releaseDate: a.status,
    type: a.format,
    episodes: Array.from({ length: a.episodes || 1 }).map((_, i) => ({
      id: `${consumetId}-episode-${i + 1}`,
      number: i + 1,
      title: `Episode ${i + 1}`,
      url: "" // Not used directly
    }))
  };
}

export async function getEpisodeSources(episodeId: string): Promise<StreamingLink[]> {
  const res = await fetch(`${API}/hentaihaven/watch/${episodeId}`);
  if (!res.ok) throw new Error("Failed to load episode sources");
  const data = await res.json();
  return data.sources || [];
}

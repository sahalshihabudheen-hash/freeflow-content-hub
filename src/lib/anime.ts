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

    return results;
  } catch (e: any) {
    console.error("AniList fetch failed", e);
    return [];
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

    return results;
  } catch (e: any) {
    console.error("AniList search failed", e);
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
  
  // Search Hanime by title
  let hanimeSlug = "";
  try {
    const searchRes = await fetch(`${API}/hanime/search/${encodeURIComponent(a.title.english || a.title.romaji)}`);
    const searchData = await searchRes.json();
    hanimeSlug = searchData.results?.[0]?.slug || "";
  } catch (e) {}

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
      id: hanimeSlug ? `${hanimeSlug}-ep-${i + 1}` : `manual-${a.id}-ep-${i + 1}`,
      number: i + 1,
      title: `Episode ${i + 1}`,
      url: hanimeSlug // Store slug for later
    }))
  };
}

export async function getEpisodeSources(episodeId: string): Promise<StreamingLink[]> {
  // Check if it's a Hanime slug
  if (episodeId.includes('-ep-')) {
    const slug = episodeId.split('-ep-')[0];
    const epNum = episodeId.split('-ep-')[1];
    
    // Hanime usually has slugs like "pure-mail-1", "pure-mail-2"
    // We try the slug directly if it has a number, or append epNum
    const targetSlug = slug.match(/-\d+$/) ? slug : `${slug}-${epNum}`;
    
    try {
      const res = await fetch(`${API}/hanime/video/${targetSlug}`);
      if (res.ok) {
        const data = await res.json();
        return data.sources || [];
      }
    } catch (e) {}
  }

  // Fallback to Consumet/HentaiHaven
  const res = await fetch(`${API}/hentaihaven/watch/${episodeId}`);
  if (!res.ok) throw new Error("Failed to load episode sources");
  const data = await res.json();
  return data.sources || [];
}


const ANILIST_URL = "/api/anime/anilist";

export interface AniListAnime {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  coverImage: {
    extraLarge: string;
    large: string;
  };
  description: string;
  genres: string[];
  status: string;
  episodes: number;
  averageScore: number;
  format: string;
}

const TRENDING_QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, isAdult: true, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
      }
      coverImage {
        large
      }
      description
      genres
      status
      episodes
      format
    }
  }
}
`;

const SEARCH_QUERY = `
query ($search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(search: $search, type: ANIME, isAdult: true) {
      id
      title {
        romaji
        english
      }
      coverImage {
        large
      }
      description
      genres
      status
      episodes
      format
    }
  }
}
`;

export async function fetchAniListTrending(page = 1, perPage = 20): Promise<AniListAnime[]> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: TRENDING_QUERY,
      variables: { page, perPage }
    })
  });
  if (!res.ok) throw new Error("Failed to fetch from AniList");
  const data = await res.json();
  return data.data.Page.media;
}

export async function searchAniList(query: string, page = 1, perPage = 20): Promise<AniListAnime[]> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { search: query, page, perPage }
    })
  });
  if (!res.ok) throw new Error("AniList search failed");
  const data = await res.json();
  return data.data.Page.media;
}

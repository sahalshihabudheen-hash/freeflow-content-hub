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
        title { romaji english native }
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
  
  const title = a.title.english || a.title.romaji;
  let episodes: Episode[] = [];
  
  // Hanime-first approach (Recommended)
  try {
    const hanimeRes = await fetch(`${API}/hanime/search/${encodeURIComponent(title)}`);
    const hanimeData = await hanimeRes.json();
    if (hanimeData.results && hanimeData.results.length > 0) {
      // Reverse to get episode 1 first if they are sorted newest first
      const hits = hanimeData.results.slice().reverse();
      episodes = hits.map((hit: any, i: number) => ({
        id: `fallback|hanime_direct|${i + 1}|${hit.slug}`,
        number: i + 1,
        title: hit.name,
        url: hit.slug
      }));
    }
  } catch (e) {
    console.warn("[getAnimeInfo] Hanime search failed", e);
  }

  // Try to get episodes from Anify using the same ID if Hanime failed
  if (episodes.length === 0) {
    try {
      const anifyRes = await fetch(`${API}/anify/info/${id}?type=anime`);
      const anifyData = await anifyRes.json();
      
      // Find a provider with episodes (prefer hentaihaven or hanime)
      const provider = anifyData.episodes?.find((p: any) => p.providerId === 'hentaihaven' || p.providerId === 'hanime') || anifyData.episodes?.[0];
      
      if (provider && provider.episodes?.length > 0) {
        episodes = provider.episodes.map((ep: any) => ({
          id: `${id}|${provider.providerId}|${ep.number}|${encodeURIComponent(ep.id)}`,
          number: ep.number,
          title: ep.title || `Episode ${ep.number}`,
          url: ep.id
        }));
      }
    } catch (e) {
      console.warn("[getAnimeInfo] Anify fetch failed, using manual episode generation", e);
    }

    // Fallback if no episodes found
    if (episodes.length === 0) {
      // We add both hanime and hentaicity as fallback options
      episodes = [
        {
          id: `fallback|hanime|1|${encodeURIComponent(title)}`,
          number: 1,
          title: `Watch on Hanime`,
          url: ""
        },
        {
          id: `fallback|hentaicity|1|${encodeURIComponent(title)}`,
          number: 1,
          title: `Watch on HentaiCity`,
          url: ""
        }
      ];
    }
  }

  return {
    id: a.id.toString(),
    title: a.title.english || a.title.romaji,
    image: a.coverImage.large,
    description: a.description,
    genres: a.genres,
    status: a.status,
    releaseDate: a.status,
    type: a.format,
    episodes
  };
}

export async function getEpisodeSources(episodeId: string): Promise<StreamingLink[]> {
  const [anilistId, providerId, episodeNumber, watchId] = episodeId.split('|');
  
  if (anilistId === 'fallback') {
    if (providerId === 'hanime_direct') {
      try {
        const res = await fetch(`${API}/hanime/video/${watchId}`);
        const data = await res.json();
        return data.sources || [];
      } catch (e) {}
    } else if (providerId === 'hanime') {
      try {
        const searchRes = await fetch(`${API}/hanime/search/${watchId}`);
        const searchData = await searchRes.json();
        const slug = searchData.results?.[0]?.slug;
        if (slug) {
          const targetSlug = slug.match(/-\d+$/) ? slug : `${slug}-${episodeNumber}`;
          const res = await fetch(`${API}/hanime/video/${targetSlug}`);
          const data = await res.json();
          return data.sources || [];
        }
      } catch (e) {}
    } else if (providerId === 'hentaicity') {
      try {
        const searchRes = await fetch(`${API}/hentaicity/search/${watchId}`);
        const searchData = await searchRes.json();
        const videoUrl = searchData.results?.[0]?.url;
        if (videoUrl) {
          const res = await fetch(`${API}/hentaicity/video/${encodeURIComponent(videoUrl)}`);
          const data = await res.json();
          return data.sources || [];
        }
      } catch (e) {}
    }
  } else {
    // Use Anify Sources API
    try {
      // Add a controller to timeout the fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const url = `${API}/anify/sources?id=${anilistId}&episodeNumber=${episodeNumber}&providerId=${providerId}&watchId=${watchId}&subType=sub`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      return data.sources?.map((s: any) => ({
        url: s.url,
        quality: s.quality || 'auto',
        isM3U8: s.url.includes('.m3u8')
      })) || [];
    } catch (e) {
      // If Anify fails, try Hanime fallback automatically
      const info = await getAnimeInfo(anilistId);
      const title = info.title;
      const searchRes = await fetch(`${API}/hanime/search/${encodeURIComponent(title)}`);
      const searchData = await searchRes.json();
      const slug = searchData.results?.[0]?.slug;
      if (slug) {
        const res = await fetch(`${API}/hanime/video/${slug}`);
        const data = await res.json();
        return data.sources || [];
      }
    }
  }

  throw new Error("No available streaming sources found.");
}

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
  
  // Hanime-first approach
  try {
    const hanimeRes = await fetch(`${API}/hanime/list?q=${encodeURIComponent(title)}`);
    const hanimeData = await hanimeRes.json();
    if (hanimeData.results && hanimeData.results.length > 0) {
      // Hanime results are usually individual episodes for some titles
      // and series for others. We try to map them as episodes.
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
      console.warn("[getAnimeInfo] Anify fetch failed");
    }

    // Fallback if no episodes found
    if (episodes.length === 0) {
      episodes = [
        {
          id: `fallback|hanime|1|${encodeURIComponent(title)}`,
          number: 1,
          title: `Search on Hanime`,
          url: ""
        },
        {
          id: `fallback|hentaicity|1|${encodeURIComponent(title)}`,
          number: 1,
          title: `Search on HentaiCity`,
          url: ""
        }
      ];
    }
  }

  return {
    id: a.id.toString(),
    title,
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
        if (data.sources) return data.sources;
      } catch (e) {}
    } else if (providerId === 'hanime') {
      try {
        const searchRes = await fetch(`${API}/hanime/search/${watchId}`);
        const searchData = await searchRes.json();
        const results = searchData.results || [];
        // Find best match
        const hit = results.find((r: any) => r.slug.includes(episodeNumber)) || results[0];
        if (hit) {
          const res = await fetch(`${API}/hanime/video/${hit.slug}`);
          const data = await res.json();
          if (data.sources) return data.sources;
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
          if (data.sources) return data.sources;
        }
      } catch (e) {}
    }
  } else {
    // Try Anify first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const url = `${API}/anify/sources?id=${anilistId}&episodeNumber=${episodeNumber}&providerId=${providerId}&watchId=${watchId}&subType=sub`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (data.sources?.length > 0) {
        return data.sources.map((s: any) => ({
          url: s.url,
          quality: s.quality || 'auto',
          isM3U8: s.url.includes('.m3u8')
        }));
      }
    } catch (e) {}

    // Fallback to Hanime search by title
    try {
      const infoRes = await fetch(`${API}/anilist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `query($id:Int){Media(id:$id){title{english romaji}}}` , 
          variables: { id: parseInt(anilistId) } 
        })
      });
      const infoData = await infoRes.json();
      const title = infoData.data.Media.title.english || infoData.data.Media.title.romaji;
      
      const searchRes = await fetch(`${API}/hanime/search/${encodeURIComponent(title)}`);
      const searchData = await searchRes.json();
      const results = searchData.results || [];
      const hit = results.find((r: any) => r.slug.includes(episodeNumber)) || results[0];
      if (hit) {
        const res = await fetch(`${API}/hanime/video/${hit.slug}`);
        const data = await res.json();
        if (data.sources) return data.sources;
      }
    } catch (e) {}
  }

  throw new Error("No available streaming sources found. Please try another episode or provider.");
}

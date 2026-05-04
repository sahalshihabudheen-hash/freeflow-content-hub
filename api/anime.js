
export default async function handler(req, res) {
  const url = new URL(req.url, 'https://jarvis-comics.vercel.app');
  const path = req.url.split('/api/anime')[1];

  // 1. AniList Proxy
  if (path && path.startsWith('/anilist')) {
    try {
      let q, v;
      if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        q = body.query;
        v = body.variables;
      } else {
        q = url.searchParams.get('query');
        v = JSON.parse(url.searchParams.get('variables') || '{}');
      }

      const aniRes = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, variables: v })
      });
      const aniData = await aniRes.json();
      return res.status(aniRes.status).json(aniData);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 2. Hanime Search
  if (path && path.startsWith('/hanime/search')) {
    const query = path.split('/hanime/search/')[1];
    try {
      const hRes = await fetch('https://search.htv-services.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({
          search_text: decodeURIComponent(query),
          tags: [], tags_mode: "AND", brands: [], blacklist: [],
          order_by: "created_at_unix", ordering: "desc", page: 0
        })
      });
      const hData = await hRes.json();
      const hits = JSON.parse(hData.hits || '[]');
      return res.status(200).json({ results: hits });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 3. Hanime Video
  if (path && path.startsWith('/hanime/video')) {
    const slug = path.split('/hanime/video/')[1];
    try {
      const hRes = await fetch(`https://hanime.tv/api/v8/video?id=${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const hData = await hRes.json();
      const streams = hData.videos_manifest.servers[0].streams.map(s => ({
        url: s.url,
        quality: s.height + 'p',
        isM3U8: s.url.includes('.m3u8')
      }));
      return res.status(200).json({ sources: streams });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 4. Multi-Mirror Consumet Proxy (Search/Watch)
  const mirrors = [
    'https://api-consumet-org-ashy.vercel.app',
    'https://consumet-api.ryuk-me.dev',
    'https://api.consumet.org'
  ];

  for (const mirror of mirrors) {
    try {
      const target = `${mirror}${path}${url.search}`;
      const mRes = await fetch(target, { signal: AbortSignal.timeout(5000) });
      if (mRes.ok) {
        const mData = await mRes.json();
        return res.status(200).json(mData);
      }
    } catch (e) {}
  }

  return res.status(404).json({ error: 'No working mirror found' });
}

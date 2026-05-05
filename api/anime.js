
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

  // 2. Anify Proxy (High Reliability)
  if (path && path.startsWith('/anify')) {
    const target = path.replace('/anify', 'https://api.anify.tv') + url.search;
    try {
      const aRes = await fetch(target, { signal: AbortSignal.timeout(3000) });
      const aData = await aRes.json();
      return res.status(aRes.status).json(aData);
    } catch (e) {
      return res.status(504).json({ error: 'Anify timeout/failure' });
    }
  }

  // 3. Hanime Proxy
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

  // New endpoint for direct listing (e.g. for series info)
  if (path && path.startsWith('/hanime/list')) {
    const query = url.searchParams.get('q');
    try {
      const hRes = await fetch('https://search.htv-services.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({
          search_text: query,
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

  if (path && path.startsWith('/hanime/video')) {
    const slug = path.split('/hanime/video/')[1];
    try {
      const hRes = await fetch(`https://hanime.tv/api/v8/video?id=${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000)
      });
      const hData = await hRes.json();
      
      if (!hData.videos_manifest || !hData.videos_manifest.servers || hData.videos_manifest.servers.length === 0) {
         return res.status(404).json({ error: 'No video manifest found' });
      }

      const streams = hData.videos_manifest.servers[0].streams.map(s => ({
        url: s.url,
        quality: s.height + 'p',
        isM3U8: true
      })).filter(s => s.url);

      if (streams.length === 0) {
        return res.status(404).json({ error: 'No streamable URLs found' });
      }

      return res.status(200).json({ sources: streams });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 4. HentaiCity Proxy (Improved)
  if (path && path.startsWith('/hentaicity/search')) {
    const query = path.split('/hentaicity/search/')[1];
    try {
      const hcRes = await fetch(`https://hentaicity.com/?s=${query}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000)
      });
      const html = await hcRes.text();
      // Extract results using more robust regex
      const results = [];
      const regex = /<div class="thumb"><a href="([^"]+)" title="([^"]+)"><img src="([^"]+)"/g;
      let m;
      while ((m = regex.exec(html)) !== null) {
        results.push({ url: m[1], title: m[2], image: m[3] });
      }
      return res.status(200).json({ results });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (path && path.startsWith('/hentaicity/video')) {
    const videoUrl = decodeURIComponent(path.split('/hentaicity/video/')[1]);
    try {
      const hcRes = await fetch(videoUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000)
      });
      const html = await hcRes.text();
      // Look for sources in the HTML
      // Often in a <source> tag or inside a JSON object
      const sourceMatch = html.match(/source src="([^"]+)" type="video\/mp4"/) || 
                          html.match(/"file":"([^"]+\.mp4)"/);
      
      if (sourceMatch) {
        return res.status(200).json({ 
          sources: [{ url: sourceMatch[1].replace(/\\/g, ''), quality: '720p', isM3U8: false }] 
        });
      }
      return res.status(404).json({ error: 'No video source found on page' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 5. Multi-Mirror Proxy (Consumet Fallback)
  const mirrors = [
    'https://api-consumet-org-ashy.vercel.app',
    'https://consumet-api-clone.vercel.app', // Added another possible mirror
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

  return res.status(404).json({ error: 'No working mirror or provider found' });
}

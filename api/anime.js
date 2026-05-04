export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = req.url.split('/api/anime')[1];

  // Handle AniList GraphQL requests via proxy
  if (path === '/anilist' || path === 'anilist') {
    try {
      // If req.body is a string, parse it, otherwise use it
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      const aniRes = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const aniData = await aniRes.json();
      return res.status(aniRes.status).json(aniData);
    } catch (e) {
      console.error("[AniList Proxy Error]", e.message);
      return res.status(500).json({ error: e.message });
    }
  }
  
  // Try multiple mirrors if one fails
  const mirrors = [
    'https://api.consumet.org',
    'https://consumet-api-fawn.vercel.app',
    'https://consumet-api-two.vercel.app',
    'https://api-consumet-org-ashy.vercel.app',
    'https://c.delusionz.xyz',
    'https://consumet-api-clone.vercel.app'
  ];

  let lastError = null;

  for (const base of mirrors) {
    const target = `${base}/${pathStr}${url.search}`;
    console.log(`[Anime Proxy] Trying target: ${target}`);
    
    try {
      const response = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        // Timeout to fail fast and try next mirror
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const body = await response.arrayBuffer();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
        return res.status(response.status).send(Buffer.from(body));
      }
      
      console.warn(`[Anime Proxy] Mirror ${base} returned status ${response.status}`);
      lastError = `Status ${response.status}`;
    } catch (e) {
      console.error(`[Anime Proxy] Mirror ${base} failed:`, e.message);
      lastError = e.message;
    }
  }

  res.status(502).json({ error: 'All anime mirrors failed', details: lastError });
}

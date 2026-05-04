
export default async function handler(req, res) {
  const url = new URL(req.url, 'https://jarvis-comics.vercel.app');
  const path = req.url.split('/api/anime')[1];

  // 1. AniList Proxy (via GET for stability)
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

  // 2. Mirror Proxy (for streaming and search fallback)
  const mirrors = [
    'https://api.consumet.org',
    'https://api-consumet-org-ashy.vercel.app',
    'https://consumet-api.ryuk-me.dev'
  ];

  const targetPath = path;
  for (const mirror of mirrors) {
    try {
      const target = `${mirror}${targetPath}${url.search}`;
      const mRes = await fetch(target, { signal: AbortSignal.timeout(5000) });
      if (mRes.ok) {
        const mData = await mRes.json();
        return res.status(200).json(mData);
      }
    } catch (e) {}
  }

  return res.status(404).json({ error: 'No working mirror found' });
}

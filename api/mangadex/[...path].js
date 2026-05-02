export default async function handler(req, res) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : (path || '');
  const url = new URL(req.url, 'http://localhost');
  const target = `https://api.mangadex.org/${pathStr}${url.search}`;

  try {
    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 JarvisComics/1.0',
        'Accept': 'application/json',
      },
    });
    const body = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).send(Buffer.from(body));
  } catch (e) {
    res.status(500).json({ error: 'Proxy error' });
  }
}

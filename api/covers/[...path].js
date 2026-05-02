export default async function handler(req, res) {
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : (path || '');
  const target = `https://uploads.mangadex.org/covers/${pathStr}`;

  try {
    const response = await fetch(target, {
      headers: { 'Referer': 'https://mangadex.org/' },
    });
    const body = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(response.status).send(Buffer.from(body));
  } catch (e) {
    res.status(500).send('Cover proxy error');
  }
}

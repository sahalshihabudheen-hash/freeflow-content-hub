export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');

  try {
    const parsed = new URL(url);
    const allowed = parsed.hostname.endsWith('.mangadex.org') || parsed.hostname.endsWith('.mangadex.network');
    if (!allowed) return res.status(403).send('Forbidden');

    const response = await fetch(url, {
      headers: {
        'Referer': 'https://mangadex.org/',
        'Origin': 'https://mangadex.org',
      },
    });
    const body = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(response.status).send(Buffer.from(body));
  } catch (e) {
    res.status(500).send('Image proxy error');
  }
}

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');

  try {
    const parsed = new URL(url);
    const isMangaDex = parsed.hostname.endsWith('.mangadex.org') || parsed.hostname.endsWith('.mangadex.network');
    const isManhwaRead = parsed.hostname.endsWith('.manread.xyz') || parsed.hostname === 'manread.xyz';
    
    if (!isMangaDex && !isManhwaRead) {
      return res.status(403).send('Forbidden');
    }

    const headers = {};
    if (isMangaDex) {
      headers['Referer'] = 'https://mangadex.org/';
      headers['Origin'] = 'https://mangadex.org';
    } else if (isManhwaRead) {
      headers['Referer'] = 'https://manhwaread.com/';
      headers['User-Agent'] = 'Mozilla/5.0';
    }

    const response = await fetch(url, { headers });
    const body = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(response.status).send(Buffer.from(body));
  } catch (e) {
    res.status(500).send('Image proxy error');
  }
}

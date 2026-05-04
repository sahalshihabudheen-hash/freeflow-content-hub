export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action');
  const slug = url.searchParams.get('slug');
  const chapter = url.searchParams.get('chapter');

  if (!action || !slug) {
    return res.status(400).json({ error: 'Missing action or slug' });
  }

  try {
    if (action === 'chapters') {
      const targetUrl = `https://manhwaread.com/manhwa/${slug}/`;
      const url = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await response.text();

      // Extract all unique chapter numbers
      const allLinks = html.match(/\/chapter-\d+/g);
      if (!allLinks) {
        return res.json({ chapters: [] });
      }
      const nums = [...new Set(allLinks.map(l => parseInt(l.replace('/chapter-', ''))))].sort((a, b) => a - b);
      
      const chapters = nums.map(n => ({
        id: `manhwaread-${slug}-${n}`,
        chapter: n.toString(),
        title: null,
        language: 'en',
        pages: 0, // Unknown
        publishAt: new Date().toISOString(),
        scanlator: 'ManhwaRead',
        externalUrl: null,
      }));

      return res.json({ chapters });
    }

    if (action === 'pages') {
      if (!chapter) return res.status(400).json({ error: 'Missing chapter number' });
      
      const paddedNum = String(chapter).padStart(3, '0');
      const targetUrl = `https://manhwaread.com/manhwa/${slug}/chapter-${paddedNum}/`;
      const url = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await response.text();

      // Extract full base64 blob - it ends with "};
      const match = html.match(/var chapterData = \{[^}]*"data":"([A-Za-z0-9+/=]+)"/);
      let data = [];
      if (match) {
        data = JSON.parse(Buffer.from(match[1], 'base64').toString('utf-8'));
      } else {
        const alt = html.match(/chapterData\s*=\s*\{[^}]*"data"\s*:\s*"([A-Za-z0-9+/=]+)"/);
        if (alt) {
          data = JSON.parse(Buffer.from(alt[1], 'base64').toString('utf-8'));
        }
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'No images found' });
      }

      // Convert paths to use our image proxy
      const urls = data.map(img => `/api/image?url=${encodeURIComponent(`https://manread.xyz/1081/${img.src}`)}`);
      
      return res.json({ urls });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Manhwaread API error:', error);
    return res.status(500).json({ error: 'Failed to fetch from manhwaread' });
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action');
  const slug = url.searchParams.get('slug');
  const chapter = url.searchParams.get('chapter');

  if (!action || !slug) {
    return res.status(400).json({ error: 'Missing action or slug' });
  }

  const proxies = [
    (target) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
    (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`
  ];

  async function fetchWithProxy(targetUrl) {
    for (const proxyFn of proxies) {
      try {
        const response = await fetch(proxyFn(targetUrl), {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
          signal: AbortSignal.timeout(8000)
        });
        if (response.ok) return await response.text();
      } catch (e) {
        console.warn(`Proxy failed for ${targetUrl}:`, e.message);
      }
    }
    throw new Error('All proxies failed');
  }

  try {
    if (action === 'chapters') {
      const targetUrl = `https://manhwaread.com/manhwa/${slug}/`;
      const html = await fetchWithProxy(targetUrl);

      // Improved regex to catch chapter numbers more reliably
      // Matches things like /chapter-147, /chapter-147-5, /chapter-079/
      const links = html.match(/\/chapter-([\d.-]+)/g) || [];
      const chaptersMap = new Map();

      links.forEach(link => {
        const match = link.match(/\/chapter-([\d.]+)/);
        if (match) {
          const numStr = match[1];
          const num = parseFloat(numStr);
          if (!isNaN(num)) {
            // Store the highest precision version (e.g. 79.5 over 79 if both exist)
            if (!chaptersMap.has(num) || numStr.length > chaptersMap.get(num).chapter.length) {
              chaptersMap.set(num, {
                id: `manhwaread-${slug}-${numStr}`,
                chapter: numStr,
                title: null,
                language: 'en',
                pages: 0,
                publishAt: new Date().toISOString(),
                scanlator: 'ManhwaRead',
                externalUrl: null,
              });
            }
          }
        }
      });

      const chapters = Array.from(chaptersMap.values()).sort((a, b) => parseFloat(a.chapter) - parseFloat(b.chapter));
      return res.json({ chapters });
    }

    if (action === 'pages') {
      if (!chapter) return res.status(400).json({ error: 'Missing chapter number' });
      
      // Try multiple URL formats for the chapter
      const formats = [
        (s, c) => `https://manhwaread.com/manhwa/${s}/chapter-${c}/`,
        (s, c) => `https://manhwaread.com/manhwa/${s}/chapter-${String(c).padStart(3, '0')}/`,
        (s, c) => `https://manhwaread.com/manhwa/${s}/chapter-${c}-/`
      ];

      let html = '';
      for (const format of formats) {
        try {
          html = await fetchWithProxy(format(slug, chapter));
          if (html.includes('chapterData')) break;
        } catch (e) {}
      }

      if (!html || !html.includes('chapterData')) {
        return res.status(404).json({ error: 'Chapter page not found' });
      }

      const match = html.match(/var chapterData = \{[^}]*"data":"([A-Za-z0-9+/=]+)"/) || 
                    html.match(/chapterData\s*=\s*\{[^}]*"data"\s*:\s*"([A-Za-z0-9+/=]+)"/);
      
      let data = [];
      if (match) {
        try {
          data = JSON.parse(Buffer.from(match[1], 'base64').toString('utf-8'));
        } catch (e) {
          console.error('Base64 decode failed:', e);
        }
      }

      if (!data || data.length === 0) {
        // Fallback: try to find images directly in HTML
        const imgRegex = /<img[^>]+src="([^"]+manread\.xyz[^"]+)"/g;
        let m;
        while ((m = imgRegex.exec(html)) !== null) {
          data.push({ src: m[1].split('/').pop() });
        }
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'No images found' });
      }

      // Convert paths to use our image proxy
      // ManhwaRead images are often on manread.xyz
      const urls = data.map(img => {
        const src = img.src.startsWith('http') ? img.src : `https://manread.xyz/1081/${img.src}`;
        return `/api/image?url=${encodeURIComponent(src)}`;
      });
      
      return res.json({ urls });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Manhwaread API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

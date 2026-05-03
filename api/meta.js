import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

export default async function handler(req, res) {
  const { url, headers } = req;
  const userAgent = headers['user-agent'] || '';
  const isBot = /bot|google|apple|baidu|bing|msn|duckduckbot|teoma|slurp|yandex|discord|whatsapp|facebook|twitter|telegram/i.test(userAgent);

  // Extract path and ID
  const fullPath = url.split('?')[0];
  const parts = fullPath.split('/').filter(Boolean);
  const type = parts[0]; // 'manga', 'my-comic', 'chapter'
  const id = parts[1];

  if (!id || (type !== 'manga' && type !== 'my-comic' && type !== 'chapter')) {
    return res.redirect('/');
  }

  // If not a bot, redirect to the SPA
  if (!isBot) {
    const searchParams = url.includes('?') ? '&' + url.split('?')[1] : '';
    return res.redirect(`${fullPath}?redirected=true${searchParams}`);
  }

  try {
    let title = 'JARVIS COMICS';
    let description = 'Discover and read manga online.';
    let coverUrl = 'https://jarvis-comics.vercel.app/src/assets/jarvis-comics-logo.png';
    let themeColor = '#8B5CF6'; // Brand purple

    if (type === 'manga') {
      const mangaRes = await fetch(`https://api.mangadex.org/manga/${id}?includes[]=cover_art`);
      const mangaData = await mangaRes.json();
      if (mangaData.data) {
        const manga = mangaData.data;
        title = (manga.attributes.title.en || Object.values(manga.attributes.title)[0]) + ' - JARVIS COMICS';
        description = manga.attributes.description.en || Object.values(manga.attributes.description)[0] || description;
        
        const coverRel = manga.relationships.find(r => r.type === 'cover_art');
        const coverFile = coverRel?.attributes?.fileName;
        if (coverFile) {
          // Use 512px for better quality in embeds
          coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.512.jpg`;
        }
      }
    } else if (type === 'my-comic') {
      const { data: comic } = await supabase
        .from('user_comics')
        .select('title, description, cover_path')
        .eq('id', id)
        .maybeSingle();
      
      if (comic) {
        title = `${comic.title} - JARVIS COMICS`;
        description = comic.description || description;
        if (comic.cover_path) {
          coverUrl = supabase.storage.from('comics').getPublicUrl(comic.cover_path).data.publicUrl;
        }
      }
    } else if (type === 'chapter') {
      // For chapters, try to get manga context from MangaDex
      const chapRes = await fetch(`https://api.mangadex.org/chapter/${id}?includes[]=manga`);
      const chapData = await chapRes.json();
      if (chapData.data) {
        const chapter = chapData.data;
        const mangaRel = chapter.relationships.find(r => r.type === 'manga');
        const chapterNum = chapter.attributes.chapter;
        const chapterTitle = chapter.attributes.title;
        
        if (mangaRel) {
          const mangaRes = await fetch(`https://api.mangadex.org/manga/${mangaRel.id}?includes[]=cover_art`);
          const mangaData = await mangaRes.json();
          if (mangaData.data) {
            const manga = mangaData.data;
            const mangaTitle = manga.attributes.title.en || Object.values(manga.attributes.title)[0];
            title = `${mangaTitle} - Chapter ${chapterNum}${chapterTitle ? `: ${chapterTitle}` : ''}`;
            description = `Read Chapter ${chapterNum} of ${mangaTitle} on JARVIS COMICS.`;
            
            const coverRel = manga.relationships.find(r => r.type === 'cover_art');
            const coverFile = coverRel?.attributes?.fileName;
            if (coverFile) {
              coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.512.jpg`;
            }
          }
        }
      }
    }

    // Clean text: strip BBCode, Markdown, and HTML
    const cleanText = (text) => {
      if (!text) return '';
      return text
        .replace(/\[\/?\w+.*?\]/g, '') // Strip BBCode [b], [i], etc.
        .replace(/[#*_~`]/g, '')       // Strip simple Markdown
        .replace(/[<>]/g, '')          // Strip HTML-like tags
        .trim();
    };

    const displayDesc = cleanText(description).slice(0, 200) + (description.length > 200 ? '...' : '');

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <meta name="description" content="${displayDesc}">
          <meta name="theme-color" content="${themeColor}">
          
          <!-- Open Graph / Facebook -->
          <meta property="og:type" content="website">
          <meta property="og:url" content="https://jarvis-comics.vercel.app${fullPath}">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${displayDesc}">
          <meta property="og:image" content="${coverUrl}">
          <meta property="og:site_name" content="JARVIS COMICS">

          <!-- Twitter -->
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:url" content="https://jarvis-comics.vercel.app${fullPath}">
          <meta property="twitter:title" content="${title}">
          <meta property="twitter:description" content="${displayDesc}">
          <meta property="twitter:image" content="${coverUrl}">

          <!-- Prevent bots from indexing this redirect page but allow sharing -->
          <meta name="robots" content="noindex">
        </head>
        <body>
          <div style="font-family: sans-serif; padding: 20px; text-align: center;">
            <h1>${title}</h1>
            <p>${displayDesc}</p>
            <img src="${coverUrl}" style="max-width: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
            <br><br>
            <a href="${fullPath}?redirected=true">Click here to read</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Meta Error:', error);
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><meta http-equiv="refresh" content="0;url=${fullPath}?redirected=true"></head>
        <body>Redirecting...</body>
      </html>
    `);
  }
}


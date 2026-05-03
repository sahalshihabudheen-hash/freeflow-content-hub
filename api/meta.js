import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { url, headers, query } = req;
  const userAgent = headers['user-agent'] || '';
  const isBot = /bot|google|apple|baidu|bing|msn|duckduckbot|teoma|slurp|yandex|discord|whatsapp|facebook|twitter|telegram/i.test(userAgent);

  // Vercel rewrites pass params in query
  // Fallback to path parsing if query is empty (though vercel.json should populate it)
  const type = query.type || url.split('/')[1]?.split('?')[0];
  const id = query.id || url.split('/')[2]?.split('?')[0];

  console.log(`[Meta] URL: ${url}, Type: ${type}, ID: ${id}, Bot: ${isBot}`);

  if (!id || !['manga', 'my-comic', 'chapter'].includes(type)) {
    // If we can't determine what this is, just go home or to the actual URL
    return res.redirect(url.includes('api') ? '/' : `${url}${url.includes('?') ? '&' : '?'}redirected=true`);
  }

  const fullPath = `/${type}/${id}`;

  // If not a bot, redirect to the SPA
  if (!isBot) {
    const searchParams = url.includes('?') ? '&' + url.split('?')[1] : '';
    // Avoid redirecting to /api/meta.js
    const targetPath = fullPath.startsWith('/api') ? '/' : fullPath;
    return res.redirect(`${targetPath}?redirected=true${searchParams}`);
  }

  try {
    let title = 'JARVIS COMICS';
    let description = 'Discover and read manga online.';
    let coverUrl = 'https://jarvis-comics.vercel.app/src/assets/jarvis-comics-logo.png';
    let themeColor = '#8B5CF6'; 

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
          coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.512.jpg`;
        }
      }
    } else if (type === 'my-comic') {
      // Lazy init Supabase to prevent crash if env vars are missing
      if (process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY) {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);
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
      }
    } else if (type === 'chapter') {
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

    const cleanText = (text) => {
      if (!text) return '';
      return text
        .replace(/\[\/?\w+.*?\]/g, '') 
        .replace(/[#*_~`]/g, '')       
        .replace(/[<>]/g, '')          
        .trim();
    };

    const displayDesc = cleanText(description).slice(0, 200) + (description.length > 200 ? '...' : '');

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <meta name="description" content="${displayDesc}">
          <meta name="theme-color" content="${themeColor}">
          <meta property="og:type" content="website">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${displayDesc}">
          <meta property="og:image" content="${coverUrl}">
          <meta property="og:site_name" content="JARVIS COMICS">
          <meta property="twitter:card" content="summary_large_image">
          <meta property="twitter:title" content="${title}">
          <meta property="twitter:description" content="${displayDesc}">
          <meta property="twitter:image" content="${coverUrl}">
          <meta name="robots" content="noindex">
        </head>
        <body style="background: #09090b; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
          <div style="padding: 20px; max-width: 500px;">
            <img src="${coverUrl}" style="width: 200px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); margin-bottom: 24px;" />
            <h1 style="font-size: 24px; margin-bottom: 12px;">${title}</h1>
            <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">${displayDesc}</p>
            <a href="${fullPath}?redirected=true" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 32px; rounded: 12px; text-decoration: none; font-weight: bold; border-radius: 8px;">Open JARVIS COMICS</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Meta Error:', error);
    res.status(200).send(`<html><head><meta http-equiv="refresh" content="0;url=${fullPath}?redirected=true"></head><body>Redirecting...</body></html>`);
  }
}




async function test() {
  const url = 'https://hentaicity.com/video/bible-black-episode-1/';
  const res = await fetch(url);
  const html = await res.text();
  const index = html.indexOf('<video');
  if (index !== -1) {
    console.log(`Video tag found:`, html.substring(index, index + 1000));
  } else {
    console.log(`No video tag found. Searching for iframe...`);
    const iframeIndex = html.indexOf('<iframe');
    if (iframeIndex !== -1) {
      console.log(`Iframe found:`, html.substring(iframeIndex, iframeIndex + 500));
    }
  }
}

test();

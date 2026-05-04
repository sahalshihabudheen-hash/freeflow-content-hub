
async function test() {
  const url = 'https://hentaicity.com/video/bible-black-episode-1/';
  console.log(`Fetching ${url}...`);
  const res = await fetch(url);
  const html = await res.text();
  const sourceMatch = html.match(/source src="([^"]+)" type="video\/mp4"/);
  if (sourceMatch) {
    console.log(`✅ Found source: ${sourceMatch[1]}`);
  } else {
    console.log(`❌ No source found`);
    // Print a bit of the HTML around where sources might be
    const index = html.indexOf('<video');
    if (index !== -1) {
      console.log(`Video tag found:`, html.substring(index, index + 500));
    }
  }
}

test();

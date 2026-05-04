
async function testAnify() {
  const anilistId = '1'; // Cowboy Bebop (not adult, but just to test connectivity)
  const target = `https://api.anify.tv/info/${anilistId}?type=anime`;
  try {
    console.log(`Testing Anify with ${target}...`);
    const res = await fetch(target, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Anify is working! Found ${data.title.english || data.title.romaji}`);
      console.log(`Providers:`, data.episodes?.map(p => p.providerId).join(', '));
    } else {
      console.log(`❌ Anify returned ${res.status}`);
    }
  } catch (e) {
    console.log(`❌ Anify failed: ${e.message}`);
  }
}

async function testHanime() {
  const query = 'Bible Black';
  try {
    console.log(`Testing Hanime Search for "${query}"...`);
    const hRes = await fetch('https://search.htv-services.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({
        search_text: query,
        tags: [], tags_mode: "AND", brands: [], blacklist: [],
        order_by: "created_at_unix", ordering: "desc", page: 0
      })
    });
    if (hRes.ok) {
      const hData = await hRes.json();
      const hits = JSON.parse(hData.hits || '[]');
      console.log(`✅ Hanime is working! Found ${hits.length} hits.`);
    } else {
      console.log(`❌ Hanime returned ${hRes.status}`);
    }
  } catch (e) {
    console.log(`❌ Hanime failed: ${e.message}`);
  }
}

testAnify().then(() => testHanime());


async function testHanime() {
  const slug = 'itadaki-seieki'; // Popular one for testing
  const url = `https://hanime.tv/api/v8/video?id=${slug}`;
  
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    
    if (data.videos_manifest) {
      console.log("Manifest found");
      const servers = data.videos_manifest.servers;
      console.log(`Servers: ${servers.length}`);
      if (servers.length > 0) {
        const streams = servers[0].streams;
        console.log(`Streams: ${streams.length}`);
        console.log("First stream URL:", streams[0].url.substring(0, 50) + "...");
      }
    } else {
      console.log("Manifest NOT found. Data keys:", Object.keys(data));
      if (data.video) {
         console.log("Video metadata found for:", data.video.name);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

testHanime();

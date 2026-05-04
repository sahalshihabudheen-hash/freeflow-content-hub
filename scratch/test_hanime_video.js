
async function test() {
  const slug = "pure-mail-1";
  const url = `https://hanime.tv/api/v8/video?id=${slug}`;
  console.log(`Testing Hanime Video: ${url}`);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await res.json();
    console.log("Success! Found video sources.");
    // Hanime uses a complex format but we can find the M3U8.
    console.log("Servers:", data.videos_manifest.servers[0].streams.length);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();


async function test() {
  const slug = "masquerade-1";
  const url = `https://jarvis-comics.vercel.app/api/anime/hanime/video/${slug}`;
  console.log(`Testing Masquerade: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Success! Found:", data.sources?.[0]?.url);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();

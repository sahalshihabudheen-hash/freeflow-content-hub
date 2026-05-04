
async function test() {
  const query = "Masquerade";
  const url = `https://jarvis-comics.vercel.app/api/anime/hanime/search/${encodeURIComponent(query)}`;
  console.log(`Searching: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Results:", data.results.map(r => r.slug));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();

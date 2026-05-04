
async function test() {
  const title = "Pure Mail";
  const url = `https://jarvis-comics.vercel.app/api/anime/hentaihaven/${encodeURIComponent(title)}`;
  console.log(`Searching: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Search Results:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();

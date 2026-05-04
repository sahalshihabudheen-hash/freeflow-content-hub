
async function test() {
  const query = "pure mail";
  const url = `https://jarvis-comics.vercel.app/api/anime/search/${encodeURIComponent(query)}`;
  console.log(`Testing Gogo Search: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Success! Found:", data.results?.length);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();

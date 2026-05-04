
async function test() {
  const query = "pure mail";
  const url = `https://api.amvstr.me/api/v2/hentai/search?q=${encodeURIComponent(query)}`;
  console.log(`Testing ${url}...`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Success! Found:", data.length);
    if (data.length > 0) {
      console.log("First Result ID:", data[0].id);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();

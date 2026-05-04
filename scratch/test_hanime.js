
async function test() {
  const query = "pure mail";
  const url = `https://hanime.tv/api/v8/search?usr_qry=${encodeURIComponent(query)}`;
  console.log(`Testing ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const data = await res.json();
    console.log("Success! Found:", data.hits);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();

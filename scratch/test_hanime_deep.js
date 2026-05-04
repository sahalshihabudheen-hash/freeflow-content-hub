
async function test() {
  const query = "pure mail";
  const url = `https://search.htv-services.com/`;
  console.log(`Testing Hanime Search...`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      body: JSON.stringify({
        search_text: query,
        tags: [],
        tags_mode: "AND",
        brands: [],
        blacklist: [],
        order_by: "created_at_unix",
        ordering: "desc",
        page: 0
      })
    });
    const data = await res.json();
    const parsed = JSON.parse(data.hits);
    console.log("Success! Results:", parsed.length);
    if (parsed.length > 0) {
      console.log("First Result Slug:", parsed[0].slug);
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();


async function test() {
  const id = "1";
  const url = `https://api.anify.tv/info/${id}?type=anime`;
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Anify Info:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();


async function test() {
  const url = "https://api.allorigins.win/raw?url=https://api.anify.tv/info/1?type=anime";
  console.log(`Testing ${url}...`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Success! Found:", data.title.english);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

test();

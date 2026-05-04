
const mirrors = [
  "https://c.delusionz.xyz",
  "https://consumet-api-production-e65a.up.railway.app",
  "https://api.consumet.stream",
  "https://api.amvstr.me",
  "https://api.anify.tv"
];

async function test() {
  for (const mirror of mirrors) {
    try {
      const url = mirror.includes('anify') ? `${mirror}/info/1?type=anime` : `${mirror}/meta/anilist/info/1`;
      console.log(`Testing ${mirror}...`);
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        console.log(`✅ ${mirror} is working!`);
      } else {
        console.log(`❌ ${mirror} returned ${res.status}`);
      }
    } catch (e) {
      console.log(`❌ ${mirror} failed: ${e.message}`);
    }
  }
}

test();

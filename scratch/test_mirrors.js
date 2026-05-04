
const mirrors = [
  "https://api.consumet.org",
  "https://consumet-api.ryuk-me.dev",
  "https://api-consumet-org-ashy.vercel.app",
  "https://c.delusionz.xyz",
  "https://consumet-api-production-e65a.up.railway.app",
  "https://api.consumet.stream"
];

async function test() {
  for (const mirror of mirrors) {
    try {
      const url = `${mirror}/meta/anilist/info/1`;
      console.log(`Testing ${mirror}...`);
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
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

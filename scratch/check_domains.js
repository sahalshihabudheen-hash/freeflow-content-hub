
const domains = [
  'hentai-city.com',
  'hentai-city.tv',
  'hentai-city.org',
  'hentai-city.net',
  'hentaicity.com'
];

async function checkDomains() {
  for (const domain of domains) {
    try {
      console.log(`Checking ${domain}...`);
      const res = await fetch(`https://${domain}`, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      console.log(`✅ ${domain} is up! Status: ${res.status}`);
    } catch (e) {
      console.log(`❌ ${domain} failed: ${e.message}`);
    }
  }
}

checkDomains();

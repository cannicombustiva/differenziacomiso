const https = require('https');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SERVICE_KEY || !PROJECT_REF) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_PROJECT_REF environment variables');
  process.exit(1);
}

const BASE = `${PROJECT_REF}.supabase.co`;

function get(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: BASE,
      path,
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    };
    let data = '';
    https.get(opts, r => {
      r.on('data', c => data += c);
      r.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const schedule = await get('/rest/v1/collection_schedule?select=id');
  const riciclabolario = await get('/rest/v1/riciclabolario?select=id');
  const announcements = await get('/rest/v1/announcements?select=title_it');

  console.log('Collection schedule entries:', schedule.length);
  console.log('Riciclabolario items:', riciclabolario.length);
  console.log('Announcements:', announcements.length);
  announcements.forEach(a => console.log(' -', a.title_it));
}

main().catch(console.error);

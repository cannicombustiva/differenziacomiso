const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZmdxZWVsanVnY3dqbnl3dWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUwNzY3MiwiZXhwIjoyMDg3MDgzNjcyfQ.3tAWTu6fE-qLXwUiph_uONCPB9nLVlOSXf0rdFL-L_8';
const BASE = 'ejfgqeeljugcwjnywuhz.supabase.co';

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

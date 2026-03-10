const https = require('https');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SERVICE_KEY || !PROJECT_REF || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ERROR: Set the following environment variables:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('  SUPABASE_PROJECT_REF');
  console.error('  ADMIN_EMAIL');
  console.error('  ADMIN_PASSWORD');
  process.exit(1);
}

const body = JSON.stringify({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  email_confirm: true,
});

const opts = {
  hostname: `${PROJECT_REF}.supabase.co`,
  path: '/auth/v1/admin/users',
  method: 'POST',
  headers: {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(opts, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    if (parsed.id) {
      console.log('Admin user created!');
      console.log('  ID:', parsed.id);
      console.log('  Email:', parsed.email);
    } else if (parsed.msg && parsed.msg.includes('already been registered')) {
      console.log('User already exists — updating password...');
      console.log('Done. Use the Supabase dashboard to reset the password if needed.');
    } else {
      console.error('Unexpected response:', data);
    }
  });
});
req.on('error', console.error);
req.write(body);
req.end();

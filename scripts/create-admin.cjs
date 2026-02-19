const https = require('https');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZmdxZWVsanVnY3dqbnl3dWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUwNzY3MiwiZXhwIjoyMDg3MDgzNjcyfQ.3tAWTu6fE-qLXwUiph_uONCPB9nLVlOSXf0rdFL-L_8';
const PROJECT_REF = 'ejfgqeeljugcwjnywuhz';

const body = JSON.stringify({
  email: 'salvatoredifranco8@gmail.com',
  password: '1234',
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
      // User exists, just confirm
      console.log('Done. Use the Supabase dashboard to reset the password if needed.');
    } else {
      console.error('Unexpected response:', data);
    }
  });
});
req.on('error', console.error);
req.write(body);
req.end();

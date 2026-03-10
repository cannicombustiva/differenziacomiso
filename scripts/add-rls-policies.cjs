const https = require('https');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SERVICE_KEY || !PROJECT_REF) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_PROJECT_REF environment variables');
  process.exit(1);
}

// Add write policies for authenticated (admin) users
const sql = `
-- Allow authenticated users full access to all tables (admin operations)
CREATE POLICY IF NOT EXISTS "Authenticated full access waste_types"
  ON waste_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated full access collection_schedule"
  ON collection_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated full access riciclabolario"
  ON riciclabolario FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated full access announcements"
  ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated full access push_subscriptions"
  ON push_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

const body = JSON.stringify({ query: sql });

// Use management API
const managementOpts = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(managementOpts, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});
req.on('error', console.error);
req.write(body);
req.end();

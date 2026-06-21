/**
 * Apply the pending DDL migrations to Supabase via a direct Postgres connection
 * (session pooler, port 5432 — DDL needs session mode). Reads the DB password
 * from .env.local (SUPABASE_DB_PASSWORD); the project ref is derived from
 * NEXT_PUBLIC_SUPABASE_URL.
 *
 * Run: node scripts/apply-migrations.mjs
 */
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const env = {};
for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const password = env.SUPABASE_DB_PASSWORD;
if (!url || !password) throw new Error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD in .env.local');
const ref = new URL(url).hostname.split('.')[0];

// Pending migrations, in order. The older ones are already applied in prod.
const PENDING = [
  '20260621000000_pickup_notes.sql',
  '20260621100000_drop_riciclabolario_gin_index.sql',
  '20260621110000_admin_write_rls.sql',
  '20260621120000_lock_push_subscriptions.sql',
];

const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;

async function main() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log(`Connected to project ${ref}\n`);

  for (const file of PENDING) {
    const sql = readFileSync(join(ROOT, 'supabase', 'migrations', file), 'utf8');
    process.stdout.write(`Applying ${file} ... `);
    try {
      await client.query(sql);
      console.log('ok');
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
      await client.end();
      process.exit(1);
    }
  }

  console.log('\nVerifying:');
  const cols = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='collection_schedule' AND column_name IN ('note_it','note_en')"
  );
  console.log(`  note columns present: ${cols.rows.map((r) => r.column_name).join(', ') || 'NONE'}`);
  const fn = await client.query("SELECT proname FROM pg_proc WHERE proname='is_admin'");
  console.log(`  is_admin() exists: ${fn.rows.length > 0}`);
  const pol = await client.query("SELECT policyname FROM pg_policies WHERE tablename='push_subscriptions'");
  console.log(`  push_subscriptions policies (expect 0): ${pol.rows.length}`);

  await client.end();
  console.log('\nMigrations applied.');
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });

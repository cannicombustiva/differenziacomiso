import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase direct connection string
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!PROJECT_REF || !DB_PASSWORD) {
  console.error('ERROR: Set SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD environment variables');
  console.error('You can find the password in: Supabase Dashboard > Settings > Database > Connection string');
  process.exit(1);
}

const connectionString = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  console.log('Connecting to Supabase database...');
  await client.connect();
  console.log('Connected!\n');

  // Run migration
  console.log('=== Running migration ===');
  const migration = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
    'utf-8'
  );
  await client.query(migration);
  console.log('Migration completed!\n');

  // Run seed
  console.log('=== Running seed ===');
  const seed = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'seed.sql'),
    'utf-8'
  );
  await client.query(seed);
  console.log('Seed completed!\n');

  // Verify
  const { rows: wasteTypes } = await client.query('SELECT name_it, color_hex FROM waste_types ORDER BY sort_order');
  console.log('Waste types:', wasteTypes.length);
  wasteTypes.forEach(wt => console.log(`  - ${wt.name_it} (${wt.color_hex})`));

  const { rows: scheduleCount } = await client.query('SELECT COUNT(*) as count FROM collection_schedule');
  console.log(`\nCollection schedule entries: ${scheduleCount[0].count}`);

  const { rows: holidays } = await client.query("SELECT date, holiday_note_it FROM collection_schedule WHERE is_holiday = true ORDER BY date");
  console.log(`Holidays: ${holidays.length}`);
  holidays.forEach(h => console.log(`  - ${h.date.toISOString().split('T')[0]}: ${h.holiday_note_it}`));

  const { rows: riciclabolario } = await client.query('SELECT COUNT(*) as count FROM riciclabolario');
  console.log(`\nRiciclabolario items: ${riciclabolario[0].count}`);

  const { rows: announcements } = await client.query('SELECT COUNT(*) as count FROM announcements');
  console.log(`Announcements: ${announcements[0].count}`);

  await client.end();
  console.log('\nDone! Database is ready.');
}

run().catch(err => {
  console.error('Error:', err.message);
  client.end();
  process.exit(1);
});

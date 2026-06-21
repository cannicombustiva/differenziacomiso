/**
 * Apply ONLY the regenerated 2026 collection_schedule from supabase/seed.sql to
 * Supabase via the REST API (service role bypasses RLS). Faithful: it parses the
 * reviewed seed.sql rather than recomputing. Idempotent: deletes the 2026 date
 * range, then bulk-inserts.
 *
 * Dry run (no writes):  node scripts/apply-2026-schedule.mjs
 * Apply:                node scripts/apply-2026-schedule.mjs --apply
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// --- load env from .env.local ---
const env = {};
for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');

// --- parse the schedule INSERT from seed.sql ---
function parseTuple(inner) {
  const out = [];
  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && (inner[i] === ' ' || inner[i] === ',')) i++;
    if (i >= inner.length) break;
    if (inner[i] === "'") {
      i++;
      let s = '';
      while (i < inner.length) {
        if (inner[i] === "'" && inner[i + 1] === "'") { s += "'"; i += 2; continue; }
        if (inner[i] === "'") { i++; break; }
        s += inner[i++];
      }
      out.push(s);
    } else {
      let t = '';
      while (i < inner.length && inner[i] !== ',') t += inner[i++];
      t = t.trim();
      out.push(t === 'NULL' ? null : t === 'true' ? true : t === 'false' ? false : t);
    }
  }
  return out;
}

const seed = readFileSync(join(ROOT, 'supabase', 'seed.sql'), 'utf8');
const block = seed.match(/INSERT INTO collection_schedule \([^)]*\) VALUES\n([\s\S]*?);\n/);
if (!block) throw new Error('Could not find the collection_schedule INSERT in seed.sql');

const rows = block[1]
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((line) => {
    const inner = line.replace(/^\(/, '').replace(/\)[,;]?$/, '');
    const f = parseTuple(inner);
    return {
      date: f[0],
      waste_type_id: f[1],
      is_holiday: f[2],
      holiday_note_it: f[3],
      holiday_note_en: f[4],
      note_it: f[5],
      note_en: f[6],
    };
  });

// --- integrity assertions before touching the DB ---
const FIFTH_THURS = ['2026-01-29', '2026-07-30', '2026-10-29', '2026-12-31'];
const apr30 = rows.filter((r) => r.date === '2026-04-30');
const jan7Recupero = rows.find((r) => r.date === '2026-01-07' && r.note_it === 'Recupero del 6/1');
const assert = (c, m) => { if (!c) throw new Error(`ASSERT FAILED: ${m}`); };

assert(rows.length === 412, `expected 412 rows, got ${rows.length}`);
for (const d of FIFTH_THURS) assert(rows.every((r) => r.date !== d), `${d} should have no row (empty 5th Thursday)`);
assert(apr30.length === 1 && apr30[0].waste_type_id === 'a1000000-0000-0000-0000-000000000001', '30 Apr must be a single Secco Residuo row');
assert(!!jan7Recupero, '7 Jan must carry the "Recupero del 6/1" note');

console.log(`Parsed ${rows.length} schedule rows. Integrity checks passed.`);
console.log(`  empty 5th Thursdays: ${FIFTH_THURS.join(', ')}`);
console.log(`  30 Apr -> Secco Residuo; 4 Recupero notes present`);

if (!process.argv.includes('--apply')) {
  console.log('\nDRY RUN — no writes. Re-run with --apply to write to Supabase.');
  process.exit(0);
}

// --- apply via REST ---
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function main() {
  console.log('\nDeleting existing 2026 rows...');
  const del = await fetch(`${URL}/rest/v1/collection_schedule?date=gte.2026-01-01&date=lte.2026-12-31`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' },
  });
  if (!del.ok) throw new Error(`DELETE failed: ${del.status} ${await del.text()}`);
  console.log('Deleted.');

  // If the note columns aren't in prod yet, omit them so the schedule can still
  // be restored; the Recupero note text is applied later once the column exists.
  const noNotes = process.argv.includes('--no-notes');
  const payload = noNotes
    ? rows.map(({ note_it, note_en, ...r }) => r)
    : rows;

  const BATCH = 200;
  for (let i = 0; i < payload.length; i += BATCH) {
    const chunk = payload.slice(i, i + BATCH);
    const res = await fetch(`${URL}/rest/v1/collection_schedule`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`INSERT batch ${i} failed: ${res.status} ${await res.text()}`);
    console.log(`Inserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  // verify
  const count = await fetch(`${URL}/rest/v1/collection_schedule?date=gte.2026-01-01&date=lte.2026-12-31&select=id`, {
    headers: { ...headers, Prefer: 'count=exact', Range: '0-0' },
  });
  console.log(`\nVerify: 2026 rows now = ${count.headers.get('content-range')}`);
  const jul30 = await (await fetch(`${URL}/rest/v1/collection_schedule?date=eq.2026-07-30&select=date`, { headers })).json();
  const apr = await (await fetch(`${URL}/rest/v1/collection_schedule?date=eq.2026-04-30&select=waste_type_id`, { headers })).json();
  console.log(`  2026-07-30 rows: ${jul30.length} (expect 0)`);
  console.log(`  2026-04-30 waste_type_id: ${apr.map((r) => r.waste_type_id).join(',') || '(none)'} (expect ...001 Secco)`);
  console.log('\nDone.');
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });

/**
 * Regenerate the 2026 collection_schedule section of supabase/seed.sql from the
 * single Settimana Tipo rule (src/lib/settimana-tipo), then layer the documented
 * Exceptions on top (Holidays, Recuperi, and the 30 Apr 2026 -> Secco one-off).
 *
 * Per ADR 0001 the Schedule stores final state: each date emits the exact rows
 * that are actually collected, with no relational link from a Recupero to the
 * Holiday it makes up for — only an explanatory note.
 *
 * Run: `pnpm seed:generate`. It rewrites only the schedule block of seed.sql
 * (waste_types / riciclabolario / announcements stay byte-identical) and prints
 * the semantic old->new diff for human review (issue #21, HITL).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { settimanaTipo, type WasteKey } from '../src/lib/settimana-tipo';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(HERE, '..', 'supabase', 'seed.sql');

const WASTE_UUID: Record<WasteKey, string> = {
  secco_residuo: 'a1000000-0000-0000-0000-000000000001',
  umido: 'a1000000-0000-0000-0000-000000000002',
  carta_e_cartone: 'a1000000-0000-0000-0000-000000000003',
  plastica: 'a1000000-0000-0000-0000-000000000004',
  vetro: 'a1000000-0000-0000-0000-000000000005',
  lattine: 'a1000000-0000-0000-0000-000000000006',
  abiti_usati: 'a1000000-0000-0000-0000-000000000007',
};

type Holiday = { it: string; en: string };
const HOLIDAYS: Record<string, Holiday> = {
  '2026-01-01': { it: 'Capodanno', en: "New Year's Day" },
  '2026-01-06': { it: 'Epifania', en: 'Epiphany' },
  '2026-04-06': { it: "Lunedì dell'Angelo (Pasquetta)", en: 'Easter Monday' },
  '2026-04-25': { it: 'Festa della Liberazione', en: 'Liberation Day' },
  '2026-05-01': { it: 'Festa dei Lavoratori', en: 'Labour Day' },
  '2026-06-02': { it: 'Festa della Repubblica', en: 'Republic Day' },
  '2026-07-13': { it: 'Festa patronale', en: 'Local patron saint feast' },
  '2026-08-15': { it: 'Ferragosto', en: 'Assumption of Mary' },
  '2026-12-08': { it: 'Immacolata Concezione', en: 'Immaculate Conception' },
  '2026-12-25': { it: 'Natale', en: 'Christmas Day' },
  '2026-12-26': { it: 'Santo Stefano', en: "St. Stephen's Day" },
};

// Recupero: a Pickup added to a later operating date to make up for one lost to
// a Holiday. `remove` is the normal Pickup suppressed to make room (invisible to
// citizens). `note` explains the added Pickup ("Recupero del N/M").
type Recupero = { add: WasteKey; remove: WasteKey[]; it: string; en: string };
const RECUPERI: Record<string, Recupero> = {
  '2026-01-07': { add: 'plastica', remove: ['lattine'], it: 'Recupero del 6/1', en: 'Recovered from 6/1' },
  '2026-05-02': { add: 'carta_e_cartone', remove: [], it: 'Recupero del 1/5', en: 'Recovered from 1/5' },
  '2026-06-03': { add: 'plastica', remove: ['lattine'], it: 'Recupero del 2/6', en: 'Recovered from 2/6' },
  '2026-12-09': { add: 'plastica', remove: ['lattine'], it: 'Recupero del 8/12', en: 'Recovered from 8/12' },
};

// Documented one-off overrides of the Settimana Tipo (not derived from the rule).
const ONE_OFFS: Record<string, WasteKey[]> = {
  '2026-04-30': ['secco_residuo'], // 5th Thursday: rule is empty; calendar lists Secco
};

type Pickup = { key: WasteKey; note?: { it: string; en: string } };
type Day = { iso: string; holiday?: Holiday; pickups: Pickup[] };

function eachDay2026(): Date[] {
  const days: Date[] = [];
  for (let d = new Date(2026, 0, 1); d.getFullYear() === 2026; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** The new schedule for a date: rule baseline + Exceptions. */
function newDay(d: Date): Day {
  const date = iso(d);
  if (HOLIDAYS[date]) return { iso: date, holiday: HOLIDAYS[date], pickups: [] };

  let keys: WasteKey[] = ONE_OFFS[date] ?? settimanaTipo(d);
  const recupero = RECUPERI[date];
  if (recupero) {
    keys = keys.filter((k) => !recupero.remove.includes(k));
    keys = [...keys, recupero.add];
  }
  const pickups: Pickup[] = keys.map((key) => ({
    key,
    note: recupero && key === recupero.add ? { it: recupero.it, en: recupero.en } : undefined,
  }));
  return { iso: date, pickups };
}

/** The OLD schedule a date resolved to, for the review diff: the previous
 * hand-written seed (week-5 Giovedì wrote Abiti, no Recupero notes). */
function oldDay(d: Date): Day {
  const date = iso(d);
  if (HOLIDAYS[date]) return { iso: date, holiday: HOLIDAYS[date], pickups: [] };

  const dow = d.getDay();
  const week = Math.ceil(d.getDate() / 7);
  let keys: WasteKey[] = [];
  switch (dow) {
    case 1: keys = ['umido', 'vetro']; break;
    case 2: keys = ['plastica']; break;
    case 3: keys = ['umido', 'lattine']; break;
    case 4: keys = week === 1 || week === 3 ? ['secco_residuo'] : ['abiti_usati']; break; // old seed: week 5 -> Abiti (ELSE)
    case 5: keys = ['carta_e_cartone']; break;
    case 6: keys = ['umido']; break;
    default: keys = [];
  }
  const recupero = RECUPERI[date];
  if (recupero) {
    keys = keys.filter((k) => !recupero.remove.includes(k));
    keys = [...keys, recupero.add]; // old seed added the Pickup but carried no note
  }
  return { iso: date, pickups: keys.map((key) => ({ key })) };
}

function sql(v: string | null): string {
  return v === null ? 'NULL' : `'${v.replace(/'/g, "''")}'`;
}

function rowsFor(day: Day): string[] {
  if (day.holiday) {
    return [
      `  ('${day.iso}', NULL, true, ${sql(day.holiday.it)}, ${sql(day.holiday.en)}, NULL, NULL)`,
    ];
  }
  return day.pickups.map(
    (p) =>
      `  ('${day.iso}', '${WASTE_UUID[p.key]}', false, NULL, NULL, ${sql(p.note?.it ?? null)}, ${sql(p.note?.en ?? null)})`,
  );
}

function buildScheduleBlock(days: Day[]): string {
  const rows = days.flatMap(rowsFor);
  return [
    '-- ============================================================',
    '-- SEED: 2026 collection schedule (generated by scripts/generate-seed.ts)',
    '-- ============================================================',
    '-- Generated from the single Settimana Tipo rule (src/lib/settimana-tipo)',
    '-- with Exceptions layered on top. Do not edit by hand — run',
    '-- `pnpm seed:generate`. 5th Thursdays are empty; 30 Apr 2026 is Secco.',
    '',
    "DELETE FROM collection_schedule WHERE date >= '2026-01-01' AND date <= '2026-12-31';",
    '',
    'INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en, note_it, note_en) VALUES',
    rows.join(',\n') + ';',
    '',
  ].join('\n');
}

function summarize(day: Day): string {
  if (day.holiday) return `HOLIDAY (${day.holiday.it})`;
  if (day.pickups.length === 0) return '(no collection)';
  return day.pickups.map((p) => (p.note ? `${p.key}[${p.note.it}]` : p.key)).join(', ');
}

function printDiff(days: Date[]): void {
  let changes = 0;
  console.log('--- Semantic schedule diff (old seed -> new generated) ---');
  for (const d of days) {
    const before = summarize(oldDay(d));
    const after = summarize(newDay(d));
    if (before !== after) {
      changes++;
      console.log(`${iso(d)}:  ${before}  ->  ${after}`);
    }
  }
  console.log(`--- ${changes} date(s) changed ---`);
}

function main(): void {
  const days = eachDay2026();
  const block = buildScheduleBlock(days.map(newDay));

  const src = readFileSync(SEED_PATH, 'utf8');
  const SCHEDULE_ANCHOR = '-- ============================================================\n-- SEED: 2026 collection schedule';
  const RICICLA_ANCHOR = '-- ============================================================\n-- SEED: Riciclabolario';
  const start = src.indexOf(SCHEDULE_ANCHOR);
  const end = src.indexOf(RICICLA_ANCHOR);
  if (start === -1 || end === -1) throw new Error('Could not locate schedule section anchors in seed.sql');

  const next = src.slice(0, start) + block + '\n' + src.slice(end);
  writeFileSync(SEED_PATH, next);
  console.log(`Wrote ${SEED_PATH}`);
  printDiff(days);
}

main();

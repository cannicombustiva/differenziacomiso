import { describe, it, expect } from 'vitest';
import { dayStatus, isOutsideCoverage, type CoverageRange } from '@/lib/coverage';
import type { CollectionDayGrouped, WasteType } from '@/types';

const UMIDO: WasteType = {
  id: 'a1000000-0000-0000-0000-000000000002',
  name_it: 'Umido',
  name_en: 'Organic',
  color_hex: '#8B5E3C',
  sort_order: 2,
  created_at: '2026-01-01T00:00:00Z',
};

const YEAR_2026: CoverageRange[] = [
  { start_date: '2026-01-01', end_date: '2026-12-31', source: 'seed' },
];

const day = (over: Partial<CollectionDayGrouped> = {}): CollectionDayGrouped => ({
  date: '2026-06-17',
  wasteTypes: [],
  isHoliday: false,
  ...over,
});

describe('dayStatus', () => {
  it('reports pickups for a covered date that collects something', () => {
    expect(dayStatus('2026-06-17', day({ wasteTypes: [UMIDO] }), YEAR_2026)).toBe('pickups');
  });

  it('reports no-collection for a covered date with no Pickups at all', () => {
    // A Sunday. No rows come back for it, so there is no Collection object —
    // inside Coverage that absence is a real day off, not a gap in the data.
    expect(dayStatus('2026-06-21', undefined, YEAR_2026)).toBe('no-collection');
  });

  it('reports no-collection for a covered date whose Collection is empty', () => {
    expect(dayStatus('2026-06-21', day({ date: '2026-06-21' }), YEAR_2026)).toBe('no-collection');
  });

  it('reports holiday for a covered Holiday, distinctly from a plain day off', () => {
    const holiday = day({ date: '2026-08-15', isHoliday: true, holidayNote: 'Ferragosto' });
    expect(dayStatus('2026-08-15', holiday, YEAR_2026)).toBe('holiday');
  });

  it('reports unscheduled beyond the end of Coverage', () => {
    // The 1 Jan 2027 case: no rows, and no Coverage either. Absence here means
    // "never loaded", not "nothing collected".
    expect(dayStatus('2027-01-01', undefined, YEAR_2026)).toBe('unscheduled');
  });

  it('reports unscheduled before the start of Coverage', () => {
    expect(dayStatus('2025-12-31', undefined, YEAR_2026)).toBe('unscheduled');
  });

  it('reports unscheduled inside a gap between two Coverage ranges', () => {
    const ranges: CoverageRange[] = [
      { start_date: '2026-01-01', end_date: '2026-06-30', source: 'seed' },
      { start_date: '2026-09-01', end_date: '2026-12-31', source: 'import' },
    ];
    expect(dayStatus('2026-07-15', undefined, ranges)).toBe('unscheduled');
    expect(dayStatus('2026-06-30', undefined, ranges)).toBe('no-collection');
    expect(dayStatus('2026-09-01', undefined, ranges)).toBe('no-collection');
  });

  it('treats Coverage boundaries as inclusive', () => {
    expect(dayStatus('2026-01-01', undefined, YEAR_2026)).toBe('no-collection');
    expect(dayStatus('2026-12-31', undefined, YEAR_2026)).toBe('no-collection');
  });

  it('never claims unscheduled when Coverage is unknown', () => {
    // Offline, or the Coverage read failed. Reporting "not yet available" on a
    // year we simply could not check would be its own kind of lie, so the app
    // falls back to the pre-Coverage reading of the data.
    expect(dayStatus('2027-01-01', undefined, null)).toBe('no-collection');
    expect(dayStatus('2027-01-01', day({ wasteTypes: [UMIDO] }), null)).toBe('pickups');
  });

  it('prefers a Holiday reading over Pickups on the same date', () => {
    // A Recupero can sit on a date also marked Holiday; the citizen-facing
    // message for a Holiday wins.
    const both = day({ date: '2026-01-06', isHoliday: true, wasteTypes: [UMIDO] });
    expect(dayStatus('2026-01-06', both, YEAR_2026)).toBe('holiday');
  });

  it('treats an empty Coverage table as unknown, not as "nothing is covered"', () => {
    // The deploy window: app live, migration not yet run. Reading [] as "no date
    // is covered" would black out the whole seeded year for every Citizen.
    expect(dayStatus('2026-06-17', day({ wasteTypes: [UMIDO] }), [])).toBe('pickups');
    expect(dayStatus('2026-06-21', undefined, [])).toBe('no-collection');
    expect(dayStatus('2027-01-01', undefined, [])).toBe('no-collection');
  });
});

describe('isOutsideCoverage', () => {
  it('is false for a date inside a Coverage range', () => {
    expect(isOutsideCoverage('2026-06-17', YEAR_2026)).toBe(false);
  });

  it('is true for a date past the end of every range', () => {
    expect(isOutsideCoverage('2027-01-01', YEAR_2026)).toBe(true);
  });

  it('is true for a date in a gap between two ranges', () => {
    const ranges: CoverageRange[] = [
      { start_date: '2026-01-01', end_date: '2026-06-30', source: 'seed' },
      { start_date: '2026-09-01', end_date: '2026-12-31', source: 'import' },
    ];
    expect(isOutsideCoverage('2026-07-15', ranges)).toBe(true);
  });

  it('is false when Coverage is unknown, so callers fall back rather than go silent', () => {
    // Same rule dayStatus applies: Coverage may withhold a claim, never
    // manufacture one. An unreadable (null) or not-yet-migrated ([]) table must
    // not silence the evening Notification for the whole seeded year.
    expect(isOutsideCoverage('2027-01-01', null)).toBe(false);
    expect(isOutsideCoverage('2027-01-01', [])).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { groupCollections, type ScheduleRow } from '@/lib/group-collections';
import type { WasteType } from '@/types';

function wasteType(id: string, name_it: string): WasteType {
  return { id, name_it, name_en: name_it, color_hex: '#000', sort_order: 0, created_at: '' };
}

function row(over: Partial<ScheduleRow> & { date: string }): ScheduleRow {
  return {
    is_holiday: false,
    holiday_note_it: null,
    holiday_note_en: null,
    note_it: null,
    note_en: null,
    waste_types: null,
    ...over,
  };
}

const UMIDO = wasteType('1', 'Umido');
const VETRO = wasteType('2', 'Vetro');

describe('groupCollections', () => {
  it('groups multiple Pickups on one date into a single Collection', () => {
    const grouped = groupCollections(
      [
        row({ date: '2026-06-15', waste_types: UMIDO }),
        row({ date: '2026-06-15', waste_types: VETRO }),
      ],
      'it'
    );
    expect(grouped).toHaveLength(1);
    expect(grouped[0].date).toBe('2026-06-15');
    expect(grouped[0].wasteTypes).toEqual([UMIDO, VETRO]);
  });

  it('passes a Holiday through with its isHoliday flag and holiday note', () => {
    const grouped = groupCollections(
      [
        row({
          date: '2026-01-01',
          is_holiday: true,
          holiday_note_it: 'Capodanno',
          holiday_note_en: 'New Year',
        }),
      ],
      'it'
    );
    expect(grouped[0].isHoliday).toBe(true);
    expect(grouped[0].holidayNote).toBe('Capodanno');
    expect(grouped[0].wasteTypes).toEqual([]);
  });

  it("exposes a Recupero Pickup's note on the grouped day", () => {
    const grouped = groupCollections(
      [
        row({
          date: '2026-01-07',
          waste_types: wasteType('4', 'Plastica'),
          note_it: 'Recupero del 6/1',
          note_en: 'Recovered from 6 Jan',
        }),
      ],
      'it'
    );
    expect(grouped[0].notes).toEqual(['Recupero del 6/1']);
  });

  it('uses English notes and holiday note when locale is en', () => {
    const grouped = groupCollections(
      [
        row({
          date: '2026-01-07',
          waste_types: wasteType('4', 'Plastica'),
          note_it: 'Recupero del 6/1',
          note_en: 'Recovered from 6 Jan',
        }),
      ],
      'en'
    );
    expect(grouped[0].notes).toEqual(['Recovered from 6 Jan']);
  });

  it('falls back to Italian when the English text is missing (locale en)', () => {
    const grouped = groupCollections(
      [
        row({
          date: '2026-01-07',
          waste_types: wasteType('4', 'Plastica'),
          note_it: 'Recupero del 6/1',
          note_en: null,
        }),
        row({
          date: '2026-01-01',
          is_holiday: true,
          holiday_note_it: 'Capodanno',
          holiday_note_en: null,
        }),
      ],
      'en'
    );
    const recupero = grouped.find((g) => g.date === '2026-01-07')!;
    const holiday = grouped.find((g) => g.date === '2026-01-01')!;
    expect(recupero.notes).toEqual(['Recupero del 6/1']);
    expect(holiday.holidayNote).toBe('Capodanno');
  });
});

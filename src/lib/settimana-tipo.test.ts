import { describe, it, expect } from 'vitest';
import { settimanaTipo } from '@/lib/settimana-tipo';

// Local-midnight dates; January 2026 starts on a Thursday.
const d = (year: number, month1: number, day: number) => new Date(year, month1 - 1, day);

describe('settimanaTipo', () => {
  it('collects Umido and Vetro on Monday', () => {
    expect(settimanaTipo(d(2026, 1, 5))).toEqual(['umido', 'vetro']); // Mon 5 Jan
  });

  it('follows the fixed weekday pattern Tue–Sun', () => {
    expect(settimanaTipo(d(2026, 1, 6))).toEqual(['plastica']);           // Tue
    expect(settimanaTipo(d(2026, 1, 7))).toEqual(['umido', 'lattine']);   // Wed
    expect(settimanaTipo(d(2026, 1, 9))).toEqual(['carta_e_cartone']);    // Fri
    expect(settimanaTipo(d(2026, 1, 10))).toEqual(['umido']);             // Sat
    expect(settimanaTipo(d(2026, 1, 11))).toEqual([]);                    // Sun
  });

  it('alternates Secco (weeks 1,3) and Abiti Usati (weeks 2,4) on Thursday', () => {
    expect(settimanaTipo(d(2026, 2, 5))).toEqual(['secco_residuo']);  // Thu, week 1
    expect(settimanaTipo(d(2026, 1, 8))).toEqual(['abiti_usati']);    // Thu, week 2
    expect(settimanaTipo(d(2026, 1, 15))).toEqual(['secco_residuo']); // Thu, week 3
    expect(settimanaTipo(d(2026, 1, 22))).toEqual(['abiti_usati']);   // Thu, week 4
  });

  it('has no Giovedì Pickup on a 5th Thursday', () => {
    // All five 2026 fifth-Thursdays — the rule is exception-free, so Apr 30 is [] here too.
    expect(settimanaTipo(d(2026, 1, 29))).toEqual([]);
    expect(settimanaTipo(d(2026, 4, 30))).toEqual([]);
    expect(settimanaTipo(d(2026, 7, 30))).toEqual([]);
    expect(settimanaTipo(d(2026, 10, 29))).toEqual([]);
    expect(settimanaTipo(d(2026, 12, 31))).toEqual([]);
  });
});

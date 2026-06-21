import { describe, it, expect } from 'vitest';
import { settimanaTipo, WASTE_KEY_NAME_IT } from '@/lib/settimana-tipo';

describe('settimanaTipo', () => {
  it('collects Umido and Vetro on a Monday', () => {
    // 2026-06-15 is a Monday. Local-date constructor keeps getDay() host-stable.
    expect(settimanaTipo(new Date(2026, 5, 15))).toEqual(['umido', 'vetro']);
  });

  it('follows the fixed weekday pattern for the non-Thursday days', () => {
    // Week of 2026-06-15: Mon 15 … Sun 21.
    expect(settimanaTipo(new Date(2026, 5, 16))).toEqual(['plastica']); // Tue
    expect(settimanaTipo(new Date(2026, 5, 17))).toEqual(['umido', 'lattine']); // Wed
    expect(settimanaTipo(new Date(2026, 5, 19))).toEqual(['carta_e_cartone']); // Fri
    expect(settimanaTipo(new Date(2026, 5, 20))).toEqual(['umido']); // Sat
    expect(settimanaTipo(new Date(2026, 5, 21))).toEqual([]); // Sun — no collection
  });

  it('alternates Giovedì by week-of-month: Secco on weeks 1,3 and Abiti on weeks 2,4', () => {
    // June 2026 Thursdays: 4 (wk1), 11 (wk2), 18 (wk3), 25 (wk4) — ceil(day/7).
    expect(settimanaTipo(new Date(2026, 5, 4))).toEqual(['secco_residuo']); // wk1
    expect(settimanaTipo(new Date(2026, 5, 11))).toEqual(['abiti_usati']); // wk2
    expect(settimanaTipo(new Date(2026, 5, 18))).toEqual(['secco_residuo']); // wk3
    expect(settimanaTipo(new Date(2026, 5, 25))).toEqual(['abiti_usati']); // wk4
  });

  it('has no Giovedì Pickup on a 5th Thursday (all five of 2026)', () => {
    // ADR 0002: 5th Thursdays are an empty set, not a fortnightly guess.
    expect(settimanaTipo(new Date(2026, 0, 29))).toEqual([]); // Jan 29
    expect(settimanaTipo(new Date(2026, 3, 30))).toEqual([]); // Apr 30
    expect(settimanaTipo(new Date(2026, 6, 30))).toEqual([]); // Jul 30
    expect(settimanaTipo(new Date(2026, 9, 29))).toEqual([]); // Oct 29
    expect(settimanaTipo(new Date(2026, 11, 31))).toEqual([]); // Dec 31
  });
});

describe('WASTE_KEY_NAME_IT', () => {
  it('maps every rule key to its canonical Italian waste-type name', () => {
    // Consumers resolve rule keys to waste_types rows by name_it; a typo here
    // would silently drop a Pickup, so pin the exact names.
    expect(WASTE_KEY_NAME_IT).toEqual({
      secco_residuo: 'Secco Residuo',
      umido: 'Umido',
      carta_e_cartone: 'Carta e Cartone',
      plastica: 'Plastica',
      vetro: 'Vetro',
      lattine: 'Lattine',
      abiti_usati: 'Abiti Usati',
    });
  });
});

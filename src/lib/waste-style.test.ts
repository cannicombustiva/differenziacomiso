import { describe, it, expect } from 'vitest';
import { wasteSlug, wasteVisual, textOn } from '@/lib/waste-style';
import type { WasteType } from '@/types';

const make = (name_it: string): WasteType => ({
  id: name_it,
  name_it,
  name_en: name_it,
  color_hex: '#000000',
  sort_order: 0,
  created_at: '',
});

describe('wasteSlug', () => {
  it('maps Italian names to their slug', () => {
    expect(wasteSlug(make('Plastica'))).toBe('plastica');
    expect(wasteSlug(make('Vetro'))).toBe('vetro');
    expect(wasteSlug(make('Lattine'))).toBe('lattine');
    expect(wasteSlug(make('Carta e Cartone'))).toBe('carta');
    expect(wasteSlug(make('Umido'))).toBe('umido');
    expect(wasteSlug(make('Abiti Usati'))).toBe('abiti');
    expect(wasteSlug(make('Secco Residuo'))).toBe('secco');
  });

  it('falls back to secco for unknown names', () => {
    expect(wasteSlug(make('Qualcosa'))).toBe('secco');
  });
});

describe('wasteVisual', () => {
  it('returns the refreshed palette, ignoring the stale color_hex', () => {
    const v = wasteVisual(make('Plastica'));
    expect(v).toMatchObject({ slug: 'plastica', color: '#E8B500', ink: '#3A2E00' });
  });
});

describe('textOn', () => {
  it('returns dark ink on light backgrounds and white on dark', () => {
    expect(textOn('#E8B500')).toBe('#1A1A1A');
    expect(textOn('#1B5E20')).toBe('#FFFFFF');
  });
});

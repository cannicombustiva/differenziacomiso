import { describe, it, expect } from 'vitest';
import {
  MAX_IMPORT_PDF_BYTES,
  checkImportFile,
  checkImportRange,
  wholeYearRange,
} from './import-intake';

const PDF_HEAD = new TextEncoder().encode('%PDF-1.7\n');

const pdf = (overrides: Partial<{ name: string; type: string; size: number }> = {}) => ({
  name: 'calendario-2027.pdf',
  type: 'application/pdf',
  size: 250_000,
  ...overrides,
});

describe('checkImportFile', () => {
  it('accepts a PDF under the size limit', () => {
    expect(checkImportFile(pdf())).toBeNull();
    expect(checkImportFile(pdf(), PDF_HEAD)).toBeNull();
  });

  it('accepts a PDF at exactly the size limit', () => {
    expect(checkImportFile(pdf({ size: MAX_IMPORT_PDF_BYTES }))).toBeNull();
  });

  it('rejects a file over the size limit', () => {
    expect(checkImportFile(pdf({ size: MAX_IMPORT_PDF_BYTES + 1 }))).toBe('too-large');
  });

  it('rejects an empty file', () => {
    expect(checkImportFile(pdf({ size: 0 }))).toBe('empty');
  });

  it('rejects a file that does not declare itself a PDF', () => {
    expect(checkImportFile(pdf({ name: 'calendario.png', type: 'image/png' }))).toBe('not-pdf');
  });

  it('accepts a .pdf whose browser left the type blank', () => {
    expect(checkImportFile(pdf({ type: '' }))).toBeNull();
  });

  it('rejects a renamed file whose bytes are not a PDF', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(checkImportFile(pdf(), png)).toBe('not-pdf');
  });

  it('checks size before content, so an oversized PDF is reported as too large', () => {
    expect(checkImportFile(pdf({ size: MAX_IMPORT_PDF_BYTES + 1 }), PDF_HEAD)).toBe('too-large');
  });
});

describe('checkImportRange', () => {
  it('accepts an ordered range, including a single day', () => {
    expect(checkImportRange('2027-01-01', '2027-12-31')).toBeNull();
    expect(checkImportRange('2027-03-05', '2027-03-05')).toBeNull();
  });

  it('rejects a range that ends before it starts', () => {
    expect(checkImportRange('2027-12-31', '2027-01-01')).toBe('range-invalid');
  });

  it.each([
    ['missing start', '', '2027-12-31'],
    ['missing end', '2027-01-01', null],
    ['not a date', 'domani', '2027-12-31'],
    ['impossible date', '2027-02-30', '2027-12-31'],
  ])('rejects a %s', (_, start, end) => {
    expect(checkImportRange(start, end)).toBe('range-invalid');
  });
});

describe('wholeYearRange', () => {
  it('spans 1 January to 31 December of the year', () => {
    expect(wholeYearRange(2027)).toEqual({ start: '2027-01-01', end: '2027-12-31' });
  });
});

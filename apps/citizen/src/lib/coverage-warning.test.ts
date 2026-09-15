import { describe, it, expect } from 'vitest';
import { coverageWarningMessage } from './coverage-warning';

describe('coverageWarningMessage', () => {
  it('says nothing while Coverage is comfortably far off', () => {
    expect(coverageWarningMessage({ state: 'covered', endDate: '2026-12-31', daysLeft: 120 })).toBeNull();
  });

  it('says nothing when Coverage is unknown', () => {
    expect(coverageWarningMessage({ state: 'unknown' })).toBeNull();
  });

  it('names the end date when Coverage is ending', () => {
    expect(coverageWarningMessage({ state: 'ending', endDate: '2026-12-31', daysLeft: 42 })).toBe(
      'Calendario in scadenza il 31 dicembre 2026'
    );
  });

  it('names the last covered date once Coverage has expired', () => {
    expect(coverageWarningMessage({ state: 'expired', endDate: '2026-12-31' })).toBe(
      'Calendario scaduto il 31 dicembre 2026'
    );
  });

  it('still warns when the Reference day was never covered at all', () => {
    expect(coverageWarningMessage({ state: 'expired', endDate: null })).toBe(
      'Calendario non caricato per domani'
    );
  });
});

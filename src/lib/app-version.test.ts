import { describe, it, expect } from 'vitest';
import { getAppVersion } from '@/lib/app-version';

describe('getAppVersion', () => {
  it('returns the version string when one is provided', () => {
    expect(getAppVersion('1.0.0')).toBe('1.0.0');
  });

  it('returns null when no version is provided', () => {
    expect(getAppVersion(undefined)).toBeNull();
  });

  it('returns null for an empty or whitespace-only value', () => {
    expect(getAppVersion('')).toBeNull();
    expect(getAppVersion('   ')).toBeNull();
  });

  it('trims surrounding whitespace from the version', () => {
    expect(getAppVersion('  1.0.0  ')).toBe('1.0.0');
  });
});

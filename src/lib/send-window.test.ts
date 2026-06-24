import { describe, it, expect } from 'vitest';
import { isWithinSendWindow } from '@/lib/send-window';

describe('isWithinSendWindow', () => {
  it('is true at 20:00 Rome in summer (CEST, 18:00 UTC)', () => {
    expect(isWithinSendWindow(new Date('2026-06-17T18:00:00Z'))).toBe(true);
  });

  it('is true at 20:00 Rome in winter (CET, 19:00 UTC)', () => {
    expect(isWithinSendWindow(new Date('2026-01-15T19:00:00Z'))).toBe(true);
  });

  it('is false for the off-season cron time, so exactly one cron fires per season', () => {
    // Summer: the 19:00 UTC cron is 21:00 Rome → must not fire.
    expect(isWithinSendWindow(new Date('2026-06-17T19:00:00Z'))).toBe(false);
    // Winter: the 18:00 UTC cron is 19:00 Rome → must not fire.
    expect(isWithinSendWindow(new Date('2026-01-15T18:00:00Z'))).toBe(false);
  });

  it('is false just outside the [20, 21) Rome window', () => {
    expect(isWithinSendWindow(new Date('2026-06-17T17:59:00Z'))).toBe(false); // 19:59 Rome
    expect(isWithinSendWindow(new Date('2026-06-17T19:00:00Z'))).toBe(false); // 21:00 Rome
  });
});

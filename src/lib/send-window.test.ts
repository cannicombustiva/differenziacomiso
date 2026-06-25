import { describe, it, expect } from 'vitest';
import { isWithinSendWindow } from '@/lib/send-window';

// TEMPORARY (test 2026-06-25): expectations shifted to 22:00 Europe/Rome.
// Roll back to 20:00 (UTC 18/19) once background delivery is confirmed.
describe('isWithinSendWindow', () => {
  it('is true at 22:00 Rome in summer (CEST, 20:00 UTC)', () => {
    expect(isWithinSendWindow(new Date('2026-06-17T20:00:00Z'))).toBe(true);
  });

  it('is true at 22:00 Rome in winter (CET, 21:00 UTC)', () => {
    expect(isWithinSendWindow(new Date('2026-01-15T21:00:00Z'))).toBe(true);
  });

  it('is false for the off-season cron time, so exactly one cron fires per season', () => {
    // Summer: the 21:00 UTC cron is 23:00 Rome → must not fire.
    expect(isWithinSendWindow(new Date('2026-06-17T21:00:00Z'))).toBe(false);
    // Winter: the 20:00 UTC cron is 21:00 Rome → must not fire.
    expect(isWithinSendWindow(new Date('2026-01-15T20:00:00Z'))).toBe(false);
  });

  it('is false just outside the [22, 23) Rome window', () => {
    expect(isWithinSendWindow(new Date('2026-06-17T19:59:00Z'))).toBe(false); // 21:59 Rome
    expect(isWithinSendWindow(new Date('2026-06-17T21:00:00Z'))).toBe(false); // 23:00 Rome
  });
});

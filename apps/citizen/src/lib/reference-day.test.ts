import { describe, it, expect } from 'vitest';
import { referenceDay, romeToday } from '@/lib/reference-day';

describe('romeToday', () => {
  it('returns the current calendar day in Europe/Rome', () => {
    const now = new Date('2026-06-17T12:00:00+02:00');
    expect(romeToday(now)).toBe('2026-06-17');
  });

  it('anchors to the Rome calendar day when the UTC date differs', () => {
    // 22:30Z is already 00:30 of the next day in Rome.
    const now = new Date('2026-06-17T22:30:00Z');
    expect(romeToday(now)).toBe('2026-06-18');
  });
});

describe('referenceDay', () => {
  it('returns the next calendar day in Europe/Rome for a midday instant', () => {
    // 2026-06-17 12:00 Rome (CEST, +02:00)
    const now = new Date('2026-06-17T12:00:00+02:00');
    expect(referenceDay(now)).toBe('2026-06-18');
  });

  it('advances exactly one day for a late-evening Rome instant (no double-advance)', () => {
    // 2026-06-17 23:30 Rome → reference day is the 18th, not the 19th
    const now = new Date('2026-06-17T23:30:00+02:00');
    expect(referenceDay(now)).toBe('2026-06-18');
  });

  it('anchors to the Rome calendar day when the UTC date differs', () => {
    // 2026-06-17T22:30:00Z is already 2026-06-18 00:30 in Rome.
    // Rome day is the 18th → reference day is the 19th (not the 18th, which UTC would give).
    const now = new Date('2026-06-17T22:30:00Z');
    expect(referenceDay(now)).toBe('2026-06-19');
  });

  it('rolls correctly across Rome DST transitions', () => {
    // Spring-forward is 2026-03-29 (CET→CEST). Late on the 28th → the 29th.
    expect(referenceDay(new Date('2026-03-28T23:30:00+01:00'))).toBe('2026-03-29');
    // Midday on the spring-forward day → the 30th.
    expect(referenceDay(new Date('2026-03-29T12:00:00+02:00'))).toBe('2026-03-30');
    // Fall-back is 2026-10-25 (CEST→CET). Late on the 24th → the 25th.
    expect(referenceDay(new Date('2026-10-24T23:30:00+02:00'))).toBe('2026-10-25');
    // Midday on the fall-back day → the 26th.
    expect(referenceDay(new Date('2026-10-25T12:00:00+01:00'))).toBe('2026-10-26');
  });

  it('yields a single Reference day for a given instant (home page and Notification agree)', () => {
    // Both the home page and the 20:00 Notification resolve "tomorrow" through this
    // one function, so for any instant they cannot disagree.
    const instant = new Date('2026-06-17T22:30:00Z');
    expect(referenceDay(instant)).toBe(referenceDay(instant));
    expect(referenceDay(instant)).toBe('2026-06-19');
  });
});

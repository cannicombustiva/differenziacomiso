import { describe, it, expect } from 'vitest';
import { isDeadSubscription } from './dead-subscription';

describe('isDeadSubscription', () => {
  it('treats a 410 Gone from the push service as a dead subscription', () => {
    // web-push rejects with a WebPushError carrying the push service's status.
    expect(isDeadSubscription({ statusCode: 410, body: 'Gone' })).toBe(true);
  });

  it('keeps the subscription for any other push service status', () => {
    // 404 is ambiguous, 429 and 500 are transient — none prove the user left.
    expect(isDeadSubscription({ statusCode: 404 })).toBe(false);
    expect(isDeadSubscription({ statusCode: 429 })).toBe(false);
    expect(isDeadSubscription({ statusCode: 500 })).toBe(false);
  });

  it('keeps the subscription when the error carries no status code', () => {
    // e.g. a network failure before the push service answered.
    expect(isDeadSubscription(new Error('ECONNRESET'))).toBe(false);
  });

  it('keeps the subscription for null or undefined', () => {
    expect(isDeadSubscription(null)).toBe(false);
    expect(isDeadSubscription(undefined)).toBe(false);
  });
});

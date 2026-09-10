import { describe, it, expect } from 'vitest';
import { formatSendResult } from '@/lib/send-result';

describe('formatSendResult', () => {
  it('is all-sent when every subscriber received the notification', () => {
    expect(formatSendResult(2, 0)).toEqual({ kind: 'all-sent', sentCount: 2, failedCount: 0 });
  });

  it('is partial when some succeeded and some failed', () => {
    expect(formatSendResult(2, 1)).toEqual({ kind: 'partial', sentCount: 2, failedCount: 1 });
  });

  it('is all-failed when nothing succeeded but there were attempts', () => {
    expect(formatSendResult(0, 4)).toEqual({ kind: 'all-failed', sentCount: 0, failedCount: 4 });
  });

  it('is no-recipients when there were no subscribers at all', () => {
    expect(formatSendResult(0, 0)).toEqual({ kind: 'no-recipients', sentCount: 0, failedCount: 0 });
  });

  it('clamps negative and non-finite counts to zero', () => {
    expect(formatSendResult(-3, Number.NaN)).toEqual({
      kind: 'no-recipients',
      sentCount: 0,
      failedCount: 0,
    });
    expect(formatSendResult(Number.NaN, 2)).toEqual({
      kind: 'all-failed',
      sentCount: 0,
      failedCount: 2,
    });
  });
});

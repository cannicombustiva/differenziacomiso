export type SendResultKind = 'all-sent' | 'partial' | 'all-failed' | 'no-recipients';

export type SendResult = {
  kind: SendResultKind;
  sentCount: number;
  failedCount: number;
};

/** Classify the outcome of a push send from its sent/failed counts. */
export function formatSendResult(rawSent: number, rawFailed: number): SendResult {
  const sent = Number.isFinite(rawSent) ? Math.max(0, Math.trunc(rawSent)) : 0;
  const failed = Number.isFinite(rawFailed) ? Math.max(0, Math.trunc(rawFailed)) : 0;

  let kind: SendResultKind;
  if (sent > 0) {
    kind = failed > 0 ? 'partial' : 'all-sent';
  } else {
    kind = failed > 0 ? 'all-failed' : 'no-recipients';
  }
  return { kind, sentCount: sent, failedCount: failed };
}

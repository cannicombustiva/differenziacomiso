/**
 * Did the push service tell us this subscription is gone for good?
 *
 * Only HTTP 410 Gone proves the subscription expired or the user unsubscribed,
 * so only then is it safe to delete. Every other failure (404, rate limits,
 * server errors, network errors with no status) may be transient.
 */
export function isDeadSubscription(err: unknown): boolean {
  return (err as { statusCode?: unknown } | null | undefined)?.statusCode === 410;
}

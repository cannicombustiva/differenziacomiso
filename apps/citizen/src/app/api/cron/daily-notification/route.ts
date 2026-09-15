import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@differenzia/core/supabase/admin';
import { NOTIFICATION_TITLE, sendToAllSubscriptions } from '@/lib/push-fan-out';
import { referenceDay } from '@differenzia/core/reference-day';
import { isWithinSendWindow } from '@/lib/send-window';
import { buildNotificationMessage, type ScheduleRow } from '@/lib/notification-message';
import { coverageHorizon, isOutsideCoverage, type CoverageRange } from '@differenzia/core/coverage';
import { coverageWarningMessage } from '@/lib/coverage-warning';

type EveningNotificationResult =
  | { outcome: 'sent'; date: string; message: string; sent: number; failed: number }
  | { outcome: 'skipped'; date: string; reason: string }
  | { outcome: 'error'; error: string };

type CoverageWarningResult = { message: string; sent: number; failed: number } | null;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // The two DST cron schedules both hit this route daily; only the one inside
  // the window sends. Everything below — the Coverage warning included — rides
  // this gate, which is what keeps each push to at most once a day.
  if (!isWithinSendWindow()) {
    return NextResponse.json({ skipped: true, reason: 'Outside the 20:00 Europe/Rome send window' });
  }

  const supabase = createAdminClient();
  const tomorrow = referenceDay();

  // A read failure leaves `ranges` null, which per ADR 0006 deliberately
  // neither suppresses the evening Notification nor raises a Coverage warning.
  const { data, error: coverageError } = await supabase
    .from('schedule_coverage')
    .select('start_date, end_date, source');

  if (coverageError) {
    console.error('Cron coverage read failed, sending anyway:', coverageError);
  }
  const ranges = coverageError ? null : ((data ?? []) as CoverageRange[]);

  const evening = await sendEveningNotification(supabase, tomorrow, ranges);
  // Sent whatever happened to the evening Notification: a broken Schedule read
  // is exactly when the Admin most needs to hear from the app.
  const coverageWarning = await warnAdminsOfCoverageExpiry(supabase, tomorrow, ranges);

  switch (evening.outcome) {
    case 'error':
      return NextResponse.json({ error: evening.error, coverageWarning }, { status: 500 });
    case 'skipped':
      return NextResponse.json({ skipped: true, reason: evening.reason, date: evening.date, coverageWarning });
    case 'sent': {
      const { date, message, sent, failed } = evening;
      return NextResponse.json({ date, message, sent, failed, coverageWarning });
    }
  }
}

/** "Domani si raccoglie…" to every Subscription — Citizen and Admin devices alike. */
async function sendEveningNotification(
  supabase: SupabaseClient,
  tomorrow: string,
  ranges: CoverageRange[] | null
): Promise<EveningNotificationResult> {
  // Outside Coverage an empty schedule means "not loaded yet", not "no
  // collection" (ADR 0006), so the run goes silent rather than telling the
  // whole town to put nothing out.
  if (isOutsideCoverage(tomorrow, ranges)) {
    const reason = `${tomorrow} falls outside the Schedule's Coverage — nothing to announce`;
    console.warn(`Cron skipped: ${reason}`);
    return { outcome: 'skipped', date: tomorrow, reason };
  }

  const { data: rows, error } = await supabase
    .from('collection_schedule')
    .select('is_holiday, holiday_note_it, waste_types:waste_type_id(name_it)')
    .eq('date', tomorrow);

  if (error) {
    console.error('Cron fetch error:', error);
    return { outcome: 'error', error: 'DB error' };
  }

  const message = buildNotificationMessage((rows ?? []) as unknown as ScheduleRow[]);
  const { data: subscriptions } = await supabase.from('push_subscriptions').select('*');
  const { sent, failed } = await sendToAllSubscriptions(supabase, subscriptions ?? [], {
    title: NOTIFICATION_TITLE,
    body: message,
  });
  return { outcome: 'sent', date: tomorrow, message, sent, failed };
}

/**
 * Push the Coverage-expiry warning to Admin devices only (#79) — the dashboard
 * banner reaches nobody in the year the Admin forgets the app exists. Repeats
 * every evening while Coverage is ending or expired, until the next calendar
 * is loaded. Null when there is nothing to warn about or no Admin device.
 */
async function warnAdminsOfCoverageExpiry(
  supabase: SupabaseClient,
  tomorrow: string,
  ranges: CoverageRange[] | null
): Promise<CoverageWarningResult> {
  const message = coverageWarningMessage(coverageHorizon(tomorrow, ranges));
  if (!message) return null;

  const { data: adminDevices, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .not('admin_id', 'is', null);

  if (error) {
    console.error('Cron admin subscriptions read failed:', error);
    return null;
  }
  if (!adminDevices || adminDevices.length === 0) return null;

  const { sent, failed } = await sendToAllSubscriptions(supabase, adminDevices, {
    title: NOTIFICATION_TITLE,
    body: message,
  });
  return { message, sent, failed };
}

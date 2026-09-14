import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@differenzia/core/supabase/admin';
import { sendToAllSubscriptions } from '@/lib/push-fan-out';
import { referenceDay } from '@/lib/reference-day';
import { isWithinSendWindow } from '@/lib/send-window';
import { buildNotificationMessage, type ScheduleRow } from '@/lib/notification-message';
import { coverageHorizon, isOutsideCoverage, type CoverageRange } from '@/lib/coverage';
import { coverageWarningMessage } from '@/lib/coverage-warning';

const TITLE = 'DifferenziaComiso';

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
  // this gate, which is what keeps it to at most once a day.
  if (!isWithinSendWindow()) {
    return NextResponse.json({ skipped: true, reason: 'Outside the 20:00 Europe/Rome send window' });
  }

  const supabase = createAdminClient();
  const tomorrow = referenceDay();

  // Is the Schedule authoritative for tomorrow at all? Outside Coverage an
  // empty schedule means "not loaded yet", not "no collection" (ADR 0006), so
  // the run goes silent rather than telling the whole town to put nothing out.
  // A read failure leaves `ranges` null, which deliberately does not suppress.
  const { data, error: coverageError } = await supabase
    .from('schedule_coverage')
    .select('start_date, end_date, source');

  if (coverageError) {
    console.error('Cron coverage read failed, sending anyway:', coverageError);
  }
  const ranges = coverageError ? null : ((data ?? []) as CoverageRange[]);

  let citizen: Record<string, unknown>;
  if (isOutsideCoverage(tomorrow, ranges)) {
    const reason = `${tomorrow} falls outside the Schedule's Coverage — nothing to announce`;
    console.warn(`Cron skipped: ${reason}`);
    citizen = { skipped: true, reason, date: tomorrow };
  } else {
    const { data: rows, error } = await supabase
      .from('collection_schedule')
      .select('is_holiday, holiday_note_it, waste_types:waste_type_id(name_it)')
      .eq('date', tomorrow);

    if (error) {
      console.error('Cron fetch error:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    const notifBody = buildNotificationMessage((rows ?? []) as unknown as ScheduleRow[]);
    const { data: subscriptions } = await supabase.from('push_subscriptions').select('*');
    const { sent, failed } = await sendToAllSubscriptions(supabase, subscriptions ?? [], {
      title: TITLE,
      body: notifBody,
    });
    citizen = { date: tomorrow, message: notifBody, sent, failed };
  }

  const coverageWarning = await warnAdminsOfCoverageExpiry(supabase, coverageWarningMessage(coverageHorizon(tomorrow, ranges)));

  return NextResponse.json({ ...citizen, coverageWarning });
}

/**
 * Push the Coverage-expiry warning to Admin devices only (#79) — the dashboard
 * banner reaches nobody in the year the Admin forgets the app exists.
 * Returns null when there was nothing to warn about or no Admin device to warn.
 */
async function warnAdminsOfCoverageExpiry(supabase: SupabaseClient, message: string | null) {
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

  const { sent, failed } = await sendToAllSubscriptions(supabase, adminDevices, { title: TITLE, body: message });
  return { message, sent, failed };
}

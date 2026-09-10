import { NextResponse } from 'next/server';
import { createAdminClient } from '@differenzia/core/supabase/admin';
import { sendPushNotification } from '@/lib/push';
import { referenceDay } from '@/lib/reference-day';
import { isWithinSendWindow } from '@/lib/send-window';
import { buildNotificationMessage, type ScheduleRow } from '@/lib/notification-message';
import { isOutsideCoverage, type CoverageRange } from '@/lib/coverage';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isWithinSendWindow()) {
    return NextResponse.json({ skipped: true, reason: 'Outside the 20:00 Europe/Rome send window' });
  }

  const supabase = createAdminClient();
  const tomorrow = referenceDay();

  // Is the Schedule authoritative for tomorrow at all? Outside Coverage an
  // empty schedule means "not loaded yet", not "no collection" (ADR 0006), so
  // the run goes silent rather than telling the whole town to put nothing out.
  // A read failure leaves `ranges` null, which deliberately does not suppress.
  const { data: ranges, error: coverageError } = await supabase
    .from('schedule_coverage')
    .select('start_date, end_date, source');

  if (coverageError) {
    console.error('Cron coverage read failed, sending anyway:', coverageError);
  }

  if (isOutsideCoverage(tomorrow, coverageError ? null : ((ranges ?? []) as CoverageRange[]))) {
    const reason = `${tomorrow} falls outside the Schedule's Coverage — nothing to announce`;
    console.warn(`Cron skipped: ${reason}`);
    return NextResponse.json({ skipped: true, reason, date: tomorrow });
  }

  // Fetch tomorrow's schedule with waste type names
  const { data: rows, error } = await supabase
    .from('collection_schedule')
    .select('is_holiday, holiday_note_it, waste_types:waste_type_id(name_it)')
    .eq('date', tomorrow);

  if (error) {
    console.error('Cron fetch error:', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // Build notification text
  const notifBody = buildNotificationMessage((rows ?? []) as unknown as ScheduleRow[]);

  // Fetch all subscriptions
  const { data: subscriptions } = await supabase.from('push_subscriptions').select('*');

  const payload = {
    title: 'DifferenziaComiso',
    body: notifBody,
    icon: '/icons/icon-192x192.png',
    url: '/',
  };

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions || []) {
    try {
      await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
        payload
      );
      sent++;
    } catch (err) {
      failed++;
      if ((err as { statusCode?: number })?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return NextResponse.json({ date: tomorrow, message: notifBody, sent, failed });
}

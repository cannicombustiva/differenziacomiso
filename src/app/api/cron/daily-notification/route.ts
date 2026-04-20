import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushNotification } from '@/lib/push';

const ITALY_TZ = 'Europe/Rome';

function getItalyHour(): number {
  return parseInt(
    new Intl.DateTimeFormat('en', { timeZone: ITALY_TZ, hour: 'numeric', hour12: false }).format(new Date()),
    10
  );
}

function getTomorrowInItaly(): string {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ITALY_TZ }).formatToParts(tomorrow);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const italyHour = getItalyHour();
  if (italyHour !== 20) {
    return NextResponse.json({ skipped: true, reason: `Italy hour is ${italyHour}, not 20` });
  }

  const supabase = createAdminClient();
  const tomorrow = getTomorrowInItaly();

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
  let notifBody: string;
  const isHoliday = rows?.some((r) => r.is_holiday);
  if (!rows || rows.length === 0 || (isHoliday && !rows.some((r) => r.waste_types))) {
    const note = rows?.[0]?.holiday_note_it;
    notifBody = note
      ? `Domani non si effettua la raccolta (${note})`
      : 'Domani non si effettua la raccolta';
  } else {
    const names = rows
      .map((r) => (r.waste_types as unknown as { name_it: string } | null)?.name_it)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
    notifBody = `Domani si raccoglie: ${names.join(', ')}`;
  }

  // Fetch all subscriptions
  const { data: subscriptions } = await supabase.from('push_subscriptions').select('*');

  const payload = {
    title: 'DifferenziaComiso',
    body: notifBody,
    icon: '/icons/icon-192x192.svg',
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

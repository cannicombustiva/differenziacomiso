'use client';

import { useState, useEffect } from 'react';
import { format, addDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { referenceDay, romeToday } from '@/lib/reference-day';
import { groupCollections, type ScheduleRow } from '@/lib/group-collections';
import type { CollectionDayGrouped, Locale } from '@/types';

const SCHEDULE_SELECT =
  'date, is_holiday, holiday_note_it, holiday_note_en, note_it, note_en, waste_types:waste_type_id(*)';

export function useTomorrowCollection(locale: Locale) {
  const [collection, setCollection] = useState<CollectionDayGrouped | null>(null);

  useEffect(() => {
    const tomorrow = referenceDay();
    const supabase = createClient();
    supabase
      .from('collection_schedule')
      .select(SCHEDULE_SELECT)
      .eq('date', tomorrow)
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        const rows = (data || []) as unknown as ScheduleRow[];
        const grouped = groupCollections(rows, locale);
        setCollection(grouped[0] || { date: tomorrow, wasteTypes: [], isHoliday: false });
      });
  }, [locale]);

  return collection;
}

export function useWeekCollections(locale: Locale) {
  const [collections, setCollections] = useState<CollectionDayGrouped[]>([]);

  useEffect(() => {
    const today = romeToday();
    const end = format(addDays(parseISO(today), 6), 'yyyy-MM-dd');
    const supabase = createClient();
    supabase
      .from('collection_schedule')
      .select(SCHEDULE_SELECT)
      .gte('date', today)
      .lte('date', end)
      .order('date')
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        const rows = (data || []) as unknown as ScheduleRow[];
        setCollections(groupCollections(rows, locale));
      });
  }, [locale]);

  return collections;
}

export function useMonthCollections(year: number, month: number, locale: Locale) {
  const [collections, setCollections] = useState<CollectionDayGrouped[]>([]);

  useEffect(() => {
    const start = format(startOfMonth(new Date(year, month)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(year, month)), 'yyyy-MM-dd');
    const supabase = createClient();
    supabase
      .from('collection_schedule')
      .select(SCHEDULE_SELECT)
      .gte('date', start)
      .lte('date', end)
      .order('date')
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        const rows = (data || []) as unknown as ScheduleRow[];
        setCollections(groupCollections(rows, locale));
      });
  }, [year, month, locale]);

  return collections;
}

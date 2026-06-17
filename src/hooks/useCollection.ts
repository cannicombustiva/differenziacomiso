'use client';

import { useState, useEffect } from 'react';
import { format, addDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { referenceDay, romeToday } from '@/lib/reference-day';
import type { CollectionDayGrouped, WasteType } from '@/types';

type RawRow = {
  date: string;
  is_holiday: boolean;
  holiday_note_it: string | null;
  holiday_note_en: string | null;
  waste_types: WasteType | null;
};

function groupRows(rows: RawRow[]): CollectionDayGrouped[] {
  const map = new Map<string, CollectionDayGrouped>();
  for (const row of rows) {
    if (!map.has(row.date)) {
      map.set(row.date, {
        date: row.date,
        wasteTypes: [],
        isHoliday: row.is_holiday,
        holidayNote: row.holiday_note_it || undefined,
      });
    }
    const group = map.get(row.date)!;
    if (row.waste_types && !group.wasteTypes.find(wt => wt.id === (row.waste_types as WasteType).id)) {
      group.wasteTypes.push(row.waste_types);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function useTomorrowCollection() {
  const [collection, setCollection] = useState<CollectionDayGrouped | null>(null);

  useEffect(() => {
    const tomorrow = referenceDay();
    const supabase = createClient();
    supabase
      .from('collection_schedule')
      .select('date, is_holiday, holiday_note_it, holiday_note_en, waste_types:waste_type_id(*)')
      .eq('date', tomorrow)
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        const rows = (data || []) as unknown as RawRow[];
        const grouped = groupRows(rows);
        setCollection(grouped[0] || { date: tomorrow, wasteTypes: [], isHoliday: false });
      });
  }, []);

  return collection;
}

export function useWeekCollections() {
  const [collections, setCollections] = useState<CollectionDayGrouped[]>([]);

  useEffect(() => {
    const today = romeToday();
    const end = format(addDays(parseISO(today), 6), 'yyyy-MM-dd');
    const supabase = createClient();
    supabase
      .from('collection_schedule')
      .select('date, is_holiday, holiday_note_it, holiday_note_en, waste_types:waste_type_id(*)')
      .gte('date', today)
      .lte('date', end)
      .order('date')
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        const rows = (data || []) as unknown as RawRow[];
        setCollections(groupRows(rows));
      });
  }, []);

  return collections;
}

export function useMonthCollections(year: number, month: number) {
  const [collections, setCollections] = useState<CollectionDayGrouped[]>([]);

  useEffect(() => {
    const start = format(startOfMonth(new Date(year, month)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(year, month)), 'yyyy-MM-dd');
    const supabase = createClient();
    supabase
      .from('collection_schedule')
      .select('date, is_holiday, holiday_note_it, holiday_note_en, waste_types:waste_type_id(*)')
      .gte('date', start)
      .lte('date', end)
      .order('date')
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        const rows = (data || []) as unknown as RawRow[];
        setCollections(groupRows(rows));
      });
  }, [year, month]);

  return collections;
}

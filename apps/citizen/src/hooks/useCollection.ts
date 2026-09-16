'use client';

import { useState, useEffect } from 'react';
import { format, addDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { createClient } from '@differenzia/core/supabase/client';
import { referenceDay, romeToday } from '@differenzia/core/reference-day';
import { groupCollections, type ScheduleRow } from '@differenzia/core/group-collections';
import { fetchCoverage, fetchScheduleRows } from '@differenzia/core/schedule-queries';
import { writeCache, readCache, writeCoverageCache, readCoverageCache } from '@/lib/offline-cache';
import type { CoverageRange } from '@differenzia/core/coverage';
import type { CollectionDayGrouped, Locale } from '@differenzia/core/types';

/**
 * The Coverage ranges the Schedule vouches for (ADR 0006). `null` means not yet
 * read, or unreadable — callers must treat that as "unknown", never as "not
 * covered".
 *
 * Offline the query throws and the last cached Coverage answers instead, so a
 * date nobody has loaded still reads as unknown rather than as a day off. A
 * device that has never been online falls back to `null`, which is honest: it
 * knows nothing about Coverage and says so.
 */
export function useCoverage(): CoverageRange[] | null {
  const [ranges, setRanges] = useState<CoverageRange[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await fetchCoverage(createClient());
        writeCoverageCache(fetched);
        setRanges(fetched);
      } catch {
        setRanges(readCoverageCache());
      }
    })();
  }, []);

  return ranges;
}

export function useTomorrowCollection(locale: Locale) {
  const [collection, setCollection] = useState<CollectionDayGrouped | null>(null);

  useEffect(() => {
    const tomorrow = referenceDay();
    const key = `tomorrow:${tomorrow}`;
    const show = (rows: ScheduleRow[]) => {
      const grouped = groupCollections(rows, locale);
      setCollection(grouped[0] || { date: tomorrow, wasteTypes: [], isHoliday: false });
    };
    (async () => {
      try {
        const rows = await fetchScheduleRows(createClient(), tomorrow);
        writeCache(key, rows);
        show(rows);
      } catch {
        const cached = readCache<ScheduleRow[]>(key);
        if (cached) show(cached);
        else setCollection({ date: tomorrow, wasteTypes: [], isHoliday: false });
      }
    })();
  }, [locale]);

  return collection;
}

export function useWeekCollections(locale: Locale) {
  const [collections, setCollections] = useState<CollectionDayGrouped[]>([]);

  useEffect(() => {
    const today = romeToday();
    const end = format(addDays(parseISO(today), 6), 'yyyy-MM-dd');
    const key = `week:${today}`;
    (async () => {
      try {
        const rows = await fetchScheduleRows(createClient(), today, end);
        writeCache(key, rows);
        setCollections(groupCollections(rows, locale));
      } catch {
        const cached = readCache<ScheduleRow[]>(key);
        if (cached) setCollections(groupCollections(cached, locale));
      }
    })();
  }, [locale]);

  return collections;
}

export function useMonthCollections(year: number, month: number, locale: Locale) {
  const [collections, setCollections] = useState<CollectionDayGrouped[]>([]);

  useEffect(() => {
    const start = format(startOfMonth(new Date(year, month)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(year, month)), 'yyyy-MM-dd');
    const key = `month:${start}`;
    (async () => {
      try {
        const rows = await fetchScheduleRows(createClient(), start, end);
        writeCache(key, rows);
        setCollections(groupCollections(rows, locale));
      } catch {
        const cached = readCache<ScheduleRow[]>(key);
        if (cached) setCollections(groupCollections(cached, locale));
      }
    })();
  }, [year, month, locale]);

  return collections;
}

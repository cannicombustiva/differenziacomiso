'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@differenzia/core/supabase/client';
import { referenceDay } from '@differenzia/core/reference-day';
import { groupCollections } from '@differenzia/core/group-collections';
import { fetchCoverage, fetchScheduleRows } from '@differenzia/core/schedule-queries';
import type { CoverageRange } from '@differenzia/core/coverage';
import type { CollectionDayGrouped, Locale } from '@differenzia/core/types';

/**
 * Coverage for the dashboard. Admin is online-only and caches nothing
 * (ADR 0005), so a failed read stays `null` — unknown, never "not covered"
 * (ADR 0006).
 */
export function useCoverage(): CoverageRange[] | null {
  const [ranges, setRanges] = useState<CoverageRange[] | null>(null);

  useEffect(() => {
    fetchCoverage(createClient()).then(setRanges, () => setRanges(null));
  }, []);

  return ranges;
}

/** The Reference day's Collection; null while loading or if the read fails. */
export function useTomorrowCollection(locale: Locale): CollectionDayGrouped | null {
  const [collection, setCollection] = useState<CollectionDayGrouped | null>(null);

  useEffect(() => {
    const tomorrow = referenceDay();
    fetchScheduleRows(createClient(), tomorrow).then(
      (rows) => setCollection(groupCollections(rows, locale)[0] ?? { date: tomorrow, wasteTypes: [], isHoliday: false }),
      () => setCollection(null)
    );
  }, [locale]);

  return collection;
}

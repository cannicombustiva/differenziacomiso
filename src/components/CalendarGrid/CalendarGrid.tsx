'use client';

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import type { CollectionDayGrouped, Locale, WasteType } from '@/types';
import { getWasteTypeName } from '@/lib/utils';
import { wasteVisual } from '@/lib/waste-style';
import { referenceDay } from '@/lib/reference-day';
import styles from './CalendarGrid.module.css';

interface CalendarGridProps {
  currentMonth: Date;
  collections: CollectionDayGrouped[];
  locale: Locale;
  onDayClick?: (date: string) => void;
  onMonthChange?: (date: Date) => void;
  selectedDate?: string;
}

const DAY_HEADERS_IT = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const DAY_HEADERS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarGrid({
  currentMonth,
  collections,
  locale,
  onDayClick,
  onMonthChange,
  selectedDate,
}: CalendarGridProps) {
  const dayHeaders = locale === 'it' ? DAY_HEADERS_IT : DAY_HEADERS_EN;
  const refDay = referenceDay();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Unique waste types appearing this month, for the legend.
  const legendTypes = useMemo(() => {
    const seen = new Map<string, WasteType>();
    for (const day of collections) {
      for (const wt of day.wasteTypes) if (!seen.has(wt.id)) seen.set(wt.id, wt);
    }
    return Array.from(seen.values()).sort((a, b) => a.sort_order - b.sort_order);
  }, [collections]);

  const monthLabel = format(currentMonth, 'MMMM yyyy', {
    locale: locale === 'it' ? itLocale : undefined,
  });

  return (
    <div className={styles.calendar}>
      <div className={styles.switcher}>
        <button
          className={styles.navButton}
          onClick={() => onMonthChange?.(subMonths(currentMonth, 1))}
          aria-label={locale === 'it' ? 'Mese precedente' : 'Previous month'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button
          className={styles.navButton}
          onClick={() => onMonthChange?.(addMonths(currentMonth, 1))}
          aria-label={locale === 'it' ? 'Mese successivo' : 'Next month'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.weekdays}>
          {dayHeaders.map((day, i) => (
            <span key={i} className={styles.weekday}>{day}</span>
          ))}
        </div>

        <div className={styles.grid}>
          {calendarDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            if (!isSameMonth(date, currentMonth)) {
              return <span key={dateStr} className={styles.empty} aria-hidden="true" />;
            }
            const collection = collections.find((c) => c.date === dateStr);
            const types = collection?.wasteTypes ?? [];
            const isRest = !collection || collection.isHoliday || types.length === 0;
            const highlighted = selectedDate ? selectedDate === dateStr : dateStr === refDay;

            const cls = [
              styles.dayCell,
              isToday(date) ? styles.today : '',
              highlighted ? styles.highlight : '',
              isRest ? styles.rest : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button key={dateStr} className={cls} onClick={() => onDayClick?.(dateStr)}>
                <span className={styles.dayNumber}>{format(date, 'd')}</span>
                <span className={styles.dots}>
                  {types.map((wt) => (
                    <span key={wt.id} className={styles.dot} style={{ background: wasteVisual(wt).color }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {legendTypes.length > 0 && (
        <div className={styles.legend}>
          {legendTypes.map((wt) => (
            <span key={wt.id} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: wasteVisual(wt).color }} />
              {getWasteTypeName(wt, locale)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

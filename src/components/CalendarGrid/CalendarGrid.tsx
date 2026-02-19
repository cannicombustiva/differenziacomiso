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
import type { CollectionDayGrouped, Locale } from '@/types';
import styles from './CalendarGrid.module.css';

interface CalendarGridProps {
  currentMonth: Date;
  collections: CollectionDayGrouped[];
  locale: Locale;
  onDayClick?: (date: string) => void;
  onMonthChange?: (date: Date) => void;
  selectedDate?: string;
}

const DAY_HEADERS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DAY_HEADERS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarGrid({
  currentMonth,
  collections,
  locale,
  onDayClick,
  onMonthChange,
  selectedDate,
}: CalendarGridProps) {
  const dayHeaders = locale === 'it' ? DAY_HEADERS_IT : DAY_HEADERS_EN;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const monthLabel = format(currentMonth, 'MMMM yyyy', {
    locale: locale === 'it' ? itLocale : undefined,
  });

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          className={styles.navButton}
          onClick={() => onMonthChange?.(subMonths(currentMonth, 1))}
          aria-label={locale === 'it' ? 'Mese precedente' : 'Previous month'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className={styles.monthLabel}>{monthLabel}</h2>
        <button
          className={styles.navButton}
          onClick={() => onMonthChange?.(addMonths(currentMonth, 1))}
          aria-label={locale === 'it' ? 'Mese successivo' : 'Next month'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className={styles.grid}>
        {dayHeaders.map((day) => (
          <div key={day} className={styles.dayHeader}>
            {day}
          </div>
        ))}

        {calendarDays.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const inMonth = isSameMonth(date, currentMonth);
          const today = isToday(date);
          const collection = collections.find((c) => c.date === dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              className={`${styles.dayCell} ${!inMonth ? styles.outsideMonth : ''} ${today ? styles.today : ''} ${isSelected ? styles.selected : ''} ${collection?.isHoliday ? styles.holiday : ''}`}
              onClick={() => onDayClick?.(dateStr)}
              disabled={!inMonth}
            >
              <span className={styles.dayNumber}>{format(date, 'd')}</span>
              <div className={styles.dots}>
                {collection?.wasteTypes.map((wt) => (
                  <span
                    key={wt.id}
                    className={styles.dot}
                    style={{ backgroundColor: wt.color_hex }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

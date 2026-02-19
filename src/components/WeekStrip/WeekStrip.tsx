'use client';

import { useMemo } from 'react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import type { CollectionDayGrouped, Locale } from '@/types';
import styles from './WeekStrip.module.css';

interface WeekStripProps {
  startDate: Date;
  collections: CollectionDayGrouped[];
  locale: Locale;
  onDayClick?: (date: string) => void;
  selectedDate?: string;
}

export default function WeekStrip({
  startDate,
  collections,
  locale,
  onDayClick,
  selectedDate,
}: WeekStripProps) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const collection = collections.find((c) => c.date === dateStr);
      return {
        date,
        dateStr,
        dayName: format(date, 'EEE', { locale: locale === 'it' ? itLocale : undefined }),
        dayNumber: format(date, 'd'),
        wasteTypes: collection?.wasteTypes || [],
        isHoliday: collection?.isHoliday || false,
        isToday: isToday(date),
        isTomorrow: isTomorrow(date),
      };
    });
  }, [startDate, collections, locale]);

  return (
    <div className={styles.strip} role="list" aria-label={locale === 'it' ? 'Prossimi giorni' : 'Next days'}>
      {days.map((day) => (
        <button
          key={day.dateStr}
          className={`${styles.day} ${day.isToday ? styles.today : ''} ${day.isTomorrow ? styles.tomorrow : ''} ${selectedDate === day.dateStr ? styles.selected : ''}`}
          onClick={() => onDayClick?.(day.dateStr)}
          role="listitem"
          aria-label={`${day.dayName} ${day.dayNumber}`}
        >
          <span className={styles.dayName}>{day.dayName}</span>
          <span className={styles.dayNumber}>{day.dayNumber}</span>
          <div className={styles.dots}>
            {day.isHoliday ? (
              <span className={styles.holidayDot}>-</span>
            ) : day.wasteTypes.length > 0 ? (
              day.wasteTypes.map((wt) => (
                <span
                  key={wt.id}
                  className={styles.dot}
                  style={{ backgroundColor: wt.color_hex }}
                  title={locale === 'it' ? wt.name_it : wt.name_en}
                />
              ))
            ) : (
              <span className={styles.emptyDot} />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

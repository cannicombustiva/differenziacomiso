'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { useLocale } from '@/hooks/useLocale';
import { useMonthCollections } from '@/hooks/useCollection';
import CalendarGrid from '@/components/CalendarGrid/CalendarGrid';
import Modal from '@/components/ui/Modal/Modal';
import WasteCard from '@/components/WasteCard/WasteCard';
import styles from './page.module.css';

export default function CalendarioPage() {
  const { locale, t } = useLocale();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const collections = useMonthCollections(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    locale
  );

  const selectedCollection = selectedDate
    ? collections.find((c) => c.date === selectedDate)
    : null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('calendar.title')}</h1>

      <CalendarGrid
        currentMonth={currentMonth}
        collections={collections}
        locale={locale}
        onDayClick={(date) => setSelectedDate(date)}
        onMonthChange={setCurrentMonth}
        selectedDate={selectedDate || undefined}
      />

      <Modal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? format(new Date(selectedDate + 'T00:00:00'), 'EEEE d MMMM yyyy', {
          locale: locale === 'it' ? itLocale : undefined,
        }) : ''}
      >
        {selectedCollection ? (
          <div className={styles.detail}>
            {selectedCollection.isHoliday ? (
              <p className={styles.holiday}>
                {t('calendar.holiday')}
                {selectedCollection.holidayNote && ` — ${selectedCollection.holidayNote}`}
              </p>
            ) : selectedCollection.wasteTypes.length > 0 ? (
              <div className={styles.wasteList}>
                {selectedCollection.wasteTypes.map((wt) => (
                  <WasteCard key={wt.id} wasteType={wt} locale={locale} />
                ))}
                {selectedCollection.notes?.map((note, i) => (
                  <p key={i} className={styles.pickupNote}>{note}</p>
                ))}
              </div>
            ) : (
              <p className={styles.noCollection}>{t('calendar.noCollection')}</p>
            )}
          </div>
        ) : (
          <p className={styles.noCollection}>{t('calendar.noCollection')}</p>
        )}
      </Modal>
    </div>
  );
}

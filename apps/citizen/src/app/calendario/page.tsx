'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { useLocale } from '@/hooks/useLocale';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useMonthCollections, useCoverage } from '@/hooks/useCollection';
import { dayStatus, type DayStatus } from '@/lib/coverage';
import { referenceDay } from '@/lib/reference-day';
import { getWasteTypeName } from '@/lib/utils';
import { wasteVisual } from '@differenzia/core/waste-style';
import CalendarGrid from '@/components/CalendarGrid/CalendarGrid';
import WasteIcon from '@/components/WasteIcon/WasteIcon';
import Modal from '@/components/ui/Modal/Modal';
import WasteCard from '@/components/WasteCard/WasteCard';
import type { CollectionDayGrouped } from '@differenzia/core/types';
import styles from './page.module.css';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The one mapping from a day's status to what the Citizen is told. Both the
 * mobile detail sheet and the desktop panel read it, so they cannot describe
 * the same date differently.
 */
function statusMessage(
  status: DayStatus,
  collection: CollectionDayGrouped | undefined,
  t: (key: string) => string
): string {
  if (status === 'unscheduled') return t('calendar.notAvailable');
  if (status === 'holiday') {
    return `${t('calendar.holiday')}${collection?.holidayNote ? ` — ${collection.holidayNote}` : ''}`;
  }
  return t('calendar.noCollection');
}

export default function CalendarioPage() {
  const { locale, t } = useLocale();
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const collections = useMonthCollections(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    locale
  );
  const coverage = useCoverage();

  const selectedCollection = selectedDate
    ? collections.find((c) => c.date === selectedDate)
    : null;

  // Desktop detail panel falls back to tomorrow when nothing is selected.
  const panelDate = selectedDate ?? referenceDay();
  const panelCollection = collections.find((c) => c.date === panelDate);
  const panelLabel = cap(
    format(parseISO(panelDate), 'EEEE d MMMM', { locale: locale === 'it' ? itLocale : undefined })
  );

  const renderDetail = (date: string, coll = selectedCollection) => {
    const status = dayStatus(date, coll ?? undefined, coverage);
    if (status !== 'pickups') {
      const cls =
        status === 'unscheduled'
          ? styles.notAvailable
          : status === 'holiday'
            ? styles.holiday
            : styles.noCollection;
      return <p className={cls}>{statusMessage(status, coll ?? undefined, t)}</p>;
    }
    return (
      <div className={styles.wasteList}>
        {coll!.wasteTypes.map((wt) => (
          <WasteCard key={wt.id} wasteType={wt} locale={locale} />
        ))}
        {coll!.notes?.map((note, i) => (
          <p key={i} className={styles.pickupNote}>{note}</p>
        ))}
      </div>
    );
  };

  const panelStatus = dayStatus(panelDate, panelCollection, coverage);
  const hasPickup = panelStatus === 'pickups';

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.calColumn}>
          <h1 className={styles.title}>{t('calendar.title')}</h1>
          <CalendarGrid
            currentMonth={currentMonth}
            collections={collections}
            coverage={coverage}
            locale={locale}
            onDayClick={(date) => setSelectedDate(date)}
            onMonthChange={setCurrentMonth}
            selectedDate={selectedDate || undefined}
          />
        </div>

        {/* Desktop detail panel (replaces the mobile modal). */}
        <aside className={styles.panel}>
          <div className={styles.panelLabel}>{panelLabel}</div>
          {hasPickup ? (
            <div className={styles.panelHero}>
              <div className={styles.panelOverline}>{t('home.exposeBy')}</div>
              <div className={styles.panelTiles}>
                {panelCollection!.wasteTypes.map((wt) => {
                  const v = wasteVisual(wt);
                  return (
                    <div key={wt.id} className={styles.panelTile} style={{ background: v.color, color: v.ink }}>
                      <WasteIcon slug={v.slug} color={v.ink} />
                      <span className={styles.panelTileName}>{getWasteTypeName(wt, locale)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.panelEmpty}>
              {statusMessage(panelStatus, panelCollection, t)}
            </div>
          )}
          <div className={styles.panelHint}>{t('calendar.detailHint')}</div>
        </aside>
      </div>

      {!isDesktop && (
        <Modal
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          title={selectedDate ? cap(format(parseISO(selectedDate), 'EEEE d MMMM yyyy', {
            locale: locale === 'it' ? itLocale : undefined,
          })) : ''}
        >
          {selectedDate && renderDetail(selectedDate)}
        </Modal>
      )}
    </div>
  );
}

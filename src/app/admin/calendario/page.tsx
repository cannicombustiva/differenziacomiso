'use client';

import { useState, useCallback, useEffect } from 'react';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { useLocale } from '@/hooks/useLocale';
import { createClient } from '@/lib/supabase/client';
import CalendarGrid from '@/components/CalendarGrid/CalendarGrid';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { settimanaTipo, WASTE_KEY_NAME_IT } from '@/lib/settimana-tipo';
import type { WasteType, CollectionDayGrouped } from '@/types';
import styles from './page.module.css';

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

/**
 * Resolve the Settimana Tipo for a date into waste_type ids for bulk-fill.
 * Derives from the single rule module (src/lib/settimana-tipo) — including the
 * empty 5th Thursday — so bulk-filling never overwrites seeded truth.
 */
function getSettimanaTypes(date: Date, allTypes: WasteType[]): string[] {
  const idByName = (name: string) => allTypes.find(wt => wt.name_it === name)?.id;
  return settimanaTipo(date)
    .map(key => idByName(WASTE_KEY_NAME_IT[key]))
    .filter(Boolean) as string[];
}

export default function AdminCalendarioPage() {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [collections, setCollections] = useState<CollectionDayGrouped[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<string[]>([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayNote, setHolidayNote] = useState('');
  const [bulkFrom, setBulkFrom] = useState('');
  const [bulkTo, setBulkTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const supabase = createClient();

  const fetchCollections = useCallback(() => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    supabase
      .from('collection_schedule')
      .select('date, is_holiday, holiday_note_it, holiday_note_en, waste_types:waste_type_id(*)')
      .gte('date', start)
      .lte('date', end)
      .order('date')
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        setCollections(groupRows((data || []) as unknown as RawRow[]));
      });
  }, [currentMonth]);

  useEffect(() => {
    supabase
      .from('waste_types')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setWasteTypes((data || []) as WasteType[]));
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const handleDayClick = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = collections.find((c) => c.date === dateStr);
    if (existing) {
      setSelectedWasteTypes(existing.wasteTypes.map((wt) => wt.id));
      setIsHoliday(existing.isHoliday);
      setHolidayNote(existing.holidayNote || '');
    } else {
      setSelectedWasteTypes([]);
      setIsHoliday(false);
      setHolidayNote('');
    }
  }, [collections]);

  const toggleWasteType = (id: string) => {
    setSelectedWasteTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setSaving(true);

    // Delete existing entries for this date
    await supabase.from('collection_schedule').delete().eq('date', selectedDate);

    // Build rows to insert
    const rows: object[] = [];
    if (selectedWasteTypes.length > 0) {
      for (const wtId of selectedWasteTypes) {
        rows.push({
          date: selectedDate,
          waste_type_id: wtId,
          is_holiday: isHoliday,
          holiday_note_it: isHoliday && holidayNote ? holidayNote : null,
          holiday_note_en: null,
        });
      }
    } else if (isHoliday) {
      // Holiday with no collection — insert a marker row
      rows.push({
        date: selectedDate,
        waste_type_id: null,
        is_holiday: true,
        holiday_note_it: holidayNote || null,
        holiday_note_en: null,
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('collection_schedule').insert(rows);
      if (error) {
        setSaving(false);
        showToast(t('common.error'), 'error');
        return;
      }
    }

    setSaving(false);
    showToast(t('admin.save') + ' ✓', 'success');
    setSelectedDate(null);
    fetchCollections();
  };

  const handleBulkFill = async () => {
    if (!bulkFrom || !bulkTo) return;
    setBulkLoading(true);

    // Delete all existing entries in range
    await supabase
      .from('collection_schedule')
      .delete()
      .gte('date', bulkFrom)
      .lte('date', bulkTo);

    // Generate rows for every date in range
    const rows: object[] = [];
    const start = new Date(bulkFrom + 'T00:00:00');
    const end = new Date(bulkTo + 'T00:00:00');

    for (let d = start; d <= end; d = addDays(d, 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const typeIds = getSettimanaTypes(d, wasteTypes);
      for (const wtId of typeIds) {
        rows.push({ date: dateStr, waste_type_id: wtId, is_holiday: false });
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('collection_schedule').insert(rows);
      if (error) {
        setBulkLoading(false);
        showToast(t('common.error'), 'error');
        return;
      }
    }

    setBulkLoading(false);
    showToast(t('admin.bulkFill') + ' ✓', 'success');
    setBulkFrom('');
    setBulkTo('');
    fetchCollections();
  };

  return (
    <div>
      <h2 className={styles.heading}>{t('admin.calendarManager')}</h2>

      <div className={styles.bulkSection}>
        <h3 className={styles.subheading}>{t('admin.bulkFill')}</h3>
        <div className={styles.bulkRow}>
          <div className={styles.bulkField}>
            <label className={styles.label}>{t('admin.fromDate')}</label>
            <input type="date" value={bulkFrom} onChange={(e) => setBulkFrom(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.bulkField}>
            <label className={styles.label}>{t('admin.toDate')}</label>
            <input type="date" value={bulkTo} onChange={(e) => setBulkTo(e.target.value)} className={styles.input} />
          </div>
          <Button onClick={handleBulkFill} size="sm" disabled={!bulkFrom || !bulkTo || bulkLoading}>
            {bulkLoading ? t('common.loading') : t('admin.bulkFill')}
          </Button>
        </div>
      </div>

      <CalendarGrid
        currentMonth={currentMonth}
        collections={collections}
        locale={locale}
        onDayClick={handleDayClick}
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
        <div className={styles.editForm}>
          <div className={styles.checkGroup}>
            {wasteTypes.map((wt) => (
              <label key={wt.id} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={selectedWasteTypes.includes(wt.id)}
                  onChange={() => toggleWasteType(wt.id)}
                />
                <span className={styles.colorDot} style={{ backgroundColor: wt.color_hex }} />
                <span>{locale === 'it' ? wt.name_it : wt.name_en}</span>
              </label>
            ))}
          </div>

          <label className={styles.checkItem}>
            <input
              type="checkbox"
              checked={isHoliday}
              onChange={(e) => setIsHoliday(e.target.checked)}
            />
            <span>{t('admin.markHoliday')}</span>
          </label>

          {isHoliday && (
            <div className={styles.field}>
              <label className={styles.label}>{t('admin.holidayNote')}</label>
              <input
                type="text"
                value={holidayNote}
                onChange={(e) => setHolidayNote(e.target.value)}
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setSelectedDate(null)}>{t('admin.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t('common.loading') : t('admin.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

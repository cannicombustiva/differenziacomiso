import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import type { CollectionDay, CollectionDayGrouped, WasteType, Locale } from '@/types';

export function formatDate(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  return format(date, formatStr);
}

export function formatDateLocalized(date: Date, formatStr: string, locale: Locale): string {
  return format(date, formatStr, { locale: locale === 'it' ? it : undefined });
}

export function getCurrentWeekDays(referenceDate: Date = new Date()): Date[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start, end });
}

export function groupCollectionsByDate(
  collections: CollectionDay[],
  wasteTypes: WasteType[],
  locale: Locale
): CollectionDayGrouped[] {
  const grouped = new Map<string, CollectionDayGrouped>();

  for (const collection of collections) {
    const dateKey = collection.date;
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        date: dateKey,
        wasteTypes: [],
        isHoliday: collection.is_holiday,
        holidayNote: locale === 'en'
          ? (collection.holiday_note_en || collection.holiday_note_it || undefined)
          : (collection.holiday_note_it || undefined),
      });
    }

    const group = grouped.get(dateKey)!;
    if (collection.is_holiday) {
      group.isHoliday = true;
    }

    if (collection.waste_type_id) {
      const wasteType = collection.waste_type || wasteTypes.find(wt => wt.id === collection.waste_type_id);
      if (wasteType && !group.wasteTypes.find(wt => wt.id === wasteType.id)) {
        group.wasteTypes.push(wasteType);
      }
    }
  }

  return Array.from(grouped.values());
}

export function getWasteTypeName(wasteType: WasteType, locale: Locale): string {
  return locale === 'en' ? wasteType.name_en : wasteType.name_it;
}

export function isSameDayCheck(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

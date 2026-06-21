import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import type { WasteType, Locale } from '@/types';

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

import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

export function formatDate(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  return format(date, formatStr);
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

export function isSameDayCheck(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

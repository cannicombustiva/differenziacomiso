import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Locale } from './types';

/** `format` with the Italian date-fns locale for `it`, the default locale otherwise. */
export function formatDateLocalized(date: Date, formatStr: string, locale: Locale): string {
  return format(date, formatStr, { locale: locale === 'it' ? it : undefined });
}

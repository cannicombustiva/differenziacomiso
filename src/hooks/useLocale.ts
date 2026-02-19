'use client';

import { useTranslation } from '@/lib/i18n';
import type { Locale } from '@/types';

export function useLocale() {
  const { locale, setLocale, t } = useTranslation();

  const toggleLocale = () => {
    const newLocale: Locale = locale === 'it' ? 'en' : 'it';
    setLocale(newLocale);
  };

  return { locale, setLocale, toggleLocale, t };
}

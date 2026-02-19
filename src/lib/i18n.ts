'use client';

import { createContext, useContext } from 'react';
import type { Locale } from '@/types';
import itTranslations from '@/i18n/it.json';
import enTranslations from '@/i18n/en.json';

const translations: Record<Locale, typeof itTranslations> = {
  it: itTranslations,
  en: enTranslations,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nContextType>({
  locale: 'it',
  setLocale: () => {},
  t: (key: string) => key,
});

export function useTranslation() {
  return useContext(I18nContext);
}

export function getTranslation(locale: Locale) {
  return function t(key: string): string {
    const keys = key.split('.');
    let value: unknown = translations[locale];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback to Italian
        let fallback: unknown = translations.it;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = (fallback as Record<string, unknown>)[fk];
          } else {
            return key;
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }
    return typeof value === 'string' ? value : key;
  };
}

export function getLocaleFromCookie(cookieValue: string | undefined): Locale {
  if (cookieValue === 'en') return 'en';
  return 'it';
}

'use client';

import { createContext, useContext } from 'react';
import type { Locale } from './types';
import itTranslations from './i18n/it.json';
import enTranslations from './i18n/en.json';

const translations: Record<Locale, Messages> = {
  it: itTranslations,
  en: enTranslations,
};

/** A dictionary of translations: nested objects keyed by segment, strings at the leaves. */
export type Messages = { [key: string]: string | Messages };

/**
 * Namespaces one app adds on top of the shared dictionaries, per locale. Admin
 * keeps its `admin.*` strings here so they never ship in the Citizen bundle
 * (#81, ADR 0005).
 */
export type AppMessages = Partial<Record<Locale, Messages>>;

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

/** The active locale, its setter, a toggle between it and en, and `t`. */
export function useLocale() {
  const { locale, setLocale, t } = useTranslation();

  const toggleLocale = () => {
    setLocale(locale === 'it' ? 'en' : 'it');
  };

  return { locale, setLocale, toggleLocale, t };
}

/**
 * A `t(key)` for `locale`: shared dictionaries plus `extra`, with an app's own
 * top-level namespaces winning. A key missing in `locale` falls back to
 * Italian; a key missing there too comes back as itself.
 */
export function getTranslation(locale: Locale, extra: AppMessages = {}) {
  const current: Messages = { ...translations[locale], ...extra[locale] };
  const italian: Messages = { ...translations.it, ...extra.it };
  return function t(key: string): string {
    const keys = key.split('.');
    let value: unknown = current;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback to Italian
        let fallback: unknown = italian;
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

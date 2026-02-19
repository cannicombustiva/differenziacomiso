'use client';

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { I18nContext, getTranslation, getLocaleFromCookie } from '@/lib/i18n';
import type { Locale } from '@/types';

export default function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || 'it');

  useEffect(() => {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('locale='));
    const cookieLocale = cookie?.split('=')[1];
    const resolved = getLocaleFromCookie(cookieLocale);
    setLocaleState(resolved);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
  }, []);

  const t = getTranslation(locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

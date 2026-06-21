'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import SearchBar from '@/components/SearchBar/SearchBar';
import Card from '@/components/ui/Card/Card';
import { createClient } from '@/lib/supabase/client';
import { searchRiciclabolario } from '@/lib/riciclabolario-search';
import { writeCache, readCache } from '@/lib/offline-cache';
import type { RiciclabolarioItem, Locale } from '@/types';
import styles from './page.module.css';

function getItemName(item: RiciclabolarioItem, locale: Locale) {
  return locale === 'en' ? (item.item_name_en || item.item_name_it) : item.item_name_it;
}

function getTip(item: RiciclabolarioItem, locale: Locale) {
  return locale === 'en' ? (item.tip_en || item.tip_it) : item.tip_it;
}

export default function RiciclabolarioPage() {
  const { locale, t } = useLocale();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<RiciclabolarioItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await createClient()
          .from('riciclabolario')
          .select('*, waste_types:waste_type_id(*)')
          .order('item_name_it');
        if (error) throw error;
        const list = (data || []).map(row => ({ ...row, waste_type: row.waste_types })) as RiciclabolarioItem[];
        writeCache('riciclabolario', list);
        setItems(list);
      } catch {
        const cached = readCache<RiciclabolarioItem[]>('riciclabolario');
        if (cached) setItems(cached);
      }
    })();
  }, []);

  const filtered = useMemo(() => searchRiciclabolario(items, search), [search, items]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('dictionary.title')}</h1>

      <div className={styles.searchWrapper}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('dictionary.searchPlaceholder')}
        />
      </div>

      <div className={styles.results}>
        {filtered.length === 0 ? (
          <p className={styles.noResults}>{t('dictionary.noResults')}</p>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              accentColor={item.waste_type?.color_hex}
              className={styles.itemCard}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{getItemName(item, locale)}</span>
                {item.waste_type && (
                  <span
                    className={styles.badge}
                    style={{ backgroundColor: item.waste_type.color_hex }}
                  >
                    {locale === 'en' ? item.waste_type.name_en : item.waste_type.name_it}
                  </span>
                )}
              </div>
              {getTip(item, locale) && (
                <p className={styles.tip}>
                  <span className={styles.tipLabel}>{t('dictionary.tip')}:</span>{' '}
                  {getTip(item, locale)}
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

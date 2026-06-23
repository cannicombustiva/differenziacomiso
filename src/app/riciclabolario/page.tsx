'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import SearchBar from '@/components/SearchBar/SearchBar';
import { createClient } from '@/lib/supabase/client';
import { searchRiciclabolario } from '@/lib/riciclabolario-search';
import { wasteVisual, wasteSlug, type WasteSlug } from '@/lib/waste-style';
import { getWasteTypeName } from '@/lib/utils';
import { writeCache, readCache } from '@/lib/offline-cache';
import type { RiciclabolarioItem, WasteType, Locale } from '@/types';
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
  const [category, setCategory] = useState<WasteSlug | 'all'>('all');
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

  // Distinct waste categories present, for the desktop filter chips.
  const categories = useMemo(() => {
    const seen = new Map<WasteSlug, WasteType>();
    for (const it of items) {
      if (it.waste_type) {
        const slug = wasteSlug(it.waste_type);
        if (!seen.has(slug)) seen.set(slug, it.waste_type);
      }
    }
    return Array.from(seen.entries())
      .map(([slug, wt]) => ({ slug, wt }))
      .sort((a, b) => a.wt.sort_order - b.wt.sort_order);
  }, [items]);

  const filtered = useMemo(() => {
    const bySearch = searchRiciclabolario(items, search);
    if (category === 'all') return bySearch;
    return bySearch.filter((i) => i.waste_type && wasteSlug(i.waste_type) === category);
  }, [search, items, category]);

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>{t('dictionary.title')}</h1>
        <p className={styles.subtitle}>{t('dictionary.subtitle')}</p>
      </div>

      <div className={styles.searchWrapper}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('dictionary.searchPlaceholder')}
        />
      </div>

      {categories.length > 0 && (
        <div className={styles.chips}>
          <button
            type="button"
            className={`${styles.chip} ${category === 'all' ? styles.chipAllActive : ''}`}
            onClick={() => setCategory('all')}
          >
            {t('dictionary.allCategories')}
          </button>
          {categories.map(({ slug, wt }) => {
            const v = wasteVisual(wt);
            const active = category === slug;
            return (
              <button
                key={slug}
                type="button"
                className={styles.chip}
                onClick={() => setCategory(active ? 'all' : slug)}
                style={
                  active
                    ? { background: v.color, color: v.ink }
                    : { background: v.tint, color: v.pill }
                }
              >
                {getWasteTypeName(wt, locale)}
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.results}>
        {filtered.length === 0 ? (
          <p className={styles.noResults}>{t('dictionary.noResults')}</p>
        ) : (
          filtered.map((item) => {
            const wt = item.waste_type;
            const v = wt ? wasteVisual(wt) : null;
            const tip = getTip(item, locale);
            return (
              <article
                key={item.id}
                className={styles.itemCard}
                style={v ? { borderLeftColor: v.color } : undefined}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{getItemName(item, locale)}</span>
                  {wt && v && (
                    <span className={styles.badge} style={{ background: v.tint, color: v.pill }}>
                      {locale === 'en' ? wt.name_en : wt.name_it}
                    </span>
                  )}
                </div>
                {tip && (
                  <p className={styles.tip}>
                    <strong className={styles.tipLabel}>{t('dictionary.tip')}:</strong> {tip}
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

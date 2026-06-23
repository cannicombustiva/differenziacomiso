'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast/Toast';
import { wasteVisual } from '@/lib/waste-style';
import type { RiciclabolarioItem, WasteType } from '@/types';
import styles from './page.module.css';

type Draft = {
  id: string | null;
  nameIt: string;
  nameEn: string;
  categoryId: string;
  tipIt: string;
  tipEn: string;
};

export default function AdminRiciclabolarioPage() {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<RiciclabolarioItem[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.from('waste_types').select('*').order('sort_order')
      .then(({ data }) => setWasteTypes((data || []) as WasteType[]));
    fetchItems();
  }, []);

  const fetchItems = () => {
    supabase
      .from('riciclabolario')
      .select('*, waste_types:waste_type_id(*)')
      .order('item_name_it')
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        setItems((data || []).map((row) => ({ ...row, waste_type: row.waste_types })) as RiciclabolarioItem[]);
      });
  };

  const filtered = search.trim()
    ? items.filter((item) =>
        item.item_name_it.toLowerCase().includes(search.toLowerCase()) ||
        (item.item_name_en && item.item_name_en.toLowerCase().includes(search.toLowerCase()))
      )
    : items;

  const openEdit = (item: RiciclabolarioItem) =>
    setDraft({
      id: item.id,
      nameIt: item.item_name_it,
      nameEn: item.item_name_en || '',
      categoryId: item.waste_type_id,
      tipIt: item.tip_it || '',
      tipEn: item.tip_en || '',
    });

  const openAdd = () =>
    setDraft({ id: null, nameIt: '', nameEn: '', categoryId: wasteTypes[0]?.id || '', tipIt: '', tipEn: '' });

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    const payload = {
      item_name_it: draft.nameIt,
      item_name_en: draft.nameEn || null,
      waste_type_id: draft.categoryId,
      tip_it: draft.tipIt || null,
      tip_en: draft.tipEn || null,
    };
    const { error } = draft.id
      ? await supabase.from('riciclabolario').update(payload).eq('id', draft.id)
      : await supabase.from('riciclabolario').insert(payload);
    setSaving(false);
    if (error) { showToast(t('common.error'), 'error'); return; }
    showToast(t('admin.save') + ' ✓', 'success');
    setDraft(null);
    fetchItems();
  };

  const handleDelete = async () => {
    if (!draft?.id) return;
    const { error } = await supabase.from('riciclabolario').delete().eq('id', draft.id);
    if (error) { showToast(t('common.error'), 'error'); return; }
    showToast(t('admin.delete') + ' ✓', 'success');
    setDraft(null);
    fetchItems();
  };

  return (
    <div className={styles.layout}>
      <div className={styles.listCol}>
        <div className={styles.header}>
          <h1 className={styles.heading}>{t('admin.navDictionary')}</h1>
          <button className={styles.addBtn} onClick={openAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('admin.newEntry')}
          </button>
        </div>

        <div className={styles.searchBar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dictionary.searchPlaceholder')}
          />
        </div>

        <div className={styles.list}>
          {filtered.map((item) => {
            const v = item.waste_type ? wasteVisual(item.waste_type) : null;
            const selected = draft?.id === item.id;
            return (
              <button
                key={item.id}
                className={`${styles.itemRow} ${selected ? styles.itemSelected : ''}`}
                onClick={() => openEdit(item)}
              >
                <span className={styles.itemName}>{item.item_name_it}</span>
                {item.waste_type && v && (
                  <span className={styles.itemPill} style={{ background: v.tint, color: v.pill }}>
                    {locale === 'en' ? item.waste_type.name_en : item.waste_type.name_it}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className={styles.panel}>
        {draft ? (
          <>
            <div className={styles.panelLabel}>{t('admin.editItem')}</div>

            <label className={styles.label}>{t('admin.nameIt')}</label>
            <input className={styles.input} value={draft.nameIt} onChange={(e) => setDraft({ ...draft, nameIt: e.target.value })} />

            <label className={styles.label}>{t('admin.nameEn')}</label>
            <input className={styles.input} value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />

            <label className={styles.label}>{t('admin.wasteType')}</label>
            <div className={styles.typeChips}>
              {wasteTypes.map((wt) => {
                const v = wasteVisual(wt);
                const active = draft.categoryId === wt.id;
                return (
                  <button
                    key={wt.id}
                    type="button"
                    className={styles.typeChip}
                    onClick={() => setDraft({ ...draft, categoryId: wt.id })}
                    style={active ? { background: v.color, color: v.ink } : undefined}
                  >
                    {locale === 'en' ? wt.name_en : wt.name_it}
                  </button>
                );
              })}
            </div>

            <label className={styles.label}>{t('admin.tipItLabel')}</label>
            <textarea className={styles.textarea} rows={3} value={draft.tipIt} onChange={(e) => setDraft({ ...draft, tipIt: e.target.value })} />

            <div className={styles.panelActions}>
              {draft.id && (
                <button className={styles.deleteBtn} onClick={handleDelete}>{t('admin.delete')}</button>
              )}
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? t('common.loading') : t('admin.save')}
              </button>
            </div>
          </>
        ) : (
          <p className={styles.empty}>{t('admin.noSelection')}</p>
        )}
      </aside>
    </div>
  );
}

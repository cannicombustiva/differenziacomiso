'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { createClient } from '@/lib/supabase/client';
import SearchBar from '@/components/SearchBar/SearchBar';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import Card from '@/components/ui/Card/Card';
import { useToast } from '@/components/ui/Toast/Toast';
import type { RiciclabolarioItem, WasteType } from '@/types';
import styles from './page.module.css';

export default function AdminRiciclabolarioPage() {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<RiciclabolarioItem[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [editItem, setEditItem] = useState<RiciclabolarioItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formNameIt, setFormNameIt] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTipIt, setFormTipIt] = useState('');
  const [formTipEn, setFormTipEn] = useState('');

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
        setItems((data || []).map(row => ({ ...row, waste_type: row.waste_types })) as RiciclabolarioItem[]);
      });
  };

  const filtered = search.trim()
    ? items.filter((item) =>
        item.item_name_it.toLowerCase().includes(search.toLowerCase()) ||
        (item.item_name_en && item.item_name_en.toLowerCase().includes(search.toLowerCase()))
      )
    : items;

  const openEdit = (item: RiciclabolarioItem) => {
    setEditItem(item);
    setFormNameIt(item.item_name_it);
    setFormNameEn(item.item_name_en || '');
    setFormCategory(item.waste_type_id);
    setFormTipIt(item.tip_it || '');
    setFormTipEn(item.tip_en || '');
  };

  const openAdd = () => {
    setShowAdd(true);
    setFormNameIt('');
    setFormNameEn('');
    setFormCategory(wasteTypes[0]?.id || '');
    setFormTipIt('');
    setFormTipEn('');
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      item_name_it: formNameIt,
      item_name_en: formNameEn || null,
      waste_type_id: formCategory,
      tip_it: formTipIt || null,
      tip_en: formTipEn || null,
    };

    const { error } = editItem
      ? await supabase.from('riciclabolario').update(payload).eq('id', editItem.id)
      : await supabase.from('riciclabolario').insert(payload);

    setSaving(false);
    if (error) { showToast(t('common.error'), 'error'); return; }
    showToast(t('admin.save') + ' ✓', 'success');
    setEditItem(null);
    setShowAdd(false);
    fetchItems();
  };

  const handleDelete = async () => {
    if (!editItem) return;
    const { error } = await supabase.from('riciclabolario').delete().eq('id', editItem.id);
    if (error) { showToast(t('common.error'), 'error'); return; }
    showToast(t('admin.delete') + ' ✓', 'success');
    setEditItem(null);
    fetchItems();
  };

  const isEditing = !!editItem || showAdd;

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.heading}>{t('admin.dictionaryManager')}</h2>
        <Button size="sm" onClick={openAdd}>{t('admin.add')}</Button>
      </div>

      <div className={styles.searchWrapper}>
        <SearchBar value={search} onChange={setSearch} placeholder={t('dictionary.searchPlaceholder')} />
      </div>

      <div className={styles.list}>
        {filtered.map((item) => (
          <Card key={item.id} accentColor={item.waste_type?.color_hex} className={styles.itemCard}>
            <div className={styles.itemRow}>
              <div>
                <p className={styles.itemName}>{item.item_name_it}</p>
                {item.item_name_en && <p className={styles.itemNameEn}>{item.item_name_en}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                {t('admin.edit')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isEditing}
        onClose={() => { setEditItem(null); setShowAdd(false); }}
        title={editItem ? t('admin.edit') : t('admin.add')}
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nome (IT)</label>
            <input className={styles.input} value={formNameIt} onChange={(e) => setFormNameIt(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Name (EN)</label>
            <input className={styles.input} value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Categoria</label>
            <select className={styles.input} value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
              {wasteTypes.map((wt) => (
                <option key={wt.id} value={wt.id}>
                  {locale === 'it' ? wt.name_it : wt.name_en}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Suggerimento (IT)</label>
            <input className={styles.input} value={formTipIt} onChange={(e) => setFormTipIt(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Tip (EN)</label>
            <input className={styles.input} value={formTipEn} onChange={(e) => setFormTipEn(e.target.value)} />
          </div>
          <div className={styles.actions}>
            {editItem && (
              <Button variant="danger" size="sm" onClick={handleDelete}>{t('admin.delete')}</Button>
            )}
            <Button variant="secondary" onClick={() => { setEditItem(null); setShowAdd(false); }}>{t('admin.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? t('common.loading') : t('admin.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

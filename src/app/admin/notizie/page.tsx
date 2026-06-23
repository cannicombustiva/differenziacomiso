'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
import { useToast } from '@/components/ui/Toast/Toast';
import type { Announcement } from '@/types';
import { format } from 'date-fns';
import styles from './page.module.css';

export default function AdminNotiziePage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formTitleIt, setFormTitleIt] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formBodyIt, setFormBodyIt] = useState('');
  const [formBodyEn, setFormBodyEn] = useState('');
  const [formPublished, setFormPublished] = useState(false);

  const supabase = createClient();

  const fetchAnnouncements = () => {
    supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        setAnnouncements((data || []) as Announcement[]);
      });
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openEdit = (ann: Announcement) => {
    setEditItem(ann);
    setFormTitleIt(ann.title_it);
    setFormTitleEn(ann.title_en || '');
    setFormBodyIt(ann.body_it);
    setFormBodyEn(ann.body_en || '');
    setFormPublished(ann.is_published);
  };

  const openAdd = () => {
    setShowAdd(true);
    setFormTitleIt('');
    setFormTitleEn('');
    setFormBodyIt('');
    setFormBodyEn('');
    setFormPublished(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title_it: formTitleIt,
      title_en: formTitleEn || null,
      body_it: formBodyIt,
      body_en: formBodyEn || null,
      is_published: formPublished,
      published_at: formPublished ? new Date().toISOString() : null,
    };

    const { error } = editItem
      ? await supabase.from('announcements').update(payload).eq('id', editItem.id)
      : await supabase.from('announcements').insert(payload);

    setSaving(false);
    if (error) { showToast(t('common.error'), 'error'); return; }
    showToast(t('admin.save') + ' ✓', 'success');
    setEditItem(null);
    setShowAdd(false);
    fetchAnnouncements();
  };

  const handleDelete = async () => {
    if (!editItem) return;
    const { error } = await supabase.from('announcements').delete().eq('id', editItem.id);
    if (error) { showToast(t('common.error'), 'error'); return; }
    showToast(t('admin.delete') + ' ✓', 'success');
    setEditItem(null);
    fetchAnnouncements();
  };

  const isEditing = !!editItem || showAdd;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>{t('admin.navNews')}</h1>
          <p className={styles.count}>{announcements.length} {t('admin.announcements')}</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('admin.add')}
        </button>
      </div>

      <div className={styles.list}>
        {announcements.map((ann) => {
          const date = format(new Date(ann.published_at || ann.created_at), 'dd/MM/yyyy');
          return (
            <div key={ann.id} className={styles.rowCard}>
              <div className={styles.rowMeta}>
                <span className={styles.annTitle}>{ann.title_it}</span>
                <span className={styles.annDate}>
                  {ann.is_published ? date : `${t('admin.draft')} · ${date}`}
                </span>
              </div>
              <span className={`${styles.badge} ${ann.is_published ? styles.published : styles.draft}`}>
                {ann.is_published ? t('admin.published') : t('admin.draft')}
              </span>
              <button className={styles.editBtn} onClick={() => openEdit(ann)}>{t('admin.edit')}</button>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isEditing}
        onClose={() => { setEditItem(null); setShowAdd(false); }}
        title={editItem ? t('admin.edit') : t('admin.add')}
      >
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Titolo (IT)</label>
            <input className={styles.input} value={formTitleIt} onChange={(e) => setFormTitleIt(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Title (EN)</label>
            <input className={styles.input} value={formTitleEn} onChange={(e) => setFormTitleEn(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Testo (IT)</label>
            <textarea className={styles.textarea} value={formBodyIt} onChange={(e) => setFormBodyIt(e.target.value)} rows={4} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Body (EN)</label>
            <textarea className={styles.textarea} value={formBodyEn} onChange={(e) => setFormBodyEn(e.target.value)} rows={4} />
          </div>
          <label className={styles.checkItem}>
            <input type="checkbox" checked={formPublished} onChange={(e) => setFormPublished(e.target.checked)} />
            <span>{t('admin.publish')}</span>
          </label>
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

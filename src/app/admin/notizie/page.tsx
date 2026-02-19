'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
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
        <h2 className={styles.heading}>{t('admin.newsManager')}</h2>
        <Button size="sm" onClick={openAdd}>{t('admin.add')}</Button>
      </div>

      <div className={styles.list}>
        {announcements.map((ann) => (
          <Card key={ann.id} className={styles.card}>
            <div className={styles.row}>
              <div>
                <p className={styles.annTitle}>{ann.title_it}</p>
                <p className={styles.annDate}>{format(new Date(ann.published_at || ann.created_at), 'dd/MM/yyyy')}</p>
              </div>
              <div className={styles.rowActions}>
                <span className={`${styles.badge} ${ann.is_published ? styles.published : styles.draft}`}>
                  {ann.is_published ? t('admin.publish') : t('admin.unpublish')}
                </span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(ann)}>
                  {t('admin.edit')}
                </Button>
              </div>
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

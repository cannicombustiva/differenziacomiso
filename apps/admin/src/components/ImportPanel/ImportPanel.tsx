'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useLocale } from '@differenzia/core/i18n';
import { formatDateLocalized } from '@differenzia/core/dates';
import Modal from '@differenzia/ui/modal';
import { useToast } from '@differenzia/ui/toast';
import Button from '@/components/ui/Button/Button';
import {
  checkImportFile,
  checkImportForm,
  wholeYearRange,
  type ImportRange,
  type ImportRejection,
  type ImportStatus,
  type ImportSummary,
} from '@/lib/import-intake';
import styles from './ImportPanel.module.css';

const REJECTION_KEY: Record<ImportRejection, string> = {
  'empty': 'admin.importErrorEmpty',
  'too-large': 'admin.importErrorTooLarge',
  'not-pdf': 'admin.importErrorNotPdf',
  'range-invalid': 'admin.importErrorRangeInvalid',
};

/** The Schedule begins with 2026 (the seed); no earlier Busso calendar concerns the app. */
const FIRST_IMPORT_YEAR = 2026;

const STATUS_KEY: Record<ImportStatus, string> = {
  draft: 'admin.importStatusDraft',
  approved: 'admin.importStatusApproved',
  discarded: 'admin.importStatusDiscarded',
};

/** The server's rejection code if it sent one, so both sides speak the same messages. */
function rejectionKey(code: unknown): string {
  return typeof code === 'string' && code in REJECTION_KEY
    ? REJECTION_KEY[code as ImportRejection]
    : 'admin.importErrorFailed';
}

/**
 * The Import entry point on the Admin calendar (#82): attach the Busso PDF for
 * a range and get a retained draft. Nothing here writes the Schedule — reading
 * the PDF and approving a Proposal are later slices (ADR 0007).
 */
export default function ImportPanel() {
  const { locale, t } = useLocale();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  // Bumped after an upload so the file picker remounts empty along with `file`.
  const [pickerKey, setPickerKey] = useState(0);
  const [preset, setPreset] = useState<'year' | 'custom'>('year');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imports, setImports] = useState<ImportSummary[] | null>(null);
  const [discarding, setDiscarding] = useState<ImportSummary | null>(null);

  const range: ImportRange = preset === 'year' ? wholeYearRange(year) : { start: customStart, end: customEnd };

  const loadImports = useCallback(async () => {
    const res = await fetch('/api/imports', { cache: 'no-store' });
    if (!res.ok) {
      console.error('Import list failed:', res.status);
      setImports([]);
      return;
    }
    setImports(((await res.json()) as { imports: ImportSummary[] }).imports);
  }, []);

  useEffect(() => { loadImports(); }, [loadImports]);

  // A bare `yyyy-MM-dd` parses as UTC midnight, which is the previous day
  // anywhere west of Greenwich; pin it to local midnight. Timestamps
  // (`created_at`) carry their own offset and parse as they are.
  const formatDate = (value: string) =>
    formatDateLocalized(new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value), 'd MMM yyyy', locale);

  const handleFileChange = (next: File | null) => {
    setFile(next);
    const rejection = next ? checkImportFile(next) : null;
    setError(rejection ? t(REJECTION_KEY[rejection]) : null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const rejection = checkImportForm(file, range);
    if (rejection) {
      setError(t(REJECTION_KEY[rejection]));
      return;
    }

    setUploading(true);
    setError(null);
    const body = new FormData();
    body.append('file', file!);
    body.append('start', range.start);
    body.append('end', range.end);

    try {
      const res = await fetch('/api/imports', { method: 'POST', body });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(t(rejectionKey(payload.error)));
        return;
      }
      showToast(t('admin.importCreated'), 'success');
      setFile(null);
      setPickerKey((k) => k + 1);
      await loadImports();
    } catch (err) {
      console.error('Import upload failed:', err);
      setError(t('admin.importErrorFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDiscard = async () => {
    if (!discarding) return;
    const res = await fetch(`/api/imports/${discarding.id}/discard`, { method: 'POST' });
    setDiscarding(null);
    if (!res.ok) {
      showToast(t('common.error'), 'error');
    } else {
      showToast(t('admin.importDiscarded'), 'success');
    }
    // Refresh either way: a 409 means someone else already moved it on.
    await loadImports();
  };

  return (
    <section className={styles.panel} aria-labelledby="import-title">
      <h3 id="import-title" className={styles.subheading}>{t('admin.importTitle')}</h3>
      <p className={styles.hint}>{t('admin.importHint')}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="import-file" className={styles.label}>{t('admin.importFile')}</label>
          <input
            key={pickerKey}
            id="import-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className={styles.fileInput}
          />
        </div>

        <fieldset className={styles.field}>
          <legend className={styles.label}>{t('admin.importRange')}</legend>
          <div className={styles.presets}>
            <label className={styles.radio}>
              <input type="radio" name="import-preset" checked={preset === 'year'} onChange={() => setPreset('year')} />
              {t('admin.importPresetYear')}
            </label>
            <label className={styles.radio}>
              <input type="radio" name="import-preset" checked={preset === 'custom'} onChange={() => setPreset('custom')} />
              {t('admin.importPresetCustom')}
            </label>
          </div>

          {preset === 'year' ? (
            <div className={styles.row}>
              <label className={styles.inline}>
                <span className={styles.label}>{t('admin.importYear')}</span>
                <input
                  type="number"
                  min={FIRST_IMPORT_YEAR}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={styles.input}
                />
              </label>
            </div>
          ) : (
            <div className={styles.row}>
              <label className={styles.inline}>
                <span className={styles.label}>{t('admin.fromDate')}</span>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={styles.input} />
              </label>
              <label className={styles.inline}>
                <span className={styles.label}>{t('admin.toDate')}</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={styles.input} />
              </label>
            </div>
          )}
        </fieldset>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div>
          <Button type="submit" size="sm" disabled={uploading}>
            {uploading ? t('common.loading') : t('admin.importSubmit')}
          </Button>
        </div>
      </form>

      <h4 className={styles.listHeading}>{t('admin.importPast')}</h4>
      {imports === null ? (
        <p className={styles.hint}>{t('common.loading')}</p>
      ) : imports.length === 0 ? (
        <p className={styles.hint}>{t('admin.importNone')}</p>
      ) : (
        <ul className={styles.list}>
          {imports.map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.itemText}>
                <span className={styles.itemRange}>
                  {formatDate(item.range_start)} – {formatDate(item.range_end)}
                </span>
                <span className={styles.itemMeta}>
                  {t('admin.importStartedOn')} {formatDate(item.created_at)}
                </span>
              </div>
              <span className={`${styles.badge} ${styles[item.status]}`}>{t(STATUS_KEY[item.status])}</span>
              <div className={styles.itemActions}>
                <a href={`/api/imports/${item.id}/pdf`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {t('admin.importOpenPdf')}
                </a>
                {item.status === 'draft' && (
                  <Button variant="secondary" size="sm" onClick={() => setDiscarding(item)}>
                    {t('admin.importDiscard')}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={!!discarding} onClose={() => setDiscarding(null)} title={t('admin.importDiscardTitle')}>
        <p className={styles.hint}>{t('admin.importDiscardHint')}</p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setDiscarding(null)}>{t('admin.cancel')}</Button>
          <Button variant="danger" onClick={handleDiscard}>{t('admin.importDiscard')}</Button>
        </div>
      </Modal>
    </section>
  );
}

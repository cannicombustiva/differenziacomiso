/**
 * The intake rules for an Import (#82): what an Admin may attach and for which
 * range. Shared by the upload form, which rejects early, and the route, which
 * rejects for real — the browser's word on a file is never the last one.
 */

/** The private Storage bucket holding every Import's source PDF. */
export const IMPORT_BUCKET = 'schedule-imports';

/** The Busso calendar is a few hundred KB; 10 MB leaves room for a scanned copy. */
export const MAX_IMPORT_PDF_BYTES = 10 * 1024 * 1024;

export type ImportRejection = 'empty' | 'too-large' | 'not-pdf' | 'range-invalid';

/** Every PDF opens with this header; anything else was only renamed to .pdf. */
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

/**
 * Why this file cannot start an Import, or null if it can. `head` is the
 * file's first bytes: only the server has them, and only they are proof —
 * without them the declared type (or, when a browser leaves it blank, the
 * extension) is all there is to go on.
 */
export function checkImportFile(
  file: { name: string; type: string; size: number },
  head?: Uint8Array
): ImportRejection | null {
  if (file.size === 0) return 'empty';
  // Size first: an oversized PDF should say "too large", not make the Admin
  // wonder what is wrong with the document.
  if (file.size > MAX_IMPORT_PDF_BYTES) return 'too-large';

  const declaredPdf = file.type
    ? file.type === 'application/pdf'
    : file.name.toLowerCase().endsWith('.pdf');
  if (!declaredPdf) return 'not-pdf';

  if (head && !PDF_MAGIC.every((byte, i) => head[i] === byte)) return 'not-pdf';

  return null;
}

/** A real calendar date as `yyyy-MM-dd`; `2027-02-30` is not one. */
function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Why this range cannot be imported, or null if it can. */
export function checkImportRange(
  start: string | null | undefined,
  end: string | null | undefined
): ImportRejection | null {
  if (!start || !end || !isIsoDate(start) || !isIsoDate(end)) return 'range-invalid';
  // ISO dates compare correctly as strings. Mirrors the table's CHECK.
  if (end < start) return 'range-invalid';
  return null;
}

/** An Import's date range as `yyyy-MM-dd` strings, inclusive at both ends. */
export interface ImportRange {
  start: string;
  end: string;
}

/**
 * Why the upload form cannot be submitted, or null if it can: the one
 * rejection to show. The file wins over the range because it is what the
 * Admin most recently touched.
 */
export function checkImportForm(file: { name: string; type: string; size: number } | null, range: ImportRange): ImportRejection | null {
  if (!file) return 'empty';
  return checkImportFile(file) ?? checkImportRange(range.start, range.end);
}

/** The default preset: the Busso PDF covers one calendar year. */
export function wholeYearRange(year: number): ImportRange {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export type ImportStatus = 'draft' | 'approved' | 'discarded';

/** One row of the past-Imports list, as `/api/imports` returns it. */
export interface ImportSummary {
  id: string;
  range_start: string;
  range_end: string;
  status: ImportStatus;
  created_at: string;
}

/** The columns behind an `ImportSummary`. */
export const IMPORT_SUMMARY_COLUMNS = 'id, range_start, range_end, status, created_at';

/**
 * Whether a route segment can be an Import id. Checked before querying: a
 * malformed id is a 404, not a Postgres cast error surfacing as a 500.
 */
export function isImportId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

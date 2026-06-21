import type { RiciclabolarioItem } from '@/types';

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lowercase and strip diacritics, so "caffe" matches "caffè". */
function fold(text: string): string {
  // NFD splits accented chars into base + combining mark (U+0300-U+036F); drop
  // the marks. Avoids the \p{Diacritic} unicode escape (needs target es6+).
  return text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
}

/** The folded text searched for an item: both-language names and tips. */
function haystack(item: RiciclabolarioItem): string {
  return fold(
    [item.item_name_it, item.item_name_en, item.tip_it, item.tip_en]
      .filter(Boolean)
      .join(' ')
  );
}

/**
 * Client-side Riciclabolario search: accent- and case-insensitive substring
 * match. Works offline over the full cached dataset.
 */
export function searchRiciclabolario(
  items: RiciclabolarioItem[],
  query: string
): RiciclabolarioItem[] {
  if (!query.trim()) return items;
  const q = fold(query);
  return items.filter((item) => haystack(item).includes(q));
}

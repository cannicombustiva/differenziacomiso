import type { WasteType } from '@/types';

/**
 * Refreshed visual palette for each waste type, keyed by a stable slug derived
 * from the Italian name. The database `color_hex` still holds the pre-refresh
 * palette, so the refreshed colours, light tints (icon wells / pills) and label
 * ink live here as the single source of truth for the UI.
 *
 * If `waste_types.color_hex` is ever re-seeded to the refreshed values, callers
 * can switch to reading the column + `textOn()` and drop this map.
 */
export type WasteSlug =
  | 'secco'
  | 'umido'
  | 'carta'
  | 'plastica'
  | 'vetro'
  | 'lattine'
  | 'abiti';

export interface WasteVisual {
  slug: WasteSlug;
  /** Solid colour for tiles, accents and dots. */
  color: string;
  /** Light tint for icon wells and pills. */
  tint: string;
  /** Readable text/icon colour when placed on `color`. */
  ink: string;
  /** Readable text colour when placed on `tint` (pills/chips). */
  pill: string;
}

const STYLES: Record<WasteSlug, Omit<WasteVisual, 'slug'>> = {
  secco: { color: '#6B6B6B', tint: '#ECECEC', ink: '#FFFFFF', pill: '#5B5B5B' },
  umido: { color: '#7A4F2E', tint: '#EFE5DC', ink: '#FFFFFF', pill: '#7A4F2E' },
  carta: { color: '#1E6FCB', tint: '#DCEAFA', ink: '#FFFFFF', pill: '#1E6FCB' },
  // Yellow needs a much darker ink to stay readable on its pale tint (AA).
  plastica: { color: '#E8B500', tint: '#FBF1CC', ink: '#3A2E00', pill: '#8A6C00' },
  vetro: { color: '#2E8B57', tint: '#DDF0E5', ink: '#FFFFFF', pill: '#2E8B57' },
  lattine: { color: '#1796A6', tint: '#DAF1F4', ink: '#FFFFFF', pill: '#0E7A88' },
  abiti: { color: '#B5559E', tint: '#F4E2EF', ink: '#FFFFFF', pill: '#B5559E' },
};

/** Map a waste type to its slug via its Italian name. Falls back to `secco`. */
export function wasteSlug(wasteType: WasteType): WasteSlug {
  const n = wasteType.name_it.toLowerCase();
  if (n.includes('plastic')) return 'plastica';
  if (n.includes('vetro')) return 'vetro';
  if (n.includes('lattin')) return 'lattine';
  if (n.includes('carta')) return 'carta';
  if (n.includes('umido')) return 'umido';
  if (n.includes('abiti')) return 'abiti';
  return 'secco';
}

/** Refreshed colour/tint/ink for a waste type. */
export function wasteVisual(wasteType: WasteType): WasteVisual {
  const slug = wasteSlug(wasteType);
  return { slug, ...STYLES[slug] };
}

/** Readable text colour (`#1A1A1A` or `#FFFFFF`) for any background hex. */
export function textOn(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#1A1A1A';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? '#1A1A1A' : '#FFFFFF';
}

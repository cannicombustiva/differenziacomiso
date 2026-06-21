/**
 * The Settimana Tipo — the single source of truth for the default weekly
 * Pickup pattern (see CONTEXT.md and ADR 0002). A pure function from a date to
 * the set of waste-type keys collected that day. The Admin bulk-fill, the demo
 * data, and the seed generator all derive from this one function so they can
 * never disagree.
 */

/** Canonical key for each of the 7 waste types (matches name_it, normalised). */
export type WasteKey =
  | 'secco_residuo'
  | 'umido'
  | 'carta_e_cartone'
  | 'plastica'
  | 'vetro'
  | 'lattine'
  | 'abiti_usati';

/** Canonical Italian waste-type name (matches waste_types.name_it) per key. */
export const WASTE_KEY_NAME_IT: Record<WasteKey, string> = {
  secco_residuo: 'Secco Residuo',
  umido: 'Umido',
  carta_e_cartone: 'Carta e Cartone',
  plastica: 'Plastica',
  vetro: 'Vetro',
  lattine: 'Lattine',
  abiti_usati: 'Abiti Usati',
};

/** The waste-type keys collected on `date` under the Settimana Tipo. */
export function settimanaTipo(date: Date): WasteKey[] {
  const dow = date.getDay(); // 0=Sun, 1=Mon, ...6=Sat
  switch (dow) {
    case 1: // Lunedì
      return ['umido', 'vetro'];
    case 2: // Martedì
      return ['plastica'];
    case 3: // Mercoledì
      return ['umido', 'lattine'];
    case 4: // Giovedì — alternates by week-of-month
      return giovedi(date);
    case 5: // Venerdì
      return ['carta_e_cartone'];
    case 6: // Sabato
      return ['umido'];
    default: // Domenica (0) — no collection
      return [];
  }
}

/**
 * Giovedì alternation (ADR 0002): Secco on weeks 1,3; Abiti on weeks 2,4;
 * nothing on a 5th Thursday. Week-of-month is ceil(day/7), reset each month —
 * not a fortnightly cadence. The empty 5th Thursday is deliberate: any rule
 * that assigns every Thursday a type cannot reproduce the real calendar.
 */
function giovedi(date: Date): WasteKey[] {
  const week = Math.ceil(date.getDate() / 7);
  switch (week) {
    case 1:
    case 3:
      return ['secco_residuo'];
    case 2:
    case 4:
      return ['abiti_usati'];
    default: // 5th Thursday — no Giovedì Pickup
      return [];
  }
}

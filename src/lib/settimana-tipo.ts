export type WasteTypeKey =
  | 'secco_residuo'
  | 'umido'
  | 'carta_e_cartone'
  | 'plastica'
  | 'vetro'
  | 'lattine'
  | 'abiti_usati';

/** Canonical Italian name (matches `waste_types.name_it`) for each key. */
export const WASTE_TYPE_NAME_IT: Record<WasteTypeKey, string> = {
  secco_residuo: 'Secco Residuo',
  umido: 'Umido',
  carta_e_cartone: 'Carta e Cartone',
  plastica: 'Plastica',
  vetro: 'Vetro',
  lattine: 'Lattine',
  abiti_usati: 'Abiti Usati',
};

/**
 * The Settimana Tipo: the default weekly Pickup pattern, exception-free.
 * Returns the waste-type keys collected on the given calendar date.
 */
export function settimanaTipo(date: Date): WasteTypeKey[] {
  const dow = date.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  switch (dow) {
    case 1:
      return ['umido', 'vetro'];
    case 2:
      return ['plastica'];
    case 3:
      return ['umido', 'lattine'];
    case 4:
      // Weeks 1,3 → Secco; weeks 2,4 → Abiti Usati; 5th Thursday → none.
      if (weekOfMonth === 1 || weekOfMonth === 3) return ['secco_residuo'];
      if (weekOfMonth === 2 || weekOfMonth === 4) return ['abiti_usati'];
      return [];
    case 5:
      return ['carta_e_cartone'];
    case 6:
      return ['umido'];
    default:
      return [];
  }
}

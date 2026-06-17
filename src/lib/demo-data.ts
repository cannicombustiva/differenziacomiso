import type { WasteType, CollectionDayGrouped, RiciclabolarioItem, Announcement } from '@/types';
import { format, addDays } from 'date-fns';
import { settimanaTipo, WASTE_TYPE_NAME_IT } from '@/lib/settimana-tipo';

/**
 * Demo/placeholder data used until Supabase is connected.
 * This mirrors the Settimana Tipo from the CLAUDE.md spec.
 */

export const WASTE_TYPES: WasteType[] = [
  { id: '1', name_it: 'Secco Residuo', name_en: 'Non-recyclable', color_hex: '#8C8C8C', sort_order: 0, created_at: '' },
  { id: '2', name_it: 'Umido', name_en: 'Organic', color_hex: '#8B5E3C', sort_order: 1, created_at: '' },
  { id: '3', name_it: 'Carta e Cartone', name_en: 'Paper & Cardboard', color_hex: '#2B7BD5', sort_order: 2, created_at: '' },
  { id: '4', name_it: 'Plastica', name_en: 'Plastic', color_hex: '#F5C518', sort_order: 3, created_at: '' },
  { id: '5', name_it: 'Vetro', name_en: 'Glass', color_hex: '#2E8B57', sort_order: 4, created_at: '' },
  { id: '6', name_it: 'Lattine', name_en: 'Cans', color_hex: '#5BC0DE', sort_order: 5, created_at: '' },
  { id: '7', name_it: 'Abiti Usati', name_en: 'Used Clothing', color_hex: '#C77DBA', sort_order: 6, created_at: '' },
];

const WT_BY_NAME = new Map(WASTE_TYPES.map(wt => [wt.name_it, wt]));

/** Resolve the Settimana Tipo for a date into demo WasteType records. */
function getSettimanaTypes(date: Date): WasteType[] {
  return settimanaTipo(date)
    .map(key => WT_BY_NAME.get(WASTE_TYPE_NAME_IT[key]))
    .filter((wt): wt is WasteType => Boolean(wt));
}

export function generateCollectionsForRange(start: Date, days: number): CollectionDayGrouped[] {
  const result: CollectionDayGrouped[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const wasteTypes = getSettimanaTypes(date);
    result.push({
      date: dateStr,
      wasteTypes,
      isHoliday: false,
    });
  }
  return result;
}

export function getTomorrowCollections(tomorrow: Date): CollectionDayGrouped {
  const dateStr = format(tomorrow, 'yyyy-MM-dd');
  const wasteTypes = getSettimanaTypes(tomorrow);
  return {
    date: dateStr,
    wasteTypes,
    isHoliday: false,
  };
}

export const DEMO_RICICLABOLARIO: RiciclabolarioItem[] = [
  { id: '1', item_name_it: 'Bottiglia di plastica', item_name_en: 'Plastic bottle', waste_type_id: '4', waste_type: WASTE_TYPES[3], tip_it: 'Sciacqua e schiaccia prima di gettare', tip_en: 'Rinse and crush before disposing', created_at: '' },
  { id: '2', item_name_it: 'Bottiglia di vetro', item_name_en: 'Glass bottle', waste_type_id: '5', waste_type: WASTE_TYPES[4], tip_it: 'Rimuovi il tappo', tip_en: 'Remove the cap', created_at: '' },
  { id: '3', item_name_it: 'Giornale', item_name_en: 'Newspaper', waste_type_id: '3', waste_type: WASTE_TYPES[2], created_at: '' },
  { id: '4', item_name_it: 'Cartone del latte', item_name_en: 'Milk carton', waste_type_id: '3', waste_type: WASTE_TYPES[2], tip_it: 'Sciacqua prima di gettare', tip_en: 'Rinse before disposing', created_at: '' },
  { id: '5', item_name_it: 'Lattina di alluminio', item_name_en: 'Aluminum can', waste_type_id: '6', waste_type: WASTE_TYPES[5], tip_it: 'Sciacqua prima di gettare', tip_en: 'Rinse before disposing', created_at: '' },
  { id: '6', item_name_it: 'Bucce di frutta', item_name_en: 'Fruit peels', waste_type_id: '2', waste_type: WASTE_TYPES[1], created_at: '' },
  { id: '7', item_name_it: 'Pannolino', item_name_en: 'Diaper', waste_type_id: '1', waste_type: WASTE_TYPES[0], tip_it: 'Chiudi bene prima di gettare', tip_en: 'Seal well before disposing', created_at: '' },
  { id: '8', item_name_it: 'Scatola di cartone', item_name_en: 'Cardboard box', waste_type_id: '3', waste_type: WASTE_TYPES[2], tip_it: 'Appiattisci prima di gettare', tip_en: 'Flatten before disposing', created_at: '' },
  { id: '9', item_name_it: 'Vaschetta di polistirolo', item_name_en: 'Styrofoam tray', waste_type_id: '4', waste_type: WASTE_TYPES[3], tip_it: 'Pulisci da residui di cibo', tip_en: 'Clean food residue', created_at: '' },
  { id: '10', item_name_it: 'Vestiti usati', item_name_en: 'Used clothes', waste_type_id: '7', waste_type: WASTE_TYPES[6], tip_it: 'Riponi in un sacchetto chiuso', tip_en: 'Place in a closed bag', created_at: '' },
  { id: '11', item_name_it: 'Fondi di caffè', item_name_en: 'Coffee grounds', waste_type_id: '2', waste_type: WASTE_TYPES[1], created_at: '' },
  { id: '12', item_name_it: 'Piatto rotto', item_name_en: 'Broken plate', waste_type_id: '1', waste_type: WASTE_TYPES[0], tip_it: 'Avvolgi in carta per sicurezza', tip_en: 'Wrap in paper for safety', created_at: '' },
  { id: '13', item_name_it: 'Flacone di shampoo', item_name_en: 'Shampoo bottle', waste_type_id: '4', waste_type: WASTE_TYPES[3], tip_it: 'Sciacqua e schiaccia', tip_en: 'Rinse and crush', created_at: '' },
  { id: '14', item_name_it: 'Barattolo di vetro', item_name_en: 'Glass jar', waste_type_id: '5', waste_type: WASTE_TYPES[4], tip_it: 'Sciacqua e rimuovi il coperchio', tip_en: 'Rinse and remove lid', created_at: '' },
  { id: '15', item_name_it: 'Scatoletta di tonno', item_name_en: 'Tuna can', waste_type_id: '6', waste_type: WASTE_TYPES[5], tip_it: 'Sciacqua prima di gettare', tip_en: 'Rinse before disposing', created_at: '' },
];

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title_it: 'Modifiche calendario festività 2026',
    title_en: 'Holiday schedule changes 2026',
    body_it: 'Si informano i cittadini che durante le festività del 2026 il calendario di raccolta potrebbe subire variazioni. Controllate regolarmente l\'app per aggiornamenti.',
    body_en: 'Citizens are informed that during 2026 holidays, the collection schedule may change. Check the app regularly for updates.',
    is_published: true,
    published_at: '2026-01-15T10:00:00Z',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    title_it: 'Nuova app DifferenziaComiso disponibile!',
    title_en: 'New DifferenziaComiso app available!',
    body_it: 'È disponibile la nuova app DifferenziaComiso per consultare il calendario di raccolta differenziata porta a porta. Installala sul tuo smartphone!',
    body_en: 'The new DifferenziaComiso app is available to check the door-to-door waste collection calendar. Install it on your smartphone!',
    is_published: true,
    published_at: '2026-01-01T08:00:00Z',
    created_at: '2026-01-01T08:00:00Z',
  },
];

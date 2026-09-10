export interface WasteType {
  id: string;
  name_it: string;
  name_en: string;
  color_hex: string;
  icon?: string;
  sort_order: number;
  created_at: string;
}

export interface CollectionDay {
  id: string;
  date: string;
  waste_type_id: string;
  waste_type?: WasteType;
  is_holiday: boolean;
  holiday_note_it?: string;
  holiday_note_en?: string;
  created_at: string;
  updated_at: string;
}

export interface RiciclabolarioItem {
  id: string;
  item_name_it: string;
  item_name_en?: string;
  waste_type_id: string;
  waste_type?: WasteType;
  tip_it?: string;
  tip_en?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title_it: string;
  title_en?: string;
  body_it: string;
  body_en?: string;
  image_url?: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
  created_at: string;
}

export type Locale = 'it' | 'en';

export interface CollectionDayGrouped {
  date: string;
  wasteTypes: WasteType[];
  isHoliday: boolean;
  holidayNote?: string;
  /** Per-Pickup explanatory notes for the day, e.g. a Recupero ("Recupero del 6/1"). */
  notes?: string[];
}

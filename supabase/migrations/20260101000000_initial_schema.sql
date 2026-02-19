-- Waste types (reference table, seeded)
CREATE TABLE waste_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_it TEXT NOT NULL,
  name_en TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily collection schedule
CREATE TABLE collection_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  waste_type_id UUID REFERENCES waste_types(id) ON DELETE CASCADE,
  is_holiday BOOLEAN DEFAULT false,
  holiday_note_it TEXT,
  holiday_note_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, waste_type_id)
);

-- Riciclabolario (waste dictionary)
CREATE TABLE riciclabolario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name_it TEXT NOT NULL,
  item_name_en TEXT,
  waste_type_id UUID REFERENCES waste_types(id),
  tip_it TEXT,
  tip_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- News / Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_it TEXT NOT NULL,
  title_en TEXT,
  body_it TEXT NOT NULL,
  body_en TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Push notification subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_schedule_date ON collection_schedule(date);
CREATE INDEX idx_riciclabolario_search ON riciclabolario USING gin(to_tsvector('italian', item_name_it));

-- Row Level Security
ALTER TABLE waste_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE riciclabolario ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read waste_types" ON waste_types FOR SELECT USING (true);
CREATE POLICY "Public read collection_schedule" ON collection_schedule FOR SELECT USING (true);
CREATE POLICY "Public read riciclabolario" ON riciclabolario FOR SELECT USING (true);
CREATE POLICY "Public read published announcements" ON announcements FOR SELECT USING (is_published = true);

-- Service role (admin) can do everything — handled by service role key bypassing RLS
-- Push subscriptions: allow insert from anyone
CREATE POLICY "Anyone can subscribe" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role manage subscriptions" ON push_subscriptions FOR ALL USING (true);

-- ============================================================
-- SEED: waste_types
-- ============================================================
INSERT INTO waste_types (id, name_it, name_en, color_hex, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Secco Residuo', 'Non-recyclable', '#8C8C8C', 0),
  ('a1000000-0000-0000-0000-000000000002', 'Umido', 'Organic', '#8B5E3C', 1),
  ('a1000000-0000-0000-0000-000000000003', 'Carta e Cartone', 'Paper & Cardboard', '#2B7BD5', 2),
  ('a1000000-0000-0000-0000-000000000004', 'Plastica', 'Plastic', '#F5C518', 3),
  ('a1000000-0000-0000-0000-000000000005', 'Vetro', 'Glass', '#2E8B57', 4),
  ('a1000000-0000-0000-0000-000000000006', 'Lattine', 'Cans', '#5BC0DE', 5),
  ('a1000000-0000-0000-0000-000000000007', 'Abiti Usati', 'Used Clothing', '#C77DBA', 6);

-- ============================================================
-- SEED: 2026 collection schedule using Settimana Tipo
-- ============================================================
-- Settimana Tipo:
--   Lunedì (1):    Umido, Vetro
--   Martedì (2):   Plastica
--   Mercoledì (3): Umido, Lattine
--   Giovedì (4):   Secco Residuo (weeks 1,3 of month) / Abiti Usati (weeks 2,4)
--   Venerdì (5):   Carta e Cartone
--   Sabato (6):    Umido
--   Domenica (0):  nessuna raccolta
--
-- PostgreSQL: EXTRACT(DOW FROM date) → 0=Sun, 1=Mon, ..., 6=Sat
-- Week of month: CEIL(EXTRACT(DAY FROM d) / 7.0)

-- Generate all 365 days of 2026 with the Settimana Tipo pattern
DO $$
DECLARE
  d DATE;
  dow INT;
  week_of_month INT;
BEGIN
  d := '2026-01-01';
  WHILE d <= '2026-12-31' LOOP
    dow := EXTRACT(DOW FROM d);
    week_of_month := CEIL(EXTRACT(DAY FROM d) / 7.0);

    -- Lunedì: Umido + Vetro
    IF dow = 1 THEN
      INSERT INTO collection_schedule (date, waste_type_id) VALUES
        (d, 'a1000000-0000-0000-0000-000000000002'),
        (d, 'a1000000-0000-0000-0000-000000000005');

    -- Martedì: Plastica
    ELSIF dow = 2 THEN
      INSERT INTO collection_schedule (date, waste_type_id) VALUES
        (d, 'a1000000-0000-0000-0000-000000000004');

    -- Mercoledì: Umido + Lattine
    ELSIF dow = 3 THEN
      INSERT INTO collection_schedule (date, waste_type_id) VALUES
        (d, 'a1000000-0000-0000-0000-000000000002'),
        (d, 'a1000000-0000-0000-0000-000000000006');

    -- Giovedì: Secco (weeks 1,3) / Abiti Usati (weeks 2,4)
    ELSIF dow = 4 THEN
      IF week_of_month IN (1, 3) THEN
        INSERT INTO collection_schedule (date, waste_type_id) VALUES
          (d, 'a1000000-0000-0000-0000-000000000001');
      ELSE
        INSERT INTO collection_schedule (date, waste_type_id) VALUES
          (d, 'a1000000-0000-0000-0000-000000000007');
      END IF;

    -- Venerdì: Carta e Cartone
    ELSIF dow = 5 THEN
      INSERT INTO collection_schedule (date, waste_type_id) VALUES
        (d, 'a1000000-0000-0000-0000-000000000003');

    -- Sabato: Umido
    ELSIF dow = 6 THEN
      INSERT INTO collection_schedule (date, waste_type_id) VALUES
        (d, 'a1000000-0000-0000-0000-000000000002');
    END IF;

    -- Domenica (dow = 0): no collection, skip

    d := d + 1;
  END LOOP;
END $$;

-- ============================================================
-- HOLIDAY OVERRIDES for 2026
-- ============================================================

-- 1 Gennaio (Giovedì) — Capodanno — no collection
DELETE FROM collection_schedule WHERE date = '2026-01-01';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-01-01', NULL, true, 'Capodanno', 'New Year''s Day');

-- 6 Gennaio (Martedì) — Epifania — Plastica moved to 7 Gennaio
DELETE FROM collection_schedule WHERE date = '2026-01-06';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-01-06', NULL, true, 'Epifania', 'Epiphany');
-- Move Plastica to 7 Gennaio (Mercoledì) — add Plastica, remove Lattine
DELETE FROM collection_schedule WHERE date = '2026-01-07' AND waste_type_id = 'a1000000-0000-0000-0000-000000000006';
INSERT INTO collection_schedule (date, waste_type_id)
  VALUES ('2026-01-07', 'a1000000-0000-0000-0000-000000000004')
  ON CONFLICT (date, waste_type_id) DO NOTHING;

-- 6 Aprile (Lunedì) — Pasquetta — no collection
DELETE FROM collection_schedule WHERE date = '2026-04-06';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-04-06', NULL, true, 'Lunedì dell''Angelo (Pasquetta)', 'Easter Monday');

-- 25 Aprile (Sabato) — Liberazione — no collection
DELETE FROM collection_schedule WHERE date = '2026-04-25';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-04-25', NULL, true, 'Festa della Liberazione', 'Liberation Day');

-- 1 Maggio (Venerdì) — Festa dei Lavoratori — Carta/Cartone moved to 2 Maggio
DELETE FROM collection_schedule WHERE date = '2026-05-01';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-05-01', NULL, true, 'Festa dei Lavoratori', 'Labour Day');
-- Move Carta to 2 Maggio (Sabato) — add it alongside Umido
INSERT INTO collection_schedule (date, waste_type_id)
  VALUES ('2026-05-02', 'a1000000-0000-0000-0000-000000000003')
  ON CONFLICT (date, waste_type_id) DO NOTHING;

-- 2 Giugno (Martedì) — Repubblica — Plastica moved to 3 Giugno
DELETE FROM collection_schedule WHERE date = '2026-06-02';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-06-02', NULL, true, 'Festa della Repubblica', 'Republic Day');
-- Move Plastica to 3 Giugno (Mercoledì) — add Plastica, remove Lattine
DELETE FROM collection_schedule WHERE date = '2026-06-03' AND waste_type_id = 'a1000000-0000-0000-0000-000000000006';
INSERT INTO collection_schedule (date, waste_type_id)
  VALUES ('2026-06-03', 'a1000000-0000-0000-0000-000000000004')
  ON CONFLICT (date, waste_type_id) DO NOTHING;

-- 13 Luglio (Lunedì) — festa locale — no collection
DELETE FROM collection_schedule WHERE date = '2026-07-13';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-07-13', NULL, true, 'Festa patronale', 'Local patron saint feast');

-- 15 Agosto (Sabato) — Ferragosto — no collection
DELETE FROM collection_schedule WHERE date = '2026-08-15';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-08-15', NULL, true, 'Ferragosto', 'Assumption of Mary');

-- 8 Dicembre (Martedì) — Immacolata — Plastica moved to 9 Dicembre
DELETE FROM collection_schedule WHERE date = '2026-12-08';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-12-08', NULL, true, 'Immacolata Concezione', 'Immaculate Conception');
-- Move Plastica to 9 Dicembre (Mercoledì) — add Plastica, remove Lattine
DELETE FROM collection_schedule WHERE date = '2026-12-09' AND waste_type_id = 'a1000000-0000-0000-0000-000000000006';
INSERT INTO collection_schedule (date, waste_type_id)
  VALUES ('2026-12-09', 'a1000000-0000-0000-0000-000000000004')
  ON CONFLICT (date, waste_type_id) DO NOTHING;

-- 25 Dicembre (Venerdì) — Natale — no collection
DELETE FROM collection_schedule WHERE date = '2026-12-25';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-12-25', NULL, true, 'Natale', 'Christmas Day');

-- 26 Dicembre (Sabato) — Santo Stefano — no collection
DELETE FROM collection_schedule WHERE date = '2026-12-26';
INSERT INTO collection_schedule (date, waste_type_id, is_holiday, holiday_note_it, holiday_note_en)
  VALUES ('2026-12-26', NULL, true, 'Santo Stefano', 'St. Stephen''s Day');


-- ============================================================
-- SEED: Riciclabolario
-- ============================================================
INSERT INTO riciclabolario (item_name_it, item_name_en, waste_type_id, tip_it, tip_en) VALUES
  ('Bottiglia di plastica', 'Plastic bottle', 'a1000000-0000-0000-0000-000000000004', 'Sciacqua e schiaccia prima di gettare', 'Rinse and crush before disposing'),
  ('Bottiglia di vetro', 'Glass bottle', 'a1000000-0000-0000-0000-000000000005', 'Rimuovi il tappo', 'Remove the cap'),
  ('Giornale', 'Newspaper', 'a1000000-0000-0000-0000-000000000003', NULL, NULL),
  ('Cartone del latte', 'Milk carton', 'a1000000-0000-0000-0000-000000000003', 'Sciacqua prima di gettare', 'Rinse before disposing'),
  ('Lattina di alluminio', 'Aluminum can', 'a1000000-0000-0000-0000-000000000006', 'Sciacqua prima di gettare', 'Rinse before disposing'),
  ('Bucce di frutta', 'Fruit peels', 'a1000000-0000-0000-0000-000000000002', NULL, NULL),
  ('Pannolino', 'Diaper', 'a1000000-0000-0000-0000-000000000001', 'Chiudi bene prima di gettare', 'Seal well before disposing'),
  ('Scatola di cartone', 'Cardboard box', 'a1000000-0000-0000-0000-000000000003', 'Appiattisci prima di gettare', 'Flatten before disposing'),
  ('Vaschetta di polistirolo', 'Styrofoam tray', 'a1000000-0000-0000-0000-000000000004', 'Pulisci da residui di cibo', 'Clean food residue'),
  ('Vestiti usati', 'Used clothes', 'a1000000-0000-0000-0000-000000000007', 'Riponi in un sacchetto chiuso', 'Place in a closed bag'),
  ('Fondi di caffè', 'Coffee grounds', 'a1000000-0000-0000-0000-000000000002', NULL, NULL),
  ('Piatto rotto', 'Broken plate', 'a1000000-0000-0000-0000-000000000001', 'Avvolgi in carta per sicurezza', 'Wrap in paper for safety'),
  ('Flacone di shampoo', 'Shampoo bottle', 'a1000000-0000-0000-0000-000000000004', 'Sciacqua e schiaccia', 'Rinse and crush'),
  ('Barattolo di vetro', 'Glass jar', 'a1000000-0000-0000-0000-000000000005', 'Sciacqua e rimuovi il coperchio', 'Rinse and remove lid'),
  ('Scatoletta di tonno', 'Tuna can', 'a1000000-0000-0000-0000-000000000006', 'Sciacqua prima di gettare', 'Rinse before disposing');

-- ============================================================
-- SEED: Sample announcements
-- ============================================================
-- ============================================================
-- SEED: Admins
-- ============================================================
INSERT INTO admins (email) VALUES
  ('salvatoredifranco8@gmail.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO announcements (title_it, title_en, body_it, body_en, is_published, published_at) VALUES
  ('Nuova app DifferenziaComiso disponibile!', 'New DifferenziaComiso app available!',
   'È disponibile la nuova app DifferenziaComiso per consultare il calendario di raccolta differenziata porta a porta. Installala sul tuo smartphone!',
   'The new DifferenziaComiso app is available to check the door-to-door waste collection calendar. Install it on your smartphone!',
   true, '2026-01-01 08:00:00+01'),
  ('Modifiche calendario festività 2026', 'Holiday schedule changes 2026',
   'Si informano i cittadini che durante le festività del 2026 il calendario di raccolta potrebbe subire variazioni. Controllate regolarmente l''app per aggiornamenti.',
   'Citizens are informed that during 2026 holidays, the collection schedule may change. Check the app regularly for updates.',
   true, '2026-01-15 10:00:00+01');

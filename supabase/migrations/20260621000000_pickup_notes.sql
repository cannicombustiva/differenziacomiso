-- Per-Pickup notes for Recuperi (ADR 0001: final-state rows carry a note,
-- not a relational link to the Holiday they make up for). Nullable; Holiday
-- rows keep using holiday_note_it / holiday_note_en.
ALTER TABLE collection_schedule
  ADD COLUMN note_it TEXT,
  ADD COLUMN note_en TEXT;

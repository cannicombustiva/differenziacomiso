-- Riciclabolario search is client-side (accent-folded substring over the full
-- cached dataset — works offline, tiny dataset). The GIN to_tsvector index was
-- never queried and implied a server-side full-text design that does not exist.
DROP INDEX IF EXISTS idx_riciclabolario_search;

-- ADR 0006: Coverage is recorded explicitly; absence of Pickups is not evidence.
--
-- `collection_schedule` stores final state (ADR 0001), so a date with nothing
-- collected — every Sunday, every 5th Thursday (ADR 0002) — stores no rows at
-- all. "Zero rows" therefore already means "legitimately nothing collected",
-- and is byte-identical to "this year was never loaded". Without this table the
-- app cannot tell them apart, and on 1 Jan 2027 would tell every subscribed
-- device that nothing is collected, permanently and confidently.

CREATE TABLE schedule_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  -- What established this range: 'seed', or later an Import (ADR 0007).
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT schedule_coverage_range_ordered CHECK (end_date >= start_date)
);

CREATE INDEX idx_schedule_coverage_range ON schedule_coverage(start_date, end_date);

ALTER TABLE schedule_coverage ENABLE ROW LEVEL SECURITY;

-- Public read, matching the other content tables: the Citizen app must be able
-- to tell "day off" from "not loaded" without an account.
CREATE POLICY "Public read schedule_coverage"
  ON schedule_coverage FOR SELECT USING (true);

-- Writes gated on admins membership, per ADR 0003 — not on mere authentication.
CREATE POLICY "Admins write schedule_coverage"
  ON schedule_coverage FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- The 2026 Schedule is already seeded, so it is covered. This INSERT belongs in
-- the migration rather than a runbook step: without it, deploying this table
-- would make the app declare the entire current year unavailable.
INSERT INTO schedule_coverage (start_date, end_date, source)
  VALUES ('2026-01-01', '2026-12-31', 'seed');

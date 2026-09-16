-- #82, ADR 0007: an Import is kept whether or not it goes anywhere.
--
-- This is the intake half: the attached Busso PDF, the range it is for, who
-- started it and its status. `model_output` and `approved_diff` stay NULL until
-- the extraction and approval slices fill them.

CREATE TABLE schedule_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Object path inside the private `schedule-imports` bucket.
  source_pdf_path TEXT NOT NULL UNIQUE,
  range_start DATE NOT NULL,
  range_end DATE NOT NULL,
  -- The raw model output, as returned — evidence even when it is wrong.
  model_output JSONB,
  -- The Divergences the approving Admin actually saw and accepted.
  approved_diff JSONB,
  -- No ON DELETE: an Import is evidence of who started and who approved it,
  -- so removing that Admin must be a deliberate decision, not a silent NULL.
  created_by UUID NOT NULL REFERENCES admins(id),
  approved_by UUID REFERENCES admins(id),
  approved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT schedule_imports_status CHECK (status IN ('draft', 'approved', 'discarded')),
  CONSTRAINT schedule_imports_range_ordered CHECK (range_end >= range_start)
);

CREATE INDEX idx_schedule_imports_created_at ON schedule_imports(created_at DESC);

ALTER TABLE schedule_imports ENABLE ROW LEVEL SECURITY;

-- ADR 0003: gated on admins membership, not mere authentication. No anon
-- policy at all — unlike Coverage, an Import is not Citizen-facing.
--
-- There is deliberately no DELETE policy: discarding sets `status`, and a
-- row that could be deleted would not be a record.
CREATE POLICY "Admins read schedule_imports"
  ON schedule_imports FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Admins insert schedule_imports"
  ON schedule_imports FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins update schedule_imports"
  ON schedule_imports FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- The source PDFs. Private: the Busso calendar is a public municipal document,
-- but a public bucket is a URL that can never be un-published.
--
-- No storage.objects policies are added, so anon and authenticated clients
-- can neither read nor write here; the PDF is reached only through the
-- service-role Admin routes (/api/imports/*). The bucket repeats the intake
-- rules in apps/admin/src/lib/import-intake.ts as a backstop.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('schedule-imports', 'schedule-imports', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

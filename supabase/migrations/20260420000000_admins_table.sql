CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Authenticated users can check if they're admin
CREATE POLICY "Authenticated read admins" ON admins
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- Only service role can manage admins (bypasses RLS anyway)

-- Seed admin records separately per environment (for example via a seed script or manual insert)

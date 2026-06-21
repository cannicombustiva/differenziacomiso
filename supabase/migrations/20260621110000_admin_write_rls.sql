-- ADR 0003: authorize content-table writes on admins-table membership, not
-- mere authentication. The anon key ships to every browser and Supabase email
-- signup is on by default, so "TO authenticated USING (true)" lets anyone who
-- registers write directly. Gate on admins membership instead.

-- SECURITY DEFINER so the policy can read `admins` without RLS recursion.
CREATE OR REPLACE FUNCTION is_admin()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE email = lower(auth.jwt() ->> 'email')
  );
$$;

-- Replace the permissive "authenticated full access" write policies on the
-- four content tables with admins-gated ones. Public SELECT policies are
-- defined elsewhere and remain untouched.
DROP POLICY IF EXISTS "Authenticated full access waste_types" ON waste_types;
DROP POLICY IF EXISTS "Authenticated full access collection_schedule" ON collection_schedule;
DROP POLICY IF EXISTS "Authenticated full access riciclabolario" ON riciclabolario;
DROP POLICY IF EXISTS "Authenticated full access announcements" ON announcements;

CREATE POLICY "Admins write waste_types"
  ON waste_types FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins write collection_schedule"
  ON collection_schedule FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins write riciclabolario"
  ON riciclabolario FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins write announcements"
  ON announcements FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

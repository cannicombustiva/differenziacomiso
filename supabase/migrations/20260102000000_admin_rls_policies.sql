-- Allow authenticated users full write access (admin operations)
CREATE POLICY "Authenticated full access waste_types"
  ON waste_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access collection_schedule"
  ON collection_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access riciclabolario"
  ON riciclabolario FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access announcements"
  ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access push_subscriptions"
  ON push_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);

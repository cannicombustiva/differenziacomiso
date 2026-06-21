-- ADR 0003: push_subscriptions holds push credentials (endpoint, keys_p256dh,
-- keys_auth) and is reached ONLY through service-role server routes
-- (/api/push/*, the daily cron). It must carry no permissive RLS policies.
--
-- The prior policies exposed it: "Service role manage subscriptions" was
-- FOR ALL USING (true) with no TO clause, defaulting to `public` — granting
-- anonymous SELECT/UPDATE/DELETE over every subscriber's credentials.
--
-- Drop all three. RLS stays enabled (deny-by-default for anon and
-- authenticated); the service role bypasses RLS, so the server routes and
-- cron are unaffected.
DROP POLICY IF EXISTS "Anyone can subscribe" ON push_subscriptions;
DROP POLICY IF EXISTS "Service role manage subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Authenticated full access push_subscriptions" ON push_subscriptions;

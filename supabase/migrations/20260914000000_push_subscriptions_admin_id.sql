-- #79: tell Admin devices apart from Citizen devices, so the daily cron can
-- push the Coverage-expiry warning to Admins only.
--
-- A Subscription is still a device, not a person (CONTEXT.md): one Admin with
-- two devices is two rows, each carrying the same admin_id. Existing rows stay
-- NULL — Citizen devices. Set only by /api/push/subscribe-admin behind
-- requireAdmin(); the Citizen subscribe route never writes it.
--
-- ADR 0003: push_subscriptions stays service-role-only. No RLS policy is added.
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_admin_id
  ON push_subscriptions(admin_id) WHERE admin_id IS NOT NULL;

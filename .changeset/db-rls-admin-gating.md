---
"differenzia-comiso": patch
---

Harden the database authorization layer (ADR 0003). Content-table writes (waste_types, collection_schedule, riciclabolario, announcements) are now gated on `admins`-table membership via a `SECURITY DEFINER` `is_admin()` helper, instead of mere authentication — so registering an account no longer grants write access. `push_subscriptions`, which holds push credentials and is reached only through service-role server routes, loses all permissive RLS policies (one previously defaulted to `public`, exposing every subscriber's credentials to anonymous read/delete); RLS stays enabled and only the service role can touch it.

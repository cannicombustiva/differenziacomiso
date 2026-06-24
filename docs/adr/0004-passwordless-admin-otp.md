# Admin login is passwordless email OTP, not email+password

Admin sign-in uses Supabase email **OTP codes** (`signInWithOtp` → `verifyOtp`), not `signInWithPassword`. The login page is a two-step flow on a single page: enter email → receive a 6-digit code → enter code. There is no magic link and therefore no `/auth/callback` route — the code is verified in the same browser tab, which avoids the magic-link failure mode where the link opens in a different browser or an in-app email webview and loses the session.

Codes are requested with `shouldCreateUser: false`, so Supabase only emails a code to an address that **already exists in `auth.users`**. This preserves the existing provisioning model: an admin must be pre-created. Onboarding is one command (`scripts/create-admin.cjs`) that creates the passwordless `auth.users` row (`email_confirm: true`, no password) **and** inserts the email into the `admins` table — both rows are required (one to receive a code, one to pass authorization).

This is purely an **authentication** change. The **authorization** boundary is unchanged: write access is still gated on `admins`-table membership in the RLS `is_admin()` helper, `middleware.ts`, and `requireAdmin()` (see [0003-db-layer-admin-authorization.md](./0003-db-layer-admin-authorization.md)). A non-admin who somehow obtained a valid session still bounces off `/admin`.

## Consequences

- **Email delivery is the login dependency.** The project has no custom domain (it lives at `differenziacomiso.vercel.app`), so SPF/DKIM cannot be added and no third-party SMTP (Resend/SendGrid free tiers included) can be verified as a sender. Login therefore uses Supabase's **default email sender**, which is rate-limited (~a few/hour project-wide) and dev-grade for deliverability. Acceptable given only a handful of admins who log in rarely; if delivery becomes a problem the fix is acquiring a domain and configuring SMTP.
- **The Supabase "Magic Link" email template must contain `{{ .Token }}`.** The default template only renders `{{ .ConfirmationURL }}`; without the token edit, no 6-digit code reaches the admin and the flow is unusable.
- **No password fallback.** If OTP email delivery fails for the only admin, recovery is via the Supabase dashboard / service role, not a password. Accepted deliberately to keep a single auth path and remove the brute-force surface.

# DifferenziaComiso

Mobile-first PWA for Comiso (Sicily) that tells citizens what waste must be put out **tomorrow**.

## Stack

- Next.js 14 (App Router)
- TypeScript (strict)
- CSS Modules
- Supabase (PostgreSQL + Auth)
- Web Push API
- **pnpm**

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase project (EU region recommended)

## Quick Start (pnpm)

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
CRON_SECRET=
```

> Keep secrets only in `.env.local` (local) and Vercel/Supabase dashboards (production). Never commit secrets.

## Common Commands

```bash
pnpm dev      # start dev server
pnpm build    # production build
pnpm start    # run production build
pnpm lint     # run linting
```

## Database Setup (recommended)

Use Supabase migrations + seed from the `supabase/` folder.

1. Link your Supabase project.
2. Apply migrations in `supabase/migrations/`.
3. Run `supabase/seed.sql`.

If you already have Supabase CLI configured, typical flow is:

```bash
supabase db push
supabase db reset --linked
```

(Use the command(s) that match your environment and workflow.)

## Push Notifications

- Configure VAPID keys in env vars.
- Daily notification endpoint: `src/app/api/cron/daily-notification/route.ts`
- Manual send endpoint: `src/app/api/push/send/route.ts`

## Project Structure

- App routes: `src/app/`
- Reusable UI/components: `src/components/`
- Hooks: `src/hooks/`
- Supabase clients/utilities: `src/lib/supabase/`
- i18n messages: `src/i18n/`
- Global styles: `src/styles/`
- SQL migrations/seed: `supabase/`

## Deployment (Vercel)

Set these env vars in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `CRON_SECRET`

Then deploy normally.

## Notes

- Package manager is pinned in `package.json` with `"packageManager": "pnpm@10.17.1"`.
- Lockfile is `pnpm-lock.yaml`.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, PR checklist, and local validation steps.

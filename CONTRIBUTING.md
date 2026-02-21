# Contributing

Thanks for contributing to DifferenziaComiso.

## Development Setup

- Use **Node.js 20+**
- Use **pnpm 10+**
- Install dependencies:

```bash
pnpm install
```

- Start development server:

```bash
pnpm dev
```

## Required Environment

Create `.env.local` with all required variables (see `README.md`).

## Branching Convention

Create short, descriptive branches:

- `feat/<short-feature-name>`
- `fix/<short-bug-name>`
- `chore/<short-task-name>`
- `docs/<short-docs-name>`

Examples:

- `feat/admin-notification-preview`
- `fix/tomorrow-date-timezone`
- `docs/readme-onboarding`

## Commit Convention

Prefer conventional-style messages:

- `feat: add calendar holiday override`
- `fix: handle missing english fallback`
- `docs: add pnpm setup notes`
- `chore: update dependencies`

## Before Opening a PR

Run these checks locally:

```bash
pnpm lint
pnpm build
```

If your change touches database behavior, also verify Supabase migrations/seed logic locally.

## Pull Request Checklist

- [ ] Scope is focused and minimal
- [ ] No secrets committed
- [ ] Works with `pnpm` only (no npm lockfile changes)
- [ ] Lint/build pass locally
- [ ] Updated docs when behavior/setup changed
- [ ] Added screenshots for visible UI changes (if applicable)

## Code Style Guidelines

- TypeScript strict mode
- Server Components by default; use Client Components only where needed
- CSS Modules for styling (`*.module.css`)
- Keep components small and reusable
- Preserve bilingual support (Italian default, English fallback)

## Database & Security Notes

- Do not commit API/service role secrets
- Prefer migrations under `supabase/migrations/`
- Keep RLS policies aligned with public-read/admin-write requirements

## Need Help?

Open a draft PR early with context and implementation notes if you want feedback before finalizing.

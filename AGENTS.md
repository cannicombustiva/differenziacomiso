# AGENTS.md — DifferenziaComiso

## Project Overview

**DifferenziaComiso** is a mobile-first Progressive Web App (PWA) for the citizens of **Comiso, Sicily**, that tells users which waste type will be collected door-to-door the next day. The app replaces the paper PDF calendar distributed by the municipality and the waste collection company (Busso Sebastiano S.r.l.).

The app is **bilingual**: Italian is the primary language, English is secondary. All UI labels, notifications, and content must support both languages.

---

## Tech Stack

| Layer           | Technology                        |
| --------------- | --------------------------------- |
| Framework       | **Next.js 14+** (App Router)      |
| Language        | **TypeScript** (strict mode)      |
| Styling         | **CSS Modules** (`.module.css`)   |
| Backend / DB    | **Supabase** (PostgreSQL + Auth)  |
| Push Notif.     | **Web Push API** + Supabase Edge Functions |
| Deployment      | **Vercel**                        |
| PWA             | `next-pwa` or `@serwist/next`     |

---

## Design Principles

- **Mobile-first** — the primary device is a smartphone. Desktop should work but is secondary.
- **Instant clarity** — when the user opens the app, they must know within 1 second what waste to put out tomorrow. Big, bold, color-coded.
- **Offline-capable** — the current week/month of collection data should be cached for offline use via a service worker.
- **Installable** — full PWA manifest with Comiso coat of arms as app icon, splash screen, `display: standalone`.
- **Accessible** — minimum AA contrast, large tap targets, screen reader labels in Italian.

---

## Color Coding for Waste Types

Each waste type has an associated color. Use these consistently across the entire app (cards, calendar dots, notification badges, admin panel):

| Waste Type (IT)     | Waste Type (EN)     | Color       | Hex suggestion |
| ------------------- | ------------------- | ----------- | -------------- |
| Secco Residuo       | Non-recyclable      | Grey        | `#8C8C8C`      |
| Umido               | Organic / Compost   | Brown       | `#8B5E3C`      |
| Carta e Cartone     | Paper & Cardboard   | Blue        | `#2B7BD5`      |
| Plastica            | Plastic             | Yellow      | `#F5C518`      |
| Vetro               | Glass               | Green       | `#2E8B57`      |
| Lattine             | Cans / Aluminum     | Light blue  | `#5BC0DE`      |
| Abiti Usati         | Used Clothing       | Pink/Purple | `#C77DBA`      |

These colors must be used as CSS custom properties (CSS variables) defined in a global theme file so they can be referenced everywhere.

---

## App Structure

### Public Area (no auth required)

#### 1. Home Page (`/`)

The **hero section** shows:

- The **Comiso coat of arms** (small, top area) and app name "DifferenziaComiso"
- A large, prominent card: **"Domani si raccoglie:" / "Tomorrow's collection:"**
  - Shows waste type name(s) in bold
  - Background or border of the card matches the waste color(s)
  - If multiple types are collected (e.g., Umido + Vetro on Monday), show each one with its color
  - If it's a **holiday exception** (no collection), show a clear message: "Domani non si effettua la raccolta" with an appropriate icon
- Below the hero: a **mini week strip** showing the next 7 days as small colored dots/chips so the user can quickly glance ahead
- A tap on any day in the week strip expands to show that day's detail

**Time logic:** The app always shows **tomorrow's collection** regardless of the time of day. The "reference day" = `today + 1`. This is because people typically prepare their waste after dinner.

#### 2. Calendar Page (`/calendario`)

- Full **monthly calendar view** — each day cell shows small colored dots or icons for the waste types collected that day
- Tap a day to see the full detail in a bottom sheet or modal
- Holiday exceptions are marked with a special indicator (e.g., asterisk or strikethrough)
- Navigation: swipe or arrows to change month
- The calendar data for the current year (2026) is pre-loaded from Supabase

#### 3. Riciclabolario Page (`/riciclabolario`)

- A **searchable waste dictionary**
- Search bar at the top: user types an item (e.g., "bottiglia", "pannolino", "cartone del latte")
- Results show: the item name, which bin it belongs to (with color), and optionally a short tip (e.g., "Sciacqua prima di gettare" / "Rinse before disposing")
- The admin manages this dictionary from the admin panel
- Data stored in a Supabase table: `riciclabolario`
- Should work offline with cached data

#### 4. News / Announcements Page (`/notizie`)

- A simple feed of announcements from the admin
- Each announcement has: title, body text, date, optional image
- Use cases: schedule changes, special collection events, reminders
- Sorted by date descending

#### 5. Info Page (`/info`)

- Contact info: Numero Verde 800-845858, website www.comisodifferenzia.it
- Links to Facebook page
- App version and credits
- Link to notification settings

### Admin Area (`/admin`) — Auth Required

Protected by **Supabase Auth** (email + password). Only admin users can access. Use Next.js middleware to protect all `/admin/*` routes.

#### Admin Dashboard (`/admin`)

- Overview: quick stats (e.g., total users subscribed to notifications, next holiday exception)
- Navigation to sub-sections

#### Admin Calendar Manager (`/admin/calendario`)

- Full **calendar interface** where the admin can:
  - View any month
  - Click on a day to assign which waste type(s) are collected
  - Multi-select waste types per day (checkboxes with colored labels)
  - Mark a day as **holiday / no collection** with optional note (e.g., "Festa della Repubblica")
  - Bulk operations: apply the "typical week" pattern (Settimana Tipo) to a range of dates, then manually override exceptions
- The "Settimana Tipo" (typical weekly pattern) from the PDF:
  - Lunedì: Umido, Vetro
  - Martedì: Plastica
  - Mercoledì: Umido, Lattine
  - Giovedì: alternating Secco / Abiti Usati (Secco on weeks 1,3; Abiti Usati on weeks 2,4 of the month)
  - Venerdì: Carta e Cartone
  - Sabato: Umido
  - Domenica: nessuna raccolta
- **Bulk fill feature:** "Fill from date X to date Y with Settimana Tipo" then edit individual exceptions

#### Admin Riciclabolario Manager (`/admin/riciclabolario`)

- CRUD interface for riciclabolario items
- Fields: item name (IT), item name (EN), waste category, tip text (IT), tip text (EN)
- Search + filter by category
- Bulk import option (CSV)

#### Admin News Manager (`/admin/notizie`)

- CRUD interface for announcements
- Fields: title (IT), title (EN), body (IT), body (EN), date, optional image upload (Supabase Storage)
- Publish / unpublish toggle

#### Admin Notification Manager (`/admin/notifiche`)

- View subscribed users count
- Send a manual push notification to all subscribers
- Configure the automatic evening notification time (default: 20:00)
- Preview the notification text

---

## Database Schema (Supabase / PostgreSQL)

```sql
-- Waste types (reference table, seeded)
CREATE TABLE waste_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_it TEXT NOT NULL,        -- e.g., 'Umido'
  name_en TEXT NOT NULL,        -- e.g., 'Organic'
  color_hex TEXT NOT NULL,      -- e.g., '#8B5E3C'
  icon TEXT,                    -- optional icon identifier
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily collection schedule
CREATE TABLE collection_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  waste_type_id UUID REFERENCES waste_types(id) ON DELETE CASCADE,
  is_holiday BOOLEAN DEFAULT false,
  holiday_note_it TEXT,         -- e.g., 'Festa della Repubblica'
  holiday_note_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, waste_type_id)
);

-- Riciclabolario (waste dictionary)
CREATE TABLE riciclabolario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name_it TEXT NOT NULL,
  item_name_en TEXT,
  waste_type_id UUID REFERENCES waste_types(id),
  tip_it TEXT,                  -- e.g., 'Sciacqua prima di gettare'
  tip_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- News / Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_it TEXT NOT NULL,
  title_en TEXT,
  body_it TEXT NOT NULL,
  body_en TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Push notification subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_schedule_date ON collection_schedule(date);
CREATE INDEX idx_riciclabolario_search ON riciclabolario USING gin(to_tsvector('italian', item_name_it));
```

---

## Push Notifications

- Use the **Web Push API** with VAPID keys
- Store subscriptions in the `push_subscriptions` table
- A **Supabase Edge Function** (or Vercel Cron Job) runs every day at **20:00 CET** (Europe/Rome timezone):
  1. Queries tomorrow's collection schedule
  2. Formats a message: "Domani si raccoglie: Umido, Vetro" (or "Domani non si effettua la raccolta")
  3. Sends push notification to all subscribers
- The notification should include the waste color as a badge if possible
- Admin can also trigger a manual notification from the admin panel

---

## PWA Configuration

- **App name:** DifferenziaComiso
- **Short name:** Differenzia
- **Theme color:** `#2E7D32` (green, matching the municipality's branding)
- **Background color:** `#FFFFFF`
- **Display:** `standalone`
- **Orientation:** `portrait`
- **Icons:** Generate from Comiso coat of arms (sizes: 72, 96, 128, 144, 152, 192, 384, 512)
- **Service worker:** Cache the collection schedule for the current month + next month, riciclabolario data, and all static assets
- **Offline fallback:** Show cached schedule data when offline, with a subtle banner "Sei offline — dati aggiornati al [date]"

---

## Internationalization (i18n)

- Use **next-intl** or a lightweight custom solution with JSON translation files
- Default locale: `it` (Italian)
- Secondary locale: `en` (English)
- Language switcher in the app header/settings
- URL structure: `/it/calendario`, `/en/calendario` (or cookie-based, your choice — but keep it simple)
- All dynamic content (announcements, riciclabolario) has both `_it` and `_en` fields in the database
- If English translation is missing, fall back to Italian

---

## File & Folder Structure

```
differenzia-comiso/
├── public/
│   ├── icons/                  # PWA icons (Comiso coat of arms)
│   ├── manifest.json
│   └── sw.js                   # Service worker (if not auto-generated)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with PWA meta, global styles
│   │   ├── page.tsx            # Home — tomorrow's collection
│   │   ├── calendario/
│   │   │   └── page.tsx        # Calendar page
│   │   ├── riciclabolario/
│   │   │   └── page.tsx        # Waste dictionary
│   │   ├── notizie/
│   │   │   └── page.tsx        # News feed
│   │   ├── info/
│   │   │   └── page.tsx        # Contact & info
│   │   └── admin/
│   │       ├── layout.tsx      # Admin layout with auth guard
│   │       ├── page.tsx        # Admin dashboard
│   │       ├── calendario/
│   │       │   └── page.tsx    # Calendar manager
│   │       ├── riciclabolario/
│   │       │   └── page.tsx    # Dictionary manager
│   │       ├── notizie/
│   │       │   └── page.tsx    # News manager
│   │       └── notifiche/
│   │           └── page.tsx    # Notification manager
│   ├── components/
│   │   ├── ui/                 # Reusable UI (Button, Card, Modal, etc.)
│   │   ├── WasteCard/          # Colored waste type card
│   │   ├── WeekStrip/          # Horizontal 7-day preview
│   │   ├── CalendarGrid/       # Monthly calendar component
│   │   ├── SearchBar/          # Riciclabolario search
│   │   ├── LanguageSwitcher/   # IT/EN toggle
│   │   └── Navbar/             # Bottom navigation bar (mobile)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Supabase browser client
│   │   │   ├── server.ts       # Supabase server client
│   │   │   └── admin.ts        # Supabase admin/service role client
│   │   ├── push.ts             # Push notification utilities
│   │   └── utils.ts            # Date helpers, color utils
│   ├── hooks/
│   │   ├── useCollection.ts    # Fetch collection for a date
│   │   ├── useLocale.ts        # Current language
│   │   └── usePushSubscription.ts
│   ├── i18n/
│   │   ├── it.json
│   │   └── en.json
│   ├── styles/
│   │   ├── globals.css         # CSS variables (colors, fonts)
│   │   └── theme.css           # Waste type color tokens
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── supabase/
│   ├── migrations/             # SQL migration files
│   ├── seed.sql                # Seed waste_types + 2026 schedule
│   └── functions/
│       └── send-notification/  # Edge function for daily push
├── .env.local                  # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, VAPID keys
├── next.config.js
├── tsconfig.json
├── package.json
└── AGENTS.md                   # This file
```

---

## Seed Data

The 2026 collection schedule must be seeded into the database from the PDF calendar. Here is the **Settimana Tipo** (typical week pattern):

| Day         | Waste Type(s)                                        |
| ----------- | ---------------------------------------------------- |
| Lunedì      | Umido, Vetro                                         |
| Martedì     | Plastica                                             |
| Mercoledì   | Umido, Lattine                                       |
| Giovedì     | Secco Residuo (weeks 1, 3) / Abiti Usati (weeks 2, 4) |
| Venerdì     | Carta e Cartone                                      |
| Sabato      | Umido                                                |
| Domenica    | Nessuna raccolta                                     |

**Holiday exceptions for 2026** (no collection unless noted):

- 1 Gennaio (Giovedì) — no collection
- 6 Gennaio — Plastica collection moved to 7 Gennaio; 7 Gennaio no Lattine collection
- 6 Aprile — no collection (Pasquetta)
- 25 Aprile — no collection
- 1 Maggio — Carta/Cartone moved to 2 Maggio
- 2 Giugno — Plastica moved to 3 Giugno; 3 Giugno no Lattine
- 13 Luglio — no collection
- 15 Agosto — no collection
- 8 Dicembre — Plastica moved to 9 Dicembre; 9 Dicembre no Lattine
- 25 Dicembre — no collection
- 26 Dicembre — no collection

A seed script should generate all 365 days of 2026 using the weekly pattern, then apply the holiday overrides.

---

## UI / UX Guidelines

- **Bottom navigation bar** (mobile): Home, Calendario, Riciclabolario, Notizie, Info (5 tabs with icons)
- **Animations:** Subtle fade/slide transitions between pages. Waste cards can have a soft entrance animation.
- **Typography:** Clean sans-serif. Suggest `Inter` or `DM Sans` via Google Fonts.
- **Border radius:** Rounded corners (8–12px) for cards and buttons — friendly feel.
- **Empty states:** Friendly illustrations or messages when no data (e.g., "Nessuna notizia" with a small icon).
- **Dark mode:** Optional but nice-to-have. Respect `prefers-color-scheme`.
- **Toast notifications:** For admin actions (save, delete, publish).
- On desktop the layout should be centered with a max-width (e.g., 480px) to simulate a phone-like experience.

---

## Development Guidelines

- Use **Server Components** by default; use `"use client"` only when interactivity is needed.
- Use **Route Handlers** (`app/api/`) for any server-side logic that can't be done in Server Components.
- Keep CSS Modules co-located with their component (e.g., `WasteCard/WasteCard.module.css`).
- Name CSS classes in camelCase inside modules.
- Use Supabase **Row Level Security (RLS)**: public read for schedule/riciclabolario/announcements, admin-only write.
- Keep environment variables in `.env.local` — never commit secrets.
- Write semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`).
- All images should use `next/image` with proper `alt` text.
- Date handling: use `date-fns` with Italian locale, or native `Intl.DateTimeFormat`.

---

## Deployment Notes

- Deploy on **Vercel** connected to the GitHub repo.
- Set environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
- Supabase project should be in **EU (Frankfurt or similar)** for GDPR and latency.
- Set up a **Vercel Cron Job** or **Supabase Edge Function** with pg_cron for the daily 20:00 push notification.

---

## Future Ideas (Out of Scope for MVP but good to keep in mind)

- Geofencing: detect if user is in Comiso and auto-suggest the app
- Multiple municipalities: make the app multi-tenant so other towns can use it
- Waste collection statistics dashboard for the municipality
- Report a missed collection feature
- Integration with the official Busso Differenzia app/website
- QR code on physical bins linking to the riciclabolario entry

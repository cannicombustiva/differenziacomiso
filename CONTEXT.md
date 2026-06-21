# DifferenziaComiso

The domain language for DifferenziaComiso — a PWA that tells citizens of Comiso which waste type is collected door-to-door the next day. This file is a glossary, not a spec.

## Language

### Waste

**Waste type** (IT: _Tipo di rifiuto_):
A collection stream with a name (IT/EN) and its own colour. Data-driven: the authoritative set lives in the `waste_types` table (each row carries `color_hex`), so a new stream is one row, no deploy. Currently a **closed set of 7**: Secco Residuo, Umido, Carta e Cartone, Plastica, Vetro, Lattine, Abiti Usati. A Pickup and a Riciclabolario entry each reference exactly one Waste type.
_Note_: `demo-data`'s `WT` map, the seed UUIDs, and the Settimana Tipo formulas hardcode these 7 — they must be updated if a stream is added.

**Secco Residuo** (EN: _Non-recyclable_; syn. _Indifferenziato_):
The grey-bin general waste stream. Canonical name follows the Busso PDF; citizens commonly say "Indifferenziato".

**Lattine** (EN: _Cans & metal_):
All metal / aluminium packaging — drink cans, tins (_scatoletta di tonno_), foil — not only beverage cans. Light-blue stream.
_Avoid_: narrowing to "cans".

### Collection schedule

**Collection**:
The bundle of waste types picked up on a single date — the citizen-facing unit ("Domani si raccoglie: Umido, Vetro"). A Collection contains one or more Pickups.
_Avoid_: using bare "collection" for a single waste-type row.

**Pickup** (IT: _Ritiro_):
One waste type scheduled on one date — a single row in `collection_schedule`. Monday's Collection holds two Pickups: Umido and Vetro.
_Avoid_: "collection" for the single row.

**Schedule**:
The full set of Collections across the year. Backed by the `collection_schedule` table.

**Reference day** (IT: _Giorno di riferimento_):
The day whose Collection is shown by default — always `today + 1`, in **Europe/Rome** time. Independent of time of day. What both the home page and the evening notification mean by "Domani".
_Avoid_: "today's collection" — the app never shows today by default.

### People

**Citizen** (IT: _Cittadino_):
An anonymous user of the public app. No account, no stored identity. The audience for the home page, calendar, Riciclabolario, and notifications.
_Avoid_: "user" when you mean a Citizen specifically; "user" is ambiguous between Citizen and Admin.

**Admin**:
An authenticated operator who edits the Schedule, Riciclabolario, News, and Notifications. Backed by the `admins` table + Supabase Auth.
_Avoid_: "user", "editor".

**Subscription** (IT: _Iscrizione_):
A single device/browser endpoint opted into push notifications — one row in `push_subscriptions`. **Not** a person: one Citizen with two devices is two Subscriptions. The admin metric is a count of Subscriptions ("dispositivi iscritti"), never "utenti".
_Avoid_: "subscriber"/"utente" as a person-count.

### Pattern and exceptions

**Settimana Tipo** (EN: _Typical week_):
The default weekly Pickup pattern from the Busso PDF, used to generate the Schedule. Mon: Umido+Vetro · Tue: Plastica · Wed: Umido+Lattine · **Thu: Secco (week-of-month 1,3) / Abiti Usati (2,4) / nothing (5th Thursday)** · Fri: Carta e Cartone · Sat: Umido · Sun: none. Week-of-month is `ceil(day/7)`, reset each month — **not** a fortnightly cadence.
_Avoid_: "default schedule", treating the Thursday rule as ISO-week parity.

**Exception** (IT: _Eccezione_):
Any admin override of the Settimana Tipo for a specific date — a Holiday, a Recupero, or a one-off like 30 Apr 2026 → Secco. Entered by hand, never derived from the pattern.

### Content and messaging

**Riciclabolario**:
The searchable waste dictionary (coined from _riciclo_ + _vocabolario_). A **Riciclabolario entry** maps one item (e.g. "Bottiglia di plastica") to a single waste type, with an optional disposal tip. Citizen-facing search answers "which bin does X go in?".
_Avoid_: "dictionary", "glossary" (this file is the glossary).

**Announcement** (UI label: _Notizia_):
A persisted news item in the feed — title + body in IT/EN, publish/unpublish. Backed by the `announcements` table. The `/notizie` page lists published Announcements.
_Avoid_: "news post" vs "notizia" drift; "notification".

**Notification**:
A **push** message sent to subscribed devices — the evening (20:00 Europe/Rome) "Domani si raccoglie…" tied to the Reference day, or an Admin manual blast. Ephemeral; not stored as content.
_Avoid_: conflating with Announcement. Publishing an Announcement does **not** fire a Notification — they are strictly independent channels.

### Holidays and moves

**Holiday** (IT: _Festività_):
A date with zero Pickups because of a public or local feast (Capodanno, Ferragosto, Festa patronale…). Stored as `is_holiday=true` with no waste type and a `holiday_note`. Citizen-facing message: "Domani non si effettua la raccolta".
_Avoid_: "closure", "day off".

**Recupero** (EN: _Recovered pickup_):
A Pickup added to a later, normally-operating date to make up for one lost to a Holiday — e.g. Plastica from the 6 Jan Holiday recovered on Wed 7 Jan. Citizen-facing. Carries an explanatory note ("Recupero del 6/1").
_Avoid_: "moved collection", "rescheduled".

**Suppressed pickup**:
A normal Pickup cancelled outright to make room for a Recupero, and **not** recovered anywhere — e.g. Lattine dropped from 7 Jan so Plastica can take its place. **Admin-internal**: invisible to citizens (they only see what _is_ collected; nothing records what was removed).
_Avoid_: surfacing this to citizens.

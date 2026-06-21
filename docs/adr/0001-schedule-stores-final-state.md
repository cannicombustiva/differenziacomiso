# Schedule stores final state per day, not relational moves

The `collection_schedule` table stores the **final** set of Pickups for each date — what is actually collected — and nothing about how it got there. Holidays, Recuperi, and Suppressed pickups (see [CONTEXT.md](../../CONTEXT.md)) are authored by the admin as plain edits to a date's rows; there is no foreign key linking a Recupero back to the Holiday it makes up for, and a Suppressed pickup leaves no trace.

We chose this because the Schedule is a static yearly calendar entered once from the Busso PDF, where nothing recomputes from the relationships. The municipality's holiday rules are irregular (a Pickup is sometimes sacrificed rather than moved), so relational "move" logic would fight the real calendar rather than encode it. Modeling moves as links would also tempt future auto-shifting that the real rules don't follow.

The trade-off: a Recupero day is indistinguishable from an ordinary day in the data. To keep the citizen-facing "why" without relational links, each Pickup row carries an optional `note_it` / `note_en` (e.g. "Recupero del 6/1"), surfaced on the home card and calendar. Holiday rows keep their existing `holiday_note_*`.

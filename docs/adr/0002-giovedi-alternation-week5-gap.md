# Giovedì alternation is week-of-month, with a deliberate 5th-Thursday gap

The Thursday Pickup in the Settimana Tipo (see [CONTEXT.md](../../CONTEXT.md)) is **Secco Residuo** on the 1st and 3rd Thursday of a month, **Abiti Usati** on the 2nd and 4th, and **no Giovedì Pickup at all** on a 5th Thursday. Week-of-month is `ceil(day/7)` and resets each calendar month — this is **not** a fortnightly/ISO-week cadence.

This matches the Busso paper calendar. Verified against 2026's five 5th-Thursdays: Jan 29, Jul 30, Oct 29, Dec 31 have no Giovedì collection; 30 Apr 2026 is Secco and is recorded as a one-off Exception, not derived from the rule.

The obvious-looking formulas are all wrong here and must not be "fixed" back: `week % 2 === 1` (admin bulk-fill, demo-data) puts Secco on the 5th Thursday, `week_of_month IN (1,3)`/ELSE (seed) puts Abiti on it, and an ISO-week-parity rule matches only 1 of the 5 real dates. Any rule that assigns every Thursday a type structurally cannot reproduce the empty 5th Thursdays. Seed, admin bulk-fill, and demo-data must all implement the week-5 gap; the unused `getWeekOfMonth` / `getWeekNumber` helpers (a fourth, different formula) should be deleted.

---
"differenzia-comiso": minor
---

Settimana Tipo now lives in one pure rule (`src/lib/settimana-tipo`): a date maps to its waste-type keys with the 5th Thursday correctly empty, so a citizen is no longer shown a Giovedì collection that never comes. The admin bulk-fill and the demo data both derive from this single rule and can no longer disagree; the unused, wrong week-of-month helpers were removed.

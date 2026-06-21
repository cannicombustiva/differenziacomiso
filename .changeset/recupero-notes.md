---
"differenzia-comiso": minor
---

A Recupero Pickup now carries a short note ("Recupero del 6/1") shown on the home card and the calendar day detail, so an unusual collection day no longer looks like a mistake. The home, week strip, and calendar all read from a single grouping transform (`src/lib/group-collections`) that carries Pickup notes and the holiday note with IT→EN fallback; the three previous parallel grouping copies are gone. Adds nullable `note_it` / `note_en` to `collection_schedule`.

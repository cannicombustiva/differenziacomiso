---
"differenzia-comiso": minor
---

Offline is now deliberate. The Citizen read-path hooks (reference-day, week, month Schedule and the full Riciclabolario) cache each successful online fetch in localStorage and fall back to that cache when the network is unavailable, so the home card and lists no longer go blank offline. A single "last refreshed" timestamp is stamped on every successful fetch, and a subtle banner — "Sei offline — dati aggiornati al [date]" — appears while offline as the staleness disclaimer. No full-year precache and no IndexedDB; the cache accepts stale risk by design.

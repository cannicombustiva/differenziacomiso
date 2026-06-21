---
"differenzia-comiso": minor
---

The 2026 Schedule seed is now generated from the single Settimana Tipo rule (`pnpm seed:generate`) instead of hand-written pattern SQL, so the database and the app can no longer disagree. The regenerated seed has empty 5th Thursdays (29 Jan, 30 Jul, 29 Oct, 31 Dec — previously a phantom Abiti Usati collection), the documented 30 Apr 2026 → Secco Residuo exception, and Recupero notes ("Recupero del 6/1", etc.) on the four holiday-move pickups.

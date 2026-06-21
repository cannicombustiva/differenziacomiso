---
"differenzia-comiso": minor
---

Riciclabolario search is now accent- and case-insensitive and covers disposal tips, not just item names — so "caffe" finds "Fondi di caffè" and searching a tip word ("sciacqua") finds the item. The match runs over both the Italian and English text and stays fully client-side, so it keeps working offline. The unused `idx_riciclabolario_search` GIN index, which implied a server-side search that never existed, is dropped.

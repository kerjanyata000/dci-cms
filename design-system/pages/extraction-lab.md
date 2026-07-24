# Page override: Extraction Lab

Extends [`MASTER.md`](../MASTER.md).

## Access

- **Legal / IT only** — via **profile menu** (bukan sidebar nav production)
- Badge **INTERNAL ONLY** di page head — warna merah, monospace

## Layout

- Crumb **Internal** + title + badge
- Notice: peringatan bukan halaman production
- **File upload zone** — dashed border, styled (bukan native `<input type="file">` mentah)
- Hasil ekstraksi: **info-grid cards** + validation `status-pill` — bukan JSON `<pre>` mentah
- RAGFlow retrieve: filter chips scope + `search-content-hit` cards

## Visual distinct

- Watermark/badge internal agar tidak bercampur dengan Smart Search production
- Mode RAGFlow ditampilkan di log area

## RBAC

- `role === 'legal' | 'it'` only (middleware + profile menu)

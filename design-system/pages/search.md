# Page override: Smart Search

Extends [`MASTER.md`](../MASTER.md).

## Layout

- Crumb **Registry** + title serif + ref FR-CNT-SV-003 / BRL-CMS-003
- **Search form** card: main input + Cari CTA, scope filter chips, optional status/docType filters
- **Empty state** when `q` kosong — contoh query chips (bukan blank screen)
- **Skeleton** saat pencarian berjalan (>300ms)
- Result sections: Parties / Kontrak / Isi Dokumen dalam `card stack`

## Deep linking

Query URL wajib sync:

| Param | Values |
|-------|--------|
| `q` | kata kunci |
| `scope` | `all`, `parties`, `contracts`, `content` |
| `status` | draft, under_review, active, terminated |
| `docType` | MSA, PO, Amendment, … |

Global search topbar → `/search?q=`; halaman search mempertahankan scope/filter di URL.

## Status visuals

- Kontrak: **`.status-pill`** (BRD §9) — bukan `.pill` generik
- RAGFlow mode indicator di footer form (`LIVE` / `DUMMY`)

## RBAC

- View-only role: banner muted di form; hasil read-only (no create/edit CTA)

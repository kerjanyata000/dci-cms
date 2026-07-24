# Page override: Renewal & Expiry Calendar

Extends [`MASTER.md`](../MASTER.md). Mockup: `CMS_Mockup.html` §view-renewal.

## Layout

- Crumb **Registry** + title serif + ref FR-DASH-004 / BRL-CMS-023
- **Notice** brass (metodologi estimasi tanggal) dengan ikon info SVG
- **Summary strip:** 4 chip — Urgent / Segera / Terjadwal / Di bulan ini (top border semantic)
- **Cal layout:** grid kalender + side panel agenda tanggal terpilih
- **Filter chips** + **data table** + paginasi (10/hal)

## Urgency buckets

| Bucket | Label | Threshold |
|--------|-------|-----------|
| `urgent` | Urgent | ≤30 hari |
| `soon` | Segera | 31–180 hari |
| `later` | Terjadwal | >180 hari |

Filter chip pakai **filter-dot** (bukan emoji). Pill & cal-evt warna konsisten bucket.

## Interaksi

- Klik sel kalender → side panel agenda (sticky, scroll terpisah)
- Month/year picker dropdown
- **Filter** di header panel "Daftar agenda" (bukan floating di antara kalender & tabel)
- Link **Party Detail** per baris agenda
- Empty state: hint agreement date + duration

## Shell

- Status integrasi Odoo/RAGFlow: badge dot di **sidebar footer** (hijau live, amber dummy, merah offline) — bukan teks plain di topbar

## RBAC

- Semua role yang lihat menu Renewal dapat view; tidak ada create CTA di halaman ini.

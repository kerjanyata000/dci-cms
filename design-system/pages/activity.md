# Page override: Activity Log

Extends [`MASTER.md`](../MASTER.md).

## Layout

- Crumb **Registry** + title Activity Log + ref BRL-CMS-025
- Filter tipe aksi (ghost buttons): Semua, Create, Amendment, SO Sync, Sync Error, CP Change, Termination, Odoo Link
- Tabel audit + paginasi (15/hal) + Export CSV

## Data & UX

- Kolom Party: tampilkan **`party_code`** (link ke Party Detail) — bukan teks "Detail" generik
- Loading: **TableSkeleton** — pisahkan dari empty state filter
- Empty: "Belum ada entri audit" vs "Tidak ada entri untuk filter ini"
- Cap 80 entri terbaru (prototype); CSV include `party_code`

## Posisi nav

- Secondary path: sidebar footer link atau profile menu (guideline §8) — bukan core daily nav

## RBAC

- Role dengan `views.audit` (Legal, IT, Management)

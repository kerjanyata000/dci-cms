# Page override: SO Health

Extends [`MASTER.md`](../MASTER.md).

## Layout

- Crumb **Registry** + title **SO Health**
- **KPI grid** 4 kolom: Synchronized / No Active SO / In Progress / Sync Errors — skeleton saat load
- Card stack: Refresh + Run Sync (role `canSync`), tabel SO mirror, paginasi

## Interaksi

- Baris tabel **clickable** → drill-down Party Detail (jika `party_id` ada)
- Kolom Party: link `party_code` mono
- **Amount**: format currency locale `id-ID` (IDR default)

## Sync

- Run Sync = consume-only pull dari Odoo (BR-CMS-020, INT-SO-004)
- Error banner max 5 baris + hint Activity Log filter `sync_error`

## RBAC

- Finance / IT: full access + Run Sync
- Role tanpa akses `/so`: redirect dashboard + banner forbidden (middleware)

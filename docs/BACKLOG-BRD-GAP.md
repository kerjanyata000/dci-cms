# Backlog — Gap BRD → Sprint

Prioritas dari gap coverage BRD (scope → notifikasi). E-sign commercial setup tetap **out of scope** (§4.2).

## Must (sprint ini)

| ID | Item | BRD | Status |
| --- | --- | --- | --- |
| M1 | Party Edit + Deactivate + field master (NPWP, address, type, contact) | FR-PTY-EDIT/DEL, §11.8, BRL-029/030 | Done |
| M2 | Status **Revision Required** di Review | FR-CNT-RVW-003, §9.1 | Done |
| M3 | Void supporting document (tanpa ubah lifecycle) | FR-CNT-SUP-005/006, BRL-016 | Done |
| M4 | Apply due dates: termination effective → Terminated; expiry → Expired | FR-CNT-TERM-008, §9.1 | Done |

## Should (berikutnya)

| ID | Item | BRD | Status |
| --- | --- | --- | --- |
| S1 | Event notifikasi lebih lengkap dari aksi kontrak (create, CP, term, upload) | NOTIF-CMS-001…013 | Done (mapping audit → kode NOTIF) |
| S2 | Amendment status Ready / Fully Signed sederhana | FR-CNT-AMD-005/007 | Done |
| S3 | Prompt SO sync setelah Fully Signed | FR-CNT-SO-001 (manual path) | Done |
| S4 | Auth Supabase default + seed role | FR-DASH-001 | Pending |

## Could (kemudian)

| ID | Item | BRD |
| --- | --- | --- |
| C1 | E-sign provider adapter (envelope/webhook) | INT-ESIGN — butuh keputusan provider |
| C2 | Email / Odoo activity delivery | INT-NOTIF |
| C3 | Batch scheduler SO + expiry cron | INT-SO-002 |
| C4 | Sync Odoo Documents → vault (keputusan produk) | di luar default BRD |

## Acceptance singkat (Must)

- Given Legal di Party Detail, When Edit Party, Then name/PIC/NPWP/address tersimpan + audit.
- Given Party Active, When Deactivate, Then status Inactive dan tidak bisa jadi target kontrak baru.
- Given kontrak Sent/Under Review, When Revision Required, Then status `revision_required`.
- Given supporting doc, When Void, Then doc bertanda void, lifecycle kontrak tidak berubah.
- Given termination scheduled dengan effective_date ≤ hari ini (atau expiry lewat), When Party dibuka, Then status kontrak ter-update.

## Acceptance singkat (Should S2)

- Given amendment Draft, When Ready for Signature → Mark Fully Signed, Then status `fully_signed` dan Current Summary parent ter-update tanpa overwrite dokumen asli.

## Acceptance singkat (Should S3)

- Given kontrak Ready/Sent + Party linked Odoo, When Mark Fully Signed (atau upload signed), Then prompt “Jalankan SO Sync?”; Yes → sync consume-only; No → bisa sync nanti dari tab SO.
- Given Fully Signed tanpa active SO, When Party Detail dibuka (role yang boleh sync), Then banner SO Sync recommended.

## Deploy note

Jalankan migrasi Supabase sebelum pakai field baru:

```sql
-- supabase/migrations/009_party_master_and_void.sql
```

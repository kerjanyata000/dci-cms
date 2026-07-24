# DCI Contract Management System (CMS) — Agent Instructions

Aplikasi **Contract Management System** berbasis **party-centric**, terintegrasi **Odoo** (Partner + Sales Order). Mockup & BRD ada di repo ini; implementasi produk harus mengikuti dokumen di bawah.

Untuk pekerjaan non-trivial (fitur, bug, UI baru, integrasi Odoo, skema data): baca **[`docs/AI_DEVELOPMENT_LIFECYCLE.md`](docs/AI_DEVELOPMENT_LIFECYCLE.md)** terlebih dahulu dan ikuti fase serta checklist di sana.

---

## Urutan baca wajib (sesuaikan jenis tugas)

1. **Domain / requirement** — [`docs/BRD-Contract-Management-System-v1.3.md`](docs/BRD-Contract-Management-System-v1.3.md) (sumber kebenaran bisnis). Status & BRL wajib dihormati (§9, §10).
2. **Alur operasional** — [`docs/PANDUAN-OPERASIONAL-CMS.md`](docs/PANDUAN-OPERASIONAL-CMS.md) (A→B→C: login, party, kontrak, review/sign, SO, audit).
3. **UI / mockup / desain** — [`DESIGN_GUIDELINES.md`](DESIGN_GUIDELINES.md), lalu [`CMS_Mockup.html`](CMS_Mockup.html) sebagai referensi interaksi & role UI.
4. **Integrasi Odoo** — [`docs/ODOO_INTEGRATION.md`](docs/ODOO_INTEGRATION.md) + BRD §12 (SO sync, Party–Partner link). CMS **tidak** write-back SO / Partner master kecuali disepakati terpisah.
5. **Siklus kerja AI** — [`docs/AI_DEVELOPMENT_LIFECYCLE.md`](docs/AI_DEVELOPMENT_LIFECYCLE.md).

---

## Prinsip domain (jangan dilanggar)

- **Party-centric**: Party Detail adalah konteks utama kontrak, amendment, novation/CP change, termination, supporting docs, SO, audit (BRL-CMS-026).
- **Legal-managed**: Change Counterparty, Amendment, Early Termination **tanpa** approval workflow internal (scope BRD).
- **RBAC**: role menentukan menu + dashboard + aksi. Tidak berhak lihat → **sembunyikan**; view-only → tampil tanpa create/edit (FR-DASH-003, BRL-CMS-001/002).
- **Odoo consume-only** untuk SO: sync/referensi saja; jangan create/amend/cancel SO atau posting accounting dari CMS (BR-CMS-020, INT-SO-004, Out of Scope §4.2).
- **Sensitive fields** (counterparty, NPWP, value, period, signed doc) tidak diubah lewat Edit Contract Details biasa — pakai aksi terkontrol (BRL-CMS-006).

---

## Artefak di repo

| Artefak | Fungsi |
| --- | --- |
| `CMS_Mockup.html` | Prototype UI interaktif (role, party, lifecycle) |
| `web/` | App **Next.js** (App Router) — bukan Vite |
| `docs/BRD-…v1.3.md` | Requirement resmi |
| `List MSA Customer (Updated).xlsx` | Data register sumber demo |
| `DESIGN_GUIDELINES.md` | Token & pola UI |
| `design-system/MASTER.md` | Design system (UI UX Pro Max + override ink/brass) |
| `docs/ODOO_INTEGRATION.md` | Batas & pola integrasi Odoo |

Instruksi agen hanya di root (`AGENTS.md` / `CLAUDE.md`). Jangan commit secrets (API key Odoo, password e-sign, `.env.local`).

**UI UX Pro Max (opsional):** skill Cursor di `.cursor/skills/` — install `npm i -g ui-ux-pro-max-cli && uipro init --ai cursor`. Wajib hormati `DESIGN_GUIDELINES.md` + `design-system/MASTER.md` (jangan ganti tema ke Tailwind/generik).

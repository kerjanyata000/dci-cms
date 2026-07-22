# Checklist: Trial Odoo + Persiapan AI (RAGFlow)

Persiapan paralel: **Odoo = Partner + SO saja**. Ekstraksi metadata, embedding, smart search = **CMS + Supabase + RAGFlow**.

---

## A. Apps Odoo trial (minimal)

- [ ] Pasang **Sales** (model `sale.order`)
- [ ] Pastikan **Contacts** tersedia (model `res.partner`)
- [ ] Jangan pasang Approvals / Knowledge / Website / dll. untuk trial CMS
- [ ] Cek apakah External API diizinkan (plan Online Free/Standard sering **blok** API — lihat `ODOO_INTEGRATION.md` §10.2)

Kalau API diblok: pakai Odoo Community lokal/Docker, atau lanjut develop dengan adapter **DUMMY** dulu.

---

## B. Data dummy Partner (`res.partner`)

Buat minimal **6 partner** (align seed mockup):

| Name (contoh) | NPWP / VAT | Ref / code | is_company | Catatan uji |
| --- | --- | --- | --- | --- |
| PT Alpha Data Center | 10.20.30.40.50.6000 | CUST-001 | ✓ | Exact match → Linked |
| PT Beta Nusantara | 11.22.33.44.55.6600 | CUST-006 | ✓ | Exact match |
| CV Gamma Solusi | *(kosong)* | CUST-023 | ✓ | Pending / incomplete |
| PT Delta Cloud | 99.88.77.66.55.4400 | CUST-079 | ✓ | Match by VAT |
| PT Epsilon Mistmatch | 12.12.12.12.12.1200 | CUST-098 | ✓ | Sengaja beda alamat → Mismatch |
| Acme Personal | — | — | ✗ | Individual (bukan company) |

Checklist per partner:

- [ ] `name`, `is_company`, `vat` (NPWP), `ref`, `email`, `street` / `city` terisi sesuai skenario
- [ ] Catat **Partner ID** Odoo (angka) — nanti disimpan di Supabase sebagai `odoo_partner_id`
- [ ] Satu kasus **nama mirip / multiple match** (opsional): dua partner nama hampir sama

---

## C. Data dummy Sales Order (`sale.order`)

Buat SO yang tertaut ke partner di atas:

| SO name / number | Partner | state | Catatan uji |
| --- | --- | --- | --- |
| SO001 | PT Alpha… | `sale` | Synchronized |
| SO002 | PT Alpha… | `sale` | Multi-SO satu party |
| SO006 | PT Beta… | `sale` | Linked OK |
| SO023 | CV Gamma… | `draft` | Bukan active → No Active SO path |
| SO098 | PT Epsilon… | `cancel` | Error / tidak dipakai sync aktif |

Checklist:

- [ ] Minimal 1 partner **dengan** SO `sale` / `done`
- [ ] Minimal 1 partner **tanpa** SO aktif → flag **No Active SO / Renewal Not Found**
- [ ] Catat mapping: `odoo_partner_id` → `party_id` CMS (contoh mockup: 101→PTY-00001)

---

## D. Persiapan AI (bukan dari OCR invoice Odoo)

Odoo **Document Digitization / Extract IAP** cocok untuk **invoice / expense / resume**, **bukan** MSA/kontrak legal + field BRD. Jangan andalkan itu sebagai mesin ekstraksi kontrak CMS.

### D1. Supabase (data CMS)

- [ ] Project Supabase + Storage bucket `contracts`
- [ ] Tabel inti: `parties`, `contracts`, `documents`
- [ ] Dual metadata: `extracted_metadata` (jsonb) vs `confirmed_metadata` (jsonb)
- [ ] `validation_status`: `pending` | `ok` | `mismatch` | `low_confidence`
- [ ] Kolom RAGFlow: `ragflow_dataset_id`, `ragflow_doc_id`
- [ ] `audit_logs`, auth (Supabase Auth)

### D2. RAGFlow

- [ ] Instance RAGFlow (Docker/lokal/cloud) + API key
- [ ] Dataset `cms-contracts` (dev)
- [ ] Pipeline: parse → chunk → embed
- [ ] Kontrak field mapping (JSON) selaras form Add Contract
- [ ] POC: 10–20 PDF kontrak DCI (anonymized jika perlu)

### D3. CMS (React)

- [ ] Upload → Supabase Storage → status `pending_extraction`
- [ ] Adapter `RagflowClient` (dummy → live), pola sama `OdooClient`
- [ ] UI Add Contract: prefill extracted → user **wajib confirm**
- [ ] Rule validasi ke Party / Odoo Partner (tanpa AI)
- [ ] Smart search: filter metadata (Supabase) + retrieve (RAGFlow) + RBAC

### D4. Odoo tetap hanya

- [ ] `res.partner` inquiry (link/compare)
- [ ] `sale.order` sync (consume-only)
- [ ] **Jangan** andalkan Document Digitization Odoo (invoice IAP) untuk MSA/kontrak legal

---

## Urutan kerja yang disarankan

```text
1. Skema Supabase (dual metadata + validation_status + ragflow ids)
2. Upload file → Storage + row documents
3. RagflowClient dummy (return JSON field BRD)
4. UI review/confirm + rule validasi Party
5. Odoo trial: Sales + Contacts + data checklist Partner/SO
6. POC RAGFlow 10–20 PDF → mapping field
7. Smart search: metadata dulu, lalu RAG retrieval
8. Baru Odoo live API (jika plan mengizinkan)
```

## Pembagian tanggung jawab

| Lapisan | Siapa | Apa |
| --- | --- | --- |
| Odoo | Trial/Sales+Contacts | Master **Partner + SO** saja |
| Supabase | Tim CMS | Party, kontrak, dual metadata, audit, file |
| RAGFlow | Tim CMS | Parse, chunk, embed, retrieve |
| React CMS | Tim CMS | Upload, review ekstraksi, confirm, search UI |
| Odoo Extract IAP | — | **Jangan** andalkan untuk MSA/kontrak legal |

---

## Checklist singkat “siap mulai”

### Odoo trial

- [ ] App **Sales** (+ Contacts)
- [ ] 6 Partner skenario (Linked / Pending / Mismatch) — lihat checklist lengkap di bawah bila perlu seed
- [ ] Beberapa SO `sale` + 1 partner tanpa SO aktif
- [ ] Catat `partner_id` untuk mapping CMS

### Supabase

- [ ] `parties`, `contracts`, `documents`
- [ ] `extracted_metadata` / `confirmed_metadata` (jsonb)
- [ ] `validation_status`
- [ ] `ragflow_dataset_id`, `ragflow_doc_id`
- [ ] Storage bucket `contracts`

### RAGFlow

- [ ] Instance + API key
- [ ] Dataset `cms-contracts`
- [ ] 10–20 PDF sampel (POC)
- [ ] Adapter dummy di app (sama pola Odoo)

### Keputusan produk (tulis singkat)

- [ ] Upload dokumen kontrak = **CMS (Supabase)**, bukan vault Odoo Documents
- [ ] Odoo = **Partner + SO consume-only**
- [ ] Engine ekstraksi/RAG = **RAGFlow**

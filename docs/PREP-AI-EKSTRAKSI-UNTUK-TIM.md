# Persiapan ekstraksi / validasi / smart search

## Jawaban singkat

| Bagian | Odoo punya? | Yang perlu kalian lakukan |
| --- | --- | --- |
| Partner + SO | Ya | Seed trial + adapter API |
| Ekstraksi metadata **kontrak/MSA** | **Tidak siap pakai** | **CMS + RAGFlow** (atau Extract API custom) |
| Validasi vs Party Master | Data Partner saja | **Rule di CMS/Supabase** |
| Smart search isi kontrak | Search Odoo biasa | **RAGFlow + index CMS** |

OCR AI bawaan Odoo (Document Digitization / Extract IAP) untuk **invoice, expense, resume** — field-nya bukan field BRD kontrak kalian.

## Arsitektur yang disiapkan

```text
CMS (Next.js) upload PDF
  → Supabase Storage + row documents
  → RAGFlow parse/chunk/embed/extract
  → extracted_metadata di Supabase
  → user confirm → confirmed_metadata
  → validate vs Party + Odoo Partner (API)
  → smart search = filter Supabase + retrieve RAGFlow
```

Odoo tetap: **`res.partner` + `sale.order` consume-only**.

## Apa yang dikerjakan “dari kita”

1. Skema dual metadata (sudah di `supabase/migrations/001_initial.sql`)
2. UI Add Contract: review hasil ekstraksi
3. `validateContractMetadata()` (sudah di `web/src/lib/validation`)
4. Adapter RAGFlow (dummy → live)
5. POC 10–20 PDF di RAGFlow
6. Route server Next.js / Edge Function untuk API key (jangan `NEXT_PUBLIC_`)

## Apa yang dari Odoo

1. App Sales + Contacts
2. Seed Partner/SO (`docs/CHECKLIST-ODOO-TRIAL-DAN-AI.md`)
3. Nanti live inquiry Partner untuk langkah validasi

## Urutan praktis minggu ini

1. Pastikan migration Supabase sudah dijalankan + bucket `contracts`
2. Tetap `NEXT_PUBLIC_RAGFLOW_MODE=dummy` sambil UI jalan
3. Install RAGFlow lokal → dataset `cms-contracts`
4. Mapping JSON ekstraksi → `ContractMetadata`
5. Baru ganti dummy → live di server

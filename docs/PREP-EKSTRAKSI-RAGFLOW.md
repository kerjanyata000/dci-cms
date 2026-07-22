# Extraction + validation + smart search (CMS)

## Who does what?

| Capability | Odoo? | Your stack |
| --- | --- | --- |
| Partner + SO master | **Yes** (`res.partner`, `sale.order`) | Adapter consume-only |
| Invoice OCR (IAP Digitization / Extract API) | Yes, but for **bills/expenses/resumes** | **Do not** use as MSA extractor |
| Contract metadata extraction | No turnkey for legal MSA | **RAGFlow** (or later custom) |
| Dual metadata + mismatch rules | No | **Supabase + CMS** |
| Chunk / embed / retrieve | No CMS vault | **RAGFlow** |
| Smart search UX + RBAC | Limited | **React CMS** |

```text
Upload PDF in CMS
  → Supabase Storage + documents row (pending_extraction)
  → RAGFlow parse / chunk / embed
  → extracted_metadata → Supabase
  → User confirms → confirmed_metadata
  → validateContractMetadata() vs Party + Odoo Partner
  → Smart search: SQL filters + RAGFlow retrieve
```

Odoo stays **Partner + SO only**. File vault = Supabase, not Odoo Documents.

## What you prepare (in order)

### 1. Data contracts (now)

- [ ] Field list for `ContractMetadata` (already in `web/src/types/cms.ts`)
- [ ] Dual columns: `extracted_metadata` / `confirmed_metadata`
- [ ] `validation_status`: pending | ok | mismatch | low_confidence
- [ ] `ragflow_dataset_id` / `ragflow_doc_id` on `documents`

### 2. Supabase

- [ ] Run `supabase/migrations/001_initial.sql`
- [ ] Create private Storage bucket `contracts`
- [ ] Auth users → `profiles.role`

### 3. RAGFlow

- [ ] Run RAGFlow (Docker)
- [ ] Create dataset `cms-contracts`
- [ ] API key in **Edge Function secrets** (not `VITE_*`)
- [ ] POC 10–20 sample PDFs; tune parse/chunk; map JSON → `ContractMetadata`

### 4. CMS app (`web/`)

- [ ] Upload UI → Storage + `documents`
- [ ] Call `getRagflowClient()` (dummy today)
- [ ] Review screen: extracted → edit → confirm
- [ ] Call `validateContractMetadata()` + optional `getOdooClient().searchPartners`
- [ ] Search page: metadata filter + `retrieve()`

### 5. Odoo (parallel, not for extraction)

- [ ] Trial apps: **Sales** + Contacts only
- [ ] Seed Partner/SO per `docs/CHECKLIST-ODOO-TRIAL-DAN-AI.md`
- [ ] Live Partner inquiry later via Edge Function

## Decision (write this down)

| Topic | Decision |
| --- | --- |
| Upload vault | **CMS / Supabase Storage** |
| Extraction engine | **RAGFlow** (dummy adapter until POC) |
| Odoo Document Digitization IAP | **Not** used for MSA (invoice-oriented) |
| Odoo role | Partner + SO **consume-only** |

## Prep this week (minimum)

1. Supabase project + run migration + bucket `contracts`
2. Keep coding against `VITE_RAGFLOW_MODE=dummy` / `VITE_ODOO_MODE=dummy`
3. Collect 10–20 anonymized MSA PDFs for RAGFlow POC
4. Seed Odoo trial Partner/SO (checklist file)
5. Spec field mapping: RAGFlow JSON → `ContractMetadata` keys

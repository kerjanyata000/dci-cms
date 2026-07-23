# DCI CMS — Next.js + React

App Router scaffold dengan adapter:

- Supabase (`src/lib/supabase.ts`)
- Odoo dummy/live (`src/lib/odoo/`)
- RAGFlow dummy/live (`src/lib/ragflow/`)
- Validasi metadata CMS (`src/lib/validation/metadata.ts`)
- Pipeline ekstraksi (`src/lib/pipeline/extraction.ts`)

## Run

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Extraction Lab: `/lab/extraction`.

## Env

Browser flags (`NEXT_PUBLIC_*_MODE`) + server secrets in `.env.local`:

| Variable | Scope | Fungsi |
| --- | --- | --- |
| `NEXT_PUBLIC_ODOO_MODE` | browser | `live` → panggil `/api/odoo/*` |
| `NEXT_PUBLIC_RAGFLOW_MODE` | browser | `live` → panggil `/api/ragflow/*` |
| `ODOO_URL`, `ODOO_DB`, … | server | Kredensial Odoo (tanpa `/odoo` di URL) |
| `RAGFLOW_URL`, `RAGFLOW_API_KEY`, `RAGFLOW_DATASET_ID` | server | RAGFlow cloud |

Health check: `GET /api/odoo/health`, `GET /api/ragflow/health` (saat dev server jalan).

**Catatan setup integrasi (Odoo + RAGFlow POC → live):** [`../docs/RUNBOOK-SETUP-ODOO-RAGFLOW.md`](../docs/RUNBOOK-SETUP-ODOO-RAGFLOW.md)

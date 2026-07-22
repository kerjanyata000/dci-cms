# DCI CMS — React app

Scaffold: **Vite + React + TypeScript** dengan adapter:

- Supabase (`src/lib/supabase.ts`)
- Odoo dummy/live (`src/lib/odoo/`)
- RAGFlow dummy/live (`src/lib/ragflow/`)
- Validasi metadata murni CMS (`src/lib/validation/metadata.ts`)
- Pipeline ekstraksi (`src/lib/pipeline/extraction.ts`)

## Run

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

Buka `/lab/extraction` untuk uji pipeline dummy (upload → extract → validate → retrieve).

## Env

Isi `VITE_SUPABASE_*` setelah project Supabase siap.  
`VITE_ODOO_MODE` / `VITE_RAGFLOW_MODE` default `dummy`. Mode `live` sengaja throw di browser — kredensial hanya di Edge Function secrets.

## Related docs

- `docs/CHECKLIST-ODOO-TRIAL-DAN-AI.md` — seed Partner/SO trial
- `docs/PREP-EKSTRAKSI-RAGFLOW.md` — siapa kerjakan apa + urutan kerja
- `supabase/migrations/001_initial.sql` — skema dual metadata

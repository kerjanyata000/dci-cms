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

Pakai `NEXT_PUBLIC_*` (bukan `VITE_*`).  
Mode `live` untuk Odoo/RAGFlow sengaja throw di browser — kredensial hanya di server.

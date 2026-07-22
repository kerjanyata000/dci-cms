# DCI — Contract Management System (CMS)

Party-centric **Contract Management System** untuk DCI, dirancang menyambung ke **Odoo** (Partner + Sales Order). Repo ini memuat BRD, panduan operasional, pedoman desain, dan mockup HTML interaktif sebagai landasan implementasi.

## Mulai di sini (untuk manusia & AI)

| Dokumen | Isi |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) / [`CLAUDE.md`](./CLAUDE.md) | Instruksi agen & urutan baca |
| [`DESIGN_GUIDELINES.md`](./DESIGN_GUIDELINES.md) | UI tokens, pola, RBAC tampilan |
| [`docs/AI_DEVELOPMENT_LIFECYCLE.md`](./docs/AI_DEVELOPMENT_LIFECYCLE.md) | Siklus Intake → Spec → Design → Implement → Verify |
| [`docs/BRD-Contract-Management-System-v1.3.md`](./docs/BRD-Contract-Management-System-v1.3.md) | Business Requirement Document v1.3 |
| [`docs/ODOO_INTEGRATION.md`](./docs/ODOO_INTEGRATION.md) | Batas & pola integrasi Odoo |
| [`docs/PANDUAN-OPERASIONAL-CMS.md`](./docs/PANDUAN-OPERASIONAL-CMS.md) | How-to A→B→C di mockup |
| [`CMS_Mockup.html`](./CMS_Mockup.html) | Prototype UI (buka di browser) |

## Konsep singkat

- **Party Detail** = rumah utama kontrak, amendment, novation, termination, supporting docs, SO, audit.
- **Legal** mengelola lifecycle tanpa approval internal untuk Change CP / Amendment / Early Termination.
- **Odoo**: link Party↔Partner + sync SO (read/consume). CMS tidak menggantikan Sales/Accounting Odoo.
- **Role**: hide yang tidak boleh dilihat; view-only tanpa create/edit.

## Data demo

- `List MSA Customer (Updated).xlsx` — register sumber KPI/demo.
- Mockup memakai subset party interaktif + KPI register.

## Status proyek

Saat ini: **BRD + mockup + docs fondasi + scaffold Next.js (`web/`)**.

- Mockup UX: [`CMS_Mockup.html`](./CMS_Mockup.html)
- App: [`web/`](./web/) — **Next.js + React** (Supabase, Odoo/RAGFlow adapters, Extraction Lab)
- Checklist trial Odoo + AI: [`docs/CHECKLIST-ODOO-TRIAL-DAN-AI.md`](./docs/CHECKLIST-ODOO-TRIAL-DAN-AI.md)
- Persiapan ekstraksi: [`docs/PREP-EKSTRAKSI-RAGFLOW.md`](./docs/PREP-EKSTRAKSI-RAGFLOW.md), [`docs/PREP-AI-EKSTRAKSI-UNTUK-TIM.md`](./docs/PREP-AI-EKSTRAKSI-UNTUK-TIM.md)
- Skema awal: [`supabase/migrations/001_initial.sql`](./supabase/migrations/001_initial.sql)

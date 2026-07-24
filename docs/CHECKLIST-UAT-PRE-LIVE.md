# Checklist UAT & Pre-Live — DCI CMS

Dokumen ini adalah **test case + checklist** sebelum go-live production.  
Centang setiap item setelah diuji; catat hasil di kolom **Hasil** (`PASS` / `FAIL` / `N/A` / `SKIP`).

**Referensi requirement:** [`BRD-Contract-Management-System-v1.3.md`](./BRD-Contract-Management-System-v1.3.md)  
**Referensi UI target:** [`CMS_Mockup.html`](../CMS_Mockup.html), [`DESIGN_GUIDELINES.md`](../DESIGN_GUIDELINES.md)  
**Runbook integrasi:** [`RUNBOOK-SETUP-ODOO-RAGFLOW.md`](./RUNBOOK-SETUP-ODOO-RAGFLOW.md)

---

## Legenda status implementasi (per 2026-07-24)

| Simbol | Arti |
| --- | --- |
| ✅ | Sudah ada di app Next.js (`web/`) — uji fungsional |
| 🟡 | Partial / POC — uji sebagian |
| ⬜ | Belum diimplementasi — uji mockup atau rencanakan post-live |
| 🔒 | Wajib lulus sebelum live |

### Progress AIDLC (fase dev)

| Fase | Status | Ringkasan |
| --- | --- | --- |
| **1. Integrasi backend** | ✅ Selesai | Odoo live, RAGFlow, Supabase schema 001–008, seed demo mockup |
| **2. Domain core** | ✅ ~95% | Parties, link Odoo, kontrak lifecycle, SO sync, audit |
| **3. Port UI mockup** | ✅ ~90% | Party list, Renewal, Notifikasi, Dashboard panels (lifecycle/PIC/timeline) |
| **4. Polish & pre-live** | 🟡 **Sedang** | Supabase Auth seed, dashboard mockup parity, UAT manual |
| **5. Verify & ship** | ⬜ Belum | Go/No-Go §14, hardening §10 |

**Posisi saat ini:** akhir **Fase 3** — UI mendekati mockup; lanjut polish visual + auth production + UAT manual.

---

## 0. Persiapan environment uji

| # | Check | Expected | Impl | Hasil | Catatan |
| --- | --- | --- | --- | --- | --- |
| 0.1 | `web/.env.local` lengkap (Supabase, Odoo, RAGFlow, service role) | Tidak error saat start | 🟡 | | |
| 0.2 | `npm run dev` dari folder `web/` | App di `:3000` | ✅ | | |
| 0.3 | Migration `001`–`008` (+ seed demo) | Tabel ada + data mockup | 🟡 | | `npm run seed:demo` |
| 0.4 | Bucket Storage `contracts` (private) | Bucket ada | 🟡 | | |
| 0.5 | Odoo: Contacts + Sales terpasang | API Partner/SO OK | ✅ | | |
| 0.6 | RAGFlow self-host Up + healthz OK | `status: ok` | ✅ | | |

---

## 1. Autentikasi & RBAC 🔒

| # | Test case | Role | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | Login berhasil | Semua | Buka `/` → pilih role → login | Redirect ke `/dashboard` | 🟡 | | Mock login localStorage, bukan Supabase Auth |
| 1.2 | Tanpa login tidak bisa akses app | — | Buka `/parties` langsung | Redirect ke `/` | ✅ | | |
| 1.3 | Logout | Semua | Klik Keluar | Kembali ke login | ✅ | | |
| 1.4 | Menu sidebar sesuai role | Legal | Login Legal | Dashboard, Parties, Renewal, Extraction Lab | 🟡 | | Extraction Lab belum di mockup |
| 1.5 | Menu sidebar sesuai role | Business | Login Business | Dashboard, Parties saja | 🟡 | | |
| 1.6 | Menu sidebar sesuai role | Finance | Login Finance | + SO Health | 🟡 | | |
| 1.7 | Menu sidebar sesuai role | IT | Login IT | + SO Health, Renewal | 🟡 | | |
| 1.8 | Aksi edit disembunyikan jika view-only | Business | Buka Parties | Tidak ada Add Party / Link Odoo | 🟡 | | |
| 1.9 | Supabase Auth production | — | Login email/password | Session + `profiles.role` | 🟡 | | Set `NEXT_PUBLIC_AUTH_MODE=supabase` + migration 006 |
| 1.9a | Mock auth dev | — | Default tanpa env | Role picker + cookie session | 🟡 | | POST `/api/auth/session` |
| 1.10 | API RBAC write guard | Business POST party | 403 Forbidden | 🟡 | | requireCanEdit on mutating routes |
| 1.11 | Middleware route guard | Tanpa login → `/` | Redirect | 🟡 | | `middleware.ts` + `cms_session` cookie |
| 1.12 | Session cookie on login | Legal login | Cookie httpOnly | 🟡 | | credentials: include via cmsFetch |

---

## 2. Dashboard (FR-DASH) 🔒

| # | Test case | Role | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- | --- |
| 2.1 | KPI cards per role | Legal | Buka Dashboard | KPI legal (pending review, renewal, Odoo link) | ✅ | | Lifecycle donut + PIC workload |
| 2.2 | KPI cards per role | Finance | Buka Dashboard | KPI SO / commercial | ✅ | | SO synchronized / no SO / errors |
| 2.3 | Pending actions list | Legal | Dashboard | Item tindakan + link ke Party | ✅ | | Renewal H-14 + amendment ready |
| 2.4 | Renewal agenda ringkas | Legal/Mgmt | Dashboard | Timeline renewal risk | ✅ | | Management panel + /renewal |
| 2.5 | Dev status panel | Dev | Dashboard | Status koneksi env | 🟡 | | Hanya NODE_ENV development |
| 2.6 | Supabase Auth UAT users | Dev | `npm run seed:auth` | 5 role users + profiles | 🟡 | | Set AUTH_MODE=supabase |

---

## 3. Parties — master & Odoo link (FR-PTY / INT-PTY) 🔒

| # | Test case | Role | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- | --- |
| 3.1 | List party dari Supabase | Semua | Buka `/parties` | Tabel party_code, name, PIC, Odoo link | ✅ | | |
| 3.2 | Filter nama party | Semua | Ketik di search → refresh | Hasil filter benar | ✅ | | |
| 3.3 | Filter Odoo link status | Semua | Pilih Linked / Pending / Mismatch | Filter benar | ✅ | | |
| 3.4 | Add party baru | Legal | + Add Party → simpan | Row baru, status Pending Odoo Link | ✅ | | |
| 3.5 | Party code auto increment | Legal | Add 2 party | PTY-00001, PTY-00002, … | ✅ | | |
| 3.6 | Audit log party create | Legal | Add party | Row di `audit_logs` | ✅ | | |
| 3.7 | Search Odoo Partner | Legal | Link Odoo → Search | List `res.partner` live | ✅ | | |
| 3.8 | Comparison sebelum link | Legal | Pilih kandidat | Tabel CMS vs Odoo | ✅ | | |
| 3.9 | Link exact match → Linked | Legal | Nama sama → confirm | `odoo_link_status=linked`, `odoo_partner_id` terisi | ✅ | | |
| 3.10 | Link nama beda → Mismatch | Legal | Nama beda → confirm | Status Mismatch | ✅ | | |
| 3.11 | Relink wajib reason | Legal | Ganti partner linked | Error tanpa reason; sukses dengan reason | ✅ | | |
| 3.11a | Modal tidak tutup klik luar | Legal | Klik area gelap modal Link | Modal tetap terbuka | 🟡 | | Tutup hanya Batal/✕/Escape |
| 3.11b | Auto-search saat buka Link | Legal | Buka Link Odoo | Kandidat muncul tanpa klik Search dulu | 🟡 | | |
| 3.11c | Success screen setelah link | Legal | Konfirmasi link | Tampil Partner #id + status pill | 🟡 | | |
| 3.11d | Mismatch tetap tampil Partner ID | Legal | Link nama beda | Pill Mismatch + `#partner_id` di list & Detail | 🟡 | | Bukan berarti unlinked |
| 3.12 | Party Detail drill-in | Semua | Klik party | Tabs kontrak, SO, audit | ✅ | | 7 tabs + modals |
| 3.13 | Global search party | Semua | Search topbar → Enter | Navigasi ke `/search?q=` | ✅ | | |
| 3.14 | Party list kolom mockup | Semua | `/parties` | Dokumen Utama, Date, Durasi, Status | 🟡 | | Primary contract roll-up |
| 3.15 | Filter PIC + status kontrak | Semua | Filter di list | Hasil benar | 🟡 | | |

---

## 4. Kontrak — lifecycle (FR-CNT-*) 

| # | Test case | Role | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- | --- |
| 4.1 | Add contract under party | Legal | Party Detail → Add Contract | Draft + metadata | 🟡 | | FR-CNT-ADD-001/007; upload PDF belum |
| 4.1a | Contract code auto | Legal | Add contract | `CMS-YYYY-0001` increment | 🟡 | | |
| 4.1b | Simpan Under Review | Legal | Add Contract → Under Review | status `under_review` | 🟡 | | |
| 4.1c | Renewal/expiry dates | Legal | Isi agreement date + duration | `renewal_date` & `expiry_date` terhitung | 🟡 | | renewal = expiry − 90 hari |
| 4.1d | Party Inactive block | Legal | Add contract party inactive | Error BRL-CMS-031 | 🟡 | | |
| 4.1e | Kontrak muncul di tab Contracts | Legal | Setelah create | Row di Party Detail | 🟡 | | FR-CNT-ADD-009 |
| 4.1f | Audit log create contract | Legal | Add contract | Row di audit tab party | 🟡 | | |
| 4.2 | Upload PDF kontrak | Legal | Upload saat create | File ke Supabase Storage + RAGFlow | 🟡 | | Bucket `contracts` wajib ada |
| 4.3 | Ekstraksi RAGFlow | Legal | Upload → create | `extracted_metadata` terisi | 🟡 | | Saat Add Contract + file |
| 4.4 | User confirm metadata | Legal | Review screen | `confirmed_metadata` | 🟡 | | ContractReviewModal dual column |
| 4.5 | Validasi vs Party + Odoo | Legal | Upload + linked party | validation_status ok/mismatch | 🟡 | | Auto saat create dengan file |
| 4.6 | Lifecycle status transition | Legal | Review → Submit Review → Sent → Active | Status §9.3 | 🟡 | | PATCH `/api/contracts/[id]` |
| 4.6a | Mark Fully Signed + upload signed PDF | Legal | Review → upload signed | Storage + status fully_signed | 🟡 | | BRL-CMS-018 |
| 4.6b | Download contract PDF | Legal | Supporting / contract docs tab | Signed URL Supabase Storage | 🟡 | | GET `/api/documents/[id]/download` |
| 4.7 | Review / Sent to CP / Ready for Sign | Legal | Contract Review modal | Tombol status per state | 🟡 | | |
| 4.8 | Change Counterparty | Legal | Tab Contracts → CP | Audit + novation tab | 🟡 | | POST counterparty-change |
| 4.8a | CP Correction block | Legal | Active contract + Correction | Error BRL-CMS-008 | 🟡 | | |
| 4.8b | CP blocked waiting sign | Legal | ready_for_sign + CP | Error BRL-CMS-009 | 🟡 | | |
| 4.9 | Amendment / Addendum | Legal | Party Detail → Amendment | Linked ke parent + audit | 🟡 | | POST `/api/contracts/[id]/amendments` |
| 4.9a | Amendment list di Party | Legal | Tab Contracts | Tabel amendment_code | 🟡 | | FR-CNT-AMD-008 |
| 4.10 | Early Termination | Legal | Party Detail → Termination | Record + status update | 🟡 | | Hanya Active; scheduled vs immediate |
| 4.10a | Termination tab history | Legal | Tab Termination | List effective date | 🟡 | | FR-CNT-TERM-009 |
| 4.11 | Supporting documents | Legal | Upload supporting | List di tab Supporting | 🟡 | | Tidak ubah lifecycle FR-CNT-SUP-004 |
| 4.11a | File type / size validation | Legal | Upload >20MB atau selain PDF/DOCX | Error FR-CNT-SUP-003 | 🟡 | | |
| 4.12 | Edit Contract Details (admin only) | Legal | Party Detail → Edit | Title/owner/dept/remarks saja | 🟡 | | PATCH edit_admin; field sensitif locked |
| 4.12a | Edit audit trail | Legal | Simpan edit | Row audit + payload changes | 🟡 | | FR-CNT-EDIT-006 |
| 4.12b | Edit blocked view-only | Business | Party Detail | Tidak ada tombol Edit | 🟡 | | RBAC canEdit |

---

## 5. Odoo — SO sync (INT-SO / FR-CNT-SO) 🔒

| # | Test case | Role | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- | --- |
| 5.1 | Load SO list | Finance/IT | `/so` → Refresh | List dari Supabase mirror | 🟡 | | Bukan langsung Odoo di UI |
| 5.2 | Run Sync batch | IT/Legal | Run Sync Now | SO tersimpan + timestamp | 🟡 | | POST `/api/so` |
| 5.2a | Run Sync per party | Legal | Party Detail → SO tab → Run Sync | SO party tersebut saja | 🟡 | | body `{ partyId }` |
| 5.2b | Audit log SO sync | IT | Run Sync | Row audit `SO Sync batch` | 🟡 | | |
| 5.2c | Upsert idempotent | IT | Run Sync 2× | Tidak duplikat `odoo_order_id` | 🟡 | | |
| 5.3 | SO status Synchronized | IT | Party dengan SO aktif | Flag synchronized | 🟡 | | Via mirror sale/done |
| 5.4 | No Active SO flag | IT | Party active contract, no SO | Banner di Party Detail SO tab | 🟡 | | FR-CNT-SO-007 / NOTIF-014 path |
| 5.5 | Sync error handling | IT | Partner ID invalid | Error + notifikasi, tidak silent | 🟡 | | audit `sync_error` + NOTIF-CMS-SYNC |
| 5.5a | Sync error di SO Health | IT | Run Sync gagal | Banner error per party | 🟡 | | |
| 5.6 | CMS tidak write SO/Partner | Dev | Review code/API | Tidak ada create/write Odoo | ✅ | | |

---

## 6. RAGFlow & smart search (FR-CNT-SV-003)

| # | Test case | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- |
| 6.1 | Health API CMS → RAGFlow | GET `/api/ragflow/health` | ok + datasets | ✅ | | |
| 6.2 | Upload + parse PDF | Extraction Lab | Metadata + doc id | ✅ | | |
| 6.3 | Retrieve semantic search | Extraction Lab → Retrieve | Chunks relevan | ✅ | | |
| 6.4 | Smart search page (production UI) | Search menu | Filter metadata + RAG | 🟡 | | `/search` + GET `/api/search` |
| 6.5 | RBAC pada hasil search | Business vs Legal | Hasil sesuai hak akses | 🟡 | | RBAC penuh setelah Supabase Auth |
| 6.6 | Global search → Smart Search | Topbar Enter | Redirect `/search?q=` | 🟡 | | |

---

## 7. Renewal Calendar (FR-DASH-004)

| # | Test case | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- |
| 7.1 | Grid bulan + marker due | Buka `/renewal` | Kalender interaktif | 🟡 | | Data dari kontrak Supabase |
| 7.2 | Nav bulan | ‹ › Bulan ini | Pindah bulan | 🟡 | | Month + year picker mockup parity |
| 7.3 | Side panel detail due | Klik tanggal | Party/kontrak due + link Detail | 🟡 | | |
| 7.4 | Summary strip urgent/soon | Buka Renewal | Chip count urgent/soon/later | 🟡 | | BRL-CMS-023 buckets |
| 7.5 | Filter tabel agenda | Chip Urgent/Segera/Bulan | Filter benar | 🟡 | | |
| 7.6 | Agenda muncul setelah Add Contract | Legal | Add contract + date → Renewal | Marker di kalender | 🟡 | | Butuh migration 003 |
| 7.7 | Role IT/Legal akses | Login IT | Menu Renewal ada | ✅ | | |
| 7.8 | API renewal | Dev | GET `/api/renewal` | `{ items, summary }` | 🟡 | | |

---

## 8. Notifikasi & Activity Log (INT-NOTIF / BRL-CMS-025)

| # | Test case | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- |
| 8.1 | Bell notifikasi topbar | Klik lonceng | List NOTIF-CMS-* | 🟡 | | + `/notifications` |
| 8.2 | Activity Log dari menu profil | Sidebar / notif link | `/activity` audit global | 🟡 | | Filter tipe + Export CSV |
| 8.3 | Audit di Party Detail | Buka party | Riwayat aksi party | 🟡 | | Termasuk link Odoo + create contract |
| 8.4 | Audit link/relink Odoo | Link party | Row di `audit_logs` | ✅ | | |

---

## 9. UI / UX vs mockup (DESIGN_GUIDELINES)

| # | Test case | Expected (mockup) | App localhost saat ini | Impl | Hasil |
| --- | --- | --- | --- | --- | --- |
| 9.1 | Tema ink + brass | Sidebar gelap, accent brass | ✅ sebagian (shell.css) | 🟡 | | |
| 9.2 | Font Serif/Sans/Mono | Source Serif 4, IBM Plex | ✅ loaded | ✅ | | |
| 9.3 | KPI cards dashboard | Per role | Mockup parity | ✅ | | Donut + PIC + timeline |
| 9.4 | Tabel parties kaya | Kolom dokumen, agreement date, durasi | Kolom mockup parity | 🟡 | | |
| 9.5 | Party Detail tabs | Contracts, SO, audit, … | 7 tabs | ✅ | | |
| 9.6 | Modal pola mockup | Footer ghost/primary konsisten | Modal parties + Add Contract | 🟡 | | |
| 9.7 | Mobile sidebar drawer | Hamburger ≤1100px | Drawer + backdrop | 🟡 | | AppShell menu-toggle |
| 9.8 | Global search topbar | Search parties | Input → `/search` + Advanced link | 🟡 | | |
| 9.9 | Profile menu lengkap | Preferensi, Activity Log | Activity Log di sidebar | 🟡 | | |

---

## 10. Keamanan pre-live 🔒

| # | Check | Expected | Hasil | Catatan |
| --- | --- | --- | --- | --- |
| 10.1 | `.env.local` tidak di git | Tidak ter-commit | | |
| 10.2 | API key Odoo/RAGFlow di-rotate | Key production baru | | |
| 10.3 | `SUPABASE_SERVICE_ROLE_KEY` hanya server | Tidak di `NEXT_PUBLIC_*` | | |
| 10.4 | RAGFlow port tidak publik sembarangan | Firewall / Nginx | | |
| 10.5 | RLS Supabase diperketat | Role-based policies | 🟡 | | migration 007 |
| 10.6 | HTTPS production | CMS + RAGFlow | | |

---

## 11. Regression API (smoke test cepat)

Jalankan sebelum setiap release candidate:

```text
GET  http://localhost:3000/api/odoo/health      → ok: true
GET  http://localhost:3000/api/ragflow/health   → ok: true
GET  http://localhost:3000/api/parties          → ok: true (dengan session cookie setelah login)
POST http://localhost:3000/api/odoo/partners/search  body: {"domain":[],"limit":5}
```

Manual UI (5 menit):

1. Login Legal  
2. `/parties` — list + add + link Odoo  
3. Party Detail → Add Contract **dengan PDF** → cek validation_status  
4. Amendment + Early Termination (kontrak status Active dulu)  
5. Upload Supporting Doc  
6. `/renewal` — kalender  
7. `/so` — Run Sync  

**DB (sebelum UI di atas):** migration `003` + `004` + `005` + `006` + `007` di Supabase SQL Editor.

---

## 12. Database migration 004

| # | Test case | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- |
| 12.1 | Tabel `contract_amendments` | Table Editor | Schema amendment | 🟡 | | |
| 12.2 | Kolom `documents.document_category` | Table Editor | contract / supporting | 🟡 | | |
| 12.3 | Add contract + PDF | Legal | Multipart create | Storage + RAGFlow + documents row | 🟡 | | |
| 12.4 | Amendment create | Legal | Modal Amendment | Row di contract_amendments | 🟡 | | |
| 12.5 | Termination scheduled | Legal | Effective date future | status_text Termination Scheduled | 🟡 | | FR-CNT-TERM-007 |
| 12.6 | Termination immediate | Legal | Effective date today/past | status terminated | 🟡 | | FR-CNT-TERM-008 |

---

## 13. Database migration 005

| # | Test case | Langkah | Expected | Impl | Hasil |
| --- | --- | --- | --- | --- | --- |
| 13.1 | Tabel `contract_counterparty_changes` | Table Editor | Schema CP history | 🟡 | | |
| 13.2 | Kolom `original_party_id` | contracts | Backfill = party_id | 🟡 | | FR-CNT-SV-007 |
| 13.3 | Change CP novation | Legal | CP → party lain | Kontrak pindah + history tab | 🟡 | | |
| 13.4 | Contract review metadata | Legal | Review → Konfirmasi | validation_status update | 🟡 | | |

---

## 14. Go / No-Go live (ringkas)

**Go-live minimal (MVP integrasi)** — semua harus PASS:

- [ ] 1.9 Supabase Auth + RBAC nyata (bukan mock login)
- [ ] 3.1–3.11 Parties + Odoo link
- [ ] 5.1–5.6 Odoo consume-only + SO sync batch
- [ ] 6.1–6.3 RAGFlow pipeline untuk upload kontrak
- [ ] 4.1–4.5 Add contract + dual metadata persist
- [ ] 10.1–10.6 Keamanan

**Post-MVP ( boleh setelah live terbatas ):**

- Amendment / Termination modal, Notifikasi, Smart Search UI, E-sign, PDF upload saat create

---

## Catatan tester

| Tanggal | Tester | Build/commit | Environment | Ringkasan |
| --- | --- | --- | --- | --- |
| | | | local / staging | |
| | | | | |

---

## Mengapa localhost belum mirip `CMS_Mockup.html`?

Ini **by design** pada fase saat ini — bukan bug:

| Aspek | `CMS_Mockup.html` | App Next.js (`web/`) |
| --- | --- | --- |
| **Tujuan** | Prototype UX lengkap untuk stakeholder & BRD | Scaffold engineering + integrasi nyata |
| **Cakupan** | ~17 party demo, semua modal, calendar, notif, audit | Parties + integrasi Odoo/RAGFlow/Supabase |
| **Data** | JavaScript in-memory (`state.parties`) | Supabase + API Odoo/RAGFlow |
| **Auth** | Simulasi role instant | Mock login localStorage (sementara) |
| **Halaman** | Dashboard KPI, Party Detail, Renewal grid, dll. | Dashboard placeholder, Renewal placeholder |
| **CSS** | Satu file HTML ~3200 baris, semua komponen | `shell.css` minimal (~400 baris) |

**Urutan dev yang disepakati (AIDLC):**

1. ✅ Integrasi backend (Odoo, RAGFlow, Supabase schema + seed)  
2. ✅ Domain core (Parties + link Odoo + kontrak lifecycle)  
3. ✅ Port UI mockup ke komponen React  
4. 🟡 Polish & pre-live — **sedang di sini** (Auth seed, UAT, e-sign backlog)  
5. ⬜ Verify & ship (Go/No-Go)

Jadi localhost **sudah benar** untuk fase integrasi; belum waktunya pixel-perfect dengan mockup sampai fitur domain core stabil.

**Agar mirip mockup:** port bertahap dari `CMS_Mockup.html` → komponen React, mulai dari Party Detail + Dashboard KPI (lihat [`DESIGN_GUIDELINES.md`](../DESIGN_GUIDELINES.md)).

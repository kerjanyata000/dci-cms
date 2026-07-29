# BRD Coverage Status — CMS v1.3

Status implementasi vs `docs/BRD-Contract-Management-System-v1.3.md` (app Next.js `web/`, bukan modul Odoo).

**Legenda:** Done = sesuai intent BRD · Partial = ada modul tapi belum lengkap · Missing = belum ada · Out of scope / N/A = §4.2 atau tidak berlaku

**Catatan arsitektur:** BRD menyebut “CMS di Odoo”; produk = **Next.js + Supabase**, Odoo hanya **consume** Partner/SO.

---

## 4.1 In Scope

| # | Item | Status | Kenapa statusnya begitu |
| --- | --- | --- | --- |
| 1 | Login and Dashboard | **Done** | Login mock/Supabase + dashboard per role (`/dashboard`, KPI, pending) |
| 2 | Party-level Contract Search & View | **Done** | Smart Search + Party Detail (kontrak, AMD, CP, term, supporting, SO, audit) |
| 3 | Add New Contract | **Done** | Add Contract di Party + upload + extract RAGFlow + dual metadata |
| 4 | Edit Contract Details | **Done** | Edit admin only; field sensitif terkunci (CP/value/period/signed) |
| 5 | Contract Review Status Update | **Partial** | Review modal: draft→review→sent→revision→ready→FS/Active; **e-sign webhook belum** |
| 6 | Change Counterparty | **Done** | Aksi Legal khusus + history di Party Detail; tanpa approval |
| 7 | Create Amendment / Addendum | **Done** | Linked AMD + Review Ready/Fully Signed + update Current Summary parent |
| 8 | Early Termination | **Partial** | Buat term + scheduled→Terminated by effective date; signing/dokumen term tipis |
| 9 | Upload Supporting Document | **Done** | Upload + void soft; tidak ubah lifecycle kontrak |
| 10 | SO Synchronization | **Partial** | Run Sync consume-only + prompt setelah Fully Signed; **batch scheduler belum** |
| 11 | Parties Search and View | **Done** | `/parties` register + filter + Link Odoo + Party Detail |
| 12 | Audit Trail and History | **Done** | `audit_logs` + Activity Log + tab Audit Party |
| 13 | Notifications | **Partial** | In-app bell/list (renewal, SO, Odoo, audit); **email/Odoo activity belum** |
| 14 | Parties - Add New Party | **Done** | Create + kode party; cek duplikat nama/NPWP (live + server block); Odoo link setelah create |
| 15 | Parties - Edit Party | **Done** | Edit NPWP/alamat/tipe/kontak + audit |
| 16 | Parties - Delete / Deactivate | **Partial** | Deactivate/activate saja; **hard delete unused belum** |

---

## 4.2 Out of Scope

| # | Item | Status | Kenapa |
| --- | --- | --- | --- |
| 1 | Auto create/update Odoo Partner | **Out of scope** | Link/compare only — by design |
| 2 | Legal approval workflow | **Out of scope** | CP/AMD/Term Legal-managed tanpa approval |
| 3 | Clause negotiation automation | **Out of scope** | Tidak diimplementasi |
| 4 | Auto drafting dari template | **Out of scope** | Upload dokumen saja |
| 5 | Legal advice / risk scoring | **Out of scope** | Tidak diimplementasi |
| 6 | Create/amend/cancel SO di Odoo | **Out of scope** | Sync consume-only — dihormati di kode |
| 7 | Invoice / billing / AR-AP | **Out of scope** | Tidak ada modul |
| 8 | E-sign commercial setup | **Out of scope** | Tidak ada adapter DocuSign/dll. |
| 9 | Bulk historical migration | **Out of scope** | Bukan fitur produk |
| 10 | Advanced BI / predictive | **Out of scope** | KPI role saja |

---

## 5. Stakeholders / Roles

| Stakeholder | Status | Kenapa |
| --- | --- | --- |
| Legal | **Done** | Role `legal`, full edit |
| Business | **Done** | View-only, nav terbatas |
| Finance | **Done** | Fokus SO Health |
| Management | **Done** | Renewal + audit, view-only |
| IT | **Done** | Sync + integration |
| Counterparty eksternal | **N/A** | Tidak ada portal CP; status “Sent to CP” di Legal |
| Signer e-sign | **Partial** | Upload signed manual; bukan signer UX provider |
| Odoo ERP | **Done** | Partner search + SO sync API |
| E-sign provider | **Missing** | Belum ada integrasi |

---

## 6. High-level process

| Proses | Status | Kenapa |
| --- | --- | --- |
| 6.1 Login / Dashboard | **Done** | Auth + dashboard role |
| 6.2 Search & View | **Done** | Search → Party Detail |
| 6.3 Add Contract | **Done** | Modal + API + extract |
| 6.4 Edit Contract | **Done** | Admin fields |
| 6.5 Review Status | **Partial** | Manual OK; e-sign gap |
| 6.6 Change CP | **Done** | Modal + API + history |
| 6.7 Amendment | **Done** | Create + status Ready/FS |
| 6.8 Early Terminate | **Partial** | Record + effective date |
| 6.9 Supporting | **Done** | Upload + void |
| 6.10 SO Sync | **Partial** | Manual + prompt FS |
| 6.11 Parties SV | **Done** | Primary inquiry |
| 6.12 Add Party | **Done** | Create + block duplikat nama/NPWP |
| 6.13 Edit Party | **Done** | EditPartyModal |
| 6.14 Delete Party | **Partial** | Soft deactivate only |

---

## 7. Business Requirements (BR-CMS)

| ID | Status | Kenapa |
| --- | --- | --- |
| BR-001 | **Partial** | CMS terpusat ada, tapi **bukan di dalam Odoo** |
| BR-002 | **Done** | 5 role RBAC |
| BR-003 | **Done** | Search party/kontrak → konteks Party |
| BR-004 | **Partial** | Smart search + RAGFlow; ACL baris belum |
| BR-005 | **Done** | Legal create + upload |
| BR-006 | **Done** | Extracted vs confirmed metadata |
| BR-007 | **Done** | Validasi Party Master; field sensitif terkunci |
| BR-008 | **Done** | Edit admin |
| BR-009 | **Done** | Change CP terpisah dari Edit |
| BR-010 | **Partial** | Review + revision + FS manual; e-sign belum |
| BR-011 | **Done** | CP tanpa approval + audit |
| BR-012 | **Done** | AMD linked, tanpa approval |
| BR-013 | **Done** | Early term + history Party |
| BR-014 | **Done** | Supporting tanpa ubah lifecycle |
| BR-015 | **Partial** | SO sync ada; trigger batch belum |
| BR-016 | **Done** | Parties + Odoo link/compare |
| BR-017 | **Done** | Renewal calendar |
| BR-018 | **Done** | Audit trail luas |
| BR-019 | **Partial** | Notif in-app; delivery eksternal belum |
| BR-020 | **Done** | Tidak write-back SO/accounting |
| BR-021 | **Done** | Semua record terkait di Party Detail |
| BR-022 | **Done** | Edit Party + Odoo compare |
| BR-023 | **Partial** | Deactivate ok; hard delete unused belum |

---

## 8. Functional Requirements (ringkas per domain)

### Dashboard (FR-DASH)
| ID | Status | Kenapa |
| --- | --- | --- |
| 001–005 | **Done** | Login, error, dashboard role, calendar, pending actions |

### Search & View (FR-CNT-SV)
| ID | Status | Kenapa |
| --- | --- | --- |
| 001, 003, 005–007 | **Done** | Search, RAG content, Party Detail, original vs current party |
| 002, 004 | **Partial** | Filter kriteria belum penuh; RBAC route bukan row ACL |

### Add / Edit Contract
| Domain | Status | Kenapa |
| --- | --- | --- |
| FR-CNT-ADD 001–009 | **Done** | Create, upload, extract, validate, draft, numbering |
| FR-CNT-EDIT | **Done** / **Partial** | Admin edit Done; tag/reminder PIC tipis |

### Review / Sign (FR-CNT-RVW)
| ID | Status | Kenapa |
| --- | --- | --- |
| 001–003 | **Done** | Status + Sent to CP + Revision Required |
| 004–006, 009–010 | **Partial** | Versi dokumen / ready / manual FS ada; e-sign belum |
| 007–008, 011 | **Missing** | Envelope, validasi pre-send, resend e-sign |

### Change CP / AMD / Term / Supporting
| Domain | Status | Kenapa |
| --- | --- | --- |
| FR-CNT-CP | **Done** (CP-009 Partial) | Aksi + history; upload supporting khusus CP tipis |
| FR-CNT-AMD | **Done** (005 Partial) | Lifecycle sederhana tanpa e-sign |
| FR-CNT-TERM | **Partial** | 001–003, 006–009 Done; signing term (005) Missing |
| FR-CNT-SUP | **Done** | Upload + void + audit |

### SO (FR-CNT-SO)
| ID | Status | Kenapa |
| --- | --- | --- |
| 002–004, 007–009 | **Done** | Inquiry, store, No Active SO, consume-only, audit |
| 001, 005–006 | **Partial** | Prompt + manual sync; auto Active dari SO & update expiry terbatas |

### Party (FR-PTY-*)
| Domain | Status | Kenapa |
| --- | --- | --- |
| PTY-SV | **Done** | Inquiry + link/relink |
| PTY-ADD | **Done** | Create + duplicate check nama/NPWP (live UI + server) |
| PTY-EDIT | **Done** | Master fields + audit |
| PTY-DEL | **Partial** | Soft deactivate; hard delete Missing |

---

## 9. Status models

| Model | Status | Kenapa |
| --- | --- | --- |
| 9.1 Contract lifecycle | **Partial** | Draft…Active/Expired/Terminated ada; Cancelled tipis; Ready vs Waiting conflated |
| 9.2 Signature status | **Missing** | Tidak ada envelope/signer state terpisah |
| 9.3 Amendment status | **Partial** | Draft→Ready→FS; Waiting for Sign dilewati |
| 9.4 Termination status | **Partial** | `scheduled`/`completed` vs enum BRD penuh |
| 9.5 Odoo link | **Done** | Unlinked/Pending/Linked/Mismatch/Relink |
| 9.6 SO sync status | **Partial** | Health derived; bukan enum per-kontrak penuh |
| 9.7 Party status | **Partial** | Active/Inactive (Draft/Deleted tidak dipakai) |

---

## 10. Business Rules (BRL) — grup

| Grup | Status | Kenapa |
| --- | --- | --- |
| RBAC 001–003 | **Partial** | Hide/view-only Done; row ACL belum |
| Sensitive / extract / edit 004–006 | **Done** | Sesuai implementasi |
| Counterparty 007–010 | **Done** | Dedicated action + rules |
| Amendment 011–012 | **Done** | Linked, no overwrite |
| Termination 013–014 | **Done** | Active-only + scheduled |
| Supporting 015–016 | **Done** | Void soft, no lifecycle change |
| E-sign 017–018 | **Missing** / **Partial** | Manual FS saja |
| SO 019–020 | **Partial** | Sync aman; Active manual |
| Party–Odoo 021–022 | **Done** | Link + relink audit |
| Renewal/archive 023–024 | **Partial** | Calendar Done; archive N/A |
| Audit 025 | **Done** | audit_logs |
| Party-centric 026–028 | **Done** | Party Detail primary |
| Deactivate 029–031 | **Done** | Soft + block kontrak baru |

---

## 11. Data (§11) — high level

| Area | Status | Kenapa |
| --- | --- | --- |
| Contract, Party, CP change, AMD, Supporting, Audit | **Done** | Tabel + field utama ada |
| Doc versioning / Review envelope | **Partial** / **Missing** | Storage ada; versi & e-sign tables belum |
| Termination | **Partial** | Tabel ada; status BRD penuh belum |
| SO sync | **Partial** | `sale_orders` mirror; enum sync tipis |

---

## 12. Integrations (INT)

| ID | Status | Kenapa |
| --- | --- | --- |
| INT-ESIGN-* | **Missing** | Belum adapter (juga §4.2 commercial) |
| INT-DOC 001–004 | **Done** | RAGFlow extract + smart search |
| INT-SO 001, 003–004 | **Done** | Inquiry, store result, no write-back |
| INT-SO 002 | **Partial** | FS + manual; batch cron belum |
| INT-PTY 001–005 | **Done** | Link/search/compare; no Partner write |
| INT-NOTIF | **Missing** / **Partial** | In-app saja; email/Odoo activity belum |

---

## 13. Notifications (NOTIF-CMS)

Delivery = **in-app**. Kode = cakupan event.

| ID | Event | Status | Kenapa |
| --- | --- | --- | --- |
| 001 | New contract | **Partial** | Via mapping audit |
| 002 | Sent to CP | **Partial** | Via audit status |
| 003 | Revision required | **Done** | Mapping eksplisit |
| 004 | Ready for signature | **Partial** | AMD ready + audit |
| 005 | E-sign sent | **Missing** | Tidak ada e-sign |
| 006 | Signature completed | **Partial** | FS audit longgar |
| 007 | Cancelled/expired/declined sign | **Missing** | Tidak ada e-sign states |
| 008 | Counterparty changed | **Partial** | Audit mapped |
| 009 | AMD fully signed | **Partial** | Mapping audit |
| 010 | Term scheduled | **Partial** | Audit termination |
| 011 | Contract terminated | **Partial** | Lifecycle/audit |
| 012 | Supporting up/void | **Done** | Mapping upload/void |
| 013 | SO sync completed | **Partial** | Error lebih kuat dari success |
| 014 | No active SO | **Done** | Query computed |
| 015 | SO sync error | **Done** | Urgent + list |
| 016 | Odoo mismatch/pending | **Done** | Query parties |
| 017 | Renewal reminder | **Done** | Window renewal |
| 018 | Expiry reminder | **Done** | Window expiry |
| 019 | Party pending Odoo | **Done** | Unlinked/pending |
| 020 | Party updated/deactivated | **Partial** | Heuristik audit |

---

## Ringkasan gap yang masih terbuka

| Prioritas | Gap | Ref BRD |
| --- | --- | --- |
| Could | E-sign provider adapter | INT-ESIGN, FR-CNT-RVW-007…011 |
| Could | Email / Odoo activity delivery | INT-NOTIF, §13 |
| Could | Batch SO + expiry cron | FR-CNT-SO-001, INT-SO-002 |
| Should | Hard delete unused party | FR-PTY-DEL |
| Done | Cek duplikat Party saat create/edit | FR-PTY-ADD-004 |
| Should | Auto Active saat SO ditemukan; update expiry dari SO | FR-CNT-SO-005/006 |
| Nice | Version history dokumen; signing termination | FR-CNT-RVW-004, TERM-005 |

**Sudah ditutup sprint terakhir:** Party edit/deactivate + master fields; Revision Required; void supporting; term/expiry lifecycle; AMD Ready/FS; prompt SO sync setelah FS; auth mock+Supabase; mapping NOTIF dari audit.

---

## Kenapa yang belum Done — kategori alasan

Bukan semua Partial/Missing “terlupakan”. Sebagian **sengaja ditunda**, sebagian **butuh keputusan dulu**, sebagian **memang belum digarap** karena prioritas Must/Should dulu.

### A. Out of scope / by design (§4.2) — tidak dikerjakan karena BRD melarang / mengecualikan

| Item | Alasan |
| --- | --- |
| Buat/ubah/cancel SO, Partner master Odoo, invoice/accounting | Consume-only — CMS tidak write-back |
| Approval workflow internal CP/AMD/Term | Legal-managed, tanpa approval |
| Template drafting, clause AI, BI advanced | Dikecualikan eksplisit |
| E-sign **commercial setup** (lisensi DocuSign dll.) | §4.2 #8 — setup provider di luar implementasi CMS |

### B. Blocked / butuh keputusan produk dulu (prerequisite non-teknis)

| Item | Prerequisite | Baru bisa dikerjakan kalau… |
| --- | --- | --- |
| **E-sign adapter** (envelope, webhook, resend, NOTIF 005/007) | Pilih provider + kredensial + commercial sudah diurus (di luar CMS) | Ada keputusan DocuSign / Privy / dll. + API key |
| **Email / Odoo activity delivery** (INT-NOTIF) | Channel disepakati (SMTP? Odoo mail? keduanya?) + template/penerima | Ada keputusan delivery + kredensial |
| **Odoo Documents → vault CMS** | Keputusan produk — BRD default **tidak** mewajibkan scrape Documents | Product bilang “ya, sync folder Documents” |
| **BR-CMS-001 “CMS di Odoo”** | Arsitektur sudah diputuskan = Next.js standalone | N/A — interpretasi = CMS terpusat (bukan modul Odoo) |

Tanpa keputusan di atas, coding penuh akan spekulatif / salah arah.

### C. Bergantung fitur lain (prerequisite teknis)

| Item yang Partial/Missing | Bergantung pada | Keterangan |
| --- | --- | --- |
| NOTIF e-sign sent / cancelled / declined | **E-sign adapter** | Tidak ada event envelope → tidak bisa notif |
| Signature status model §9.2 | **E-sign** (atau keputusan “manual-only forever”) | Tanpa envelope, status sign terpisah tidak punya sumber kebenaran |
| Termination **signing** lifecycle (TERM-005) | Keputusan: pakai e-sign yang sama atau cukup upload PDF | Saat ini cukup record + effective date |
| Auto **Active** dari SO ditemukan | Aturan bisnis: kapan auto vs Legal klik Mark Active | BRL-020 boleh Active dari SO — perlu confirm policy |
| Update expiry/renewal dari SO sync | Mapping field Odoo mana → CMS (per SO line? order date?) | Perlu spek matching, bukan cuma “belum sempat” |
| Batch SO + expiry **cron** | Env deploy (Vercel cron / worker) + kebijakan frekuensi | Manual path (S3) sudah cukup untuk UAT |
| Notif “kaya” per event (bukan hanya audit heuristic) | Catalog event + (opsional) delivery channel | In-app mapping sudah; polish event-by-event = backlog |

### D. Memang belum dikerjakan — tidak blocked, hanya belum prioritas

Ini **bisa dikerjakan sekarang** tanpa tunggu vendor; sengaja di belakang Must/Should yang sudah selesai.

| Item | Kenapa belum | Estimasi sifat kerja |
| --- | --- | --- |
| **Hard delete** Party unused | Deactivate sudah cukup untuk BRL-030/031; delete jarang dipakai | Kecil–sedang + guard “masih dipakai?” |
| Filter search lebih lengkap (NPWP, Odoo ID, SO) | Smart search & Parties filter dasar sudah ada | Sedang |
| Doc **version history** | Satu dokumen per upload sudah jalan; versi formal belum | Sedang |
| NOTIF success SO sync lebih eksplisit | Error/no-SO sudah; success kurang menonjol | Kecil |
| Row-level ACL (siapa lihat party mana) | RBAC role-menu sudah; ACL baris belum di-scope UAT | Besar — butuh model ownership/PIC |

### E. Sengaja “Partial sederhana” (MVP disepakati di backlog)

| Item | Yang sudah | Yang ditunda sadar |
| --- | --- | --- |
| Review kontrak / AMD status | Manual Legal status + upload signed | Full e-sign |
| SO sync setelah Fully Signed | **Prompt + Run Sync manual** (S3) | Batch scheduler (C3) |
| Notifikasi | In-app list + kode NOTIF | Email push |
| Termination | Effective date → Terminated on open | Full status Draft/In Progress/Waiting Sign |
| Auth | Mock untuk demo + Supabase siap | Paksa semua user production Auth (opsional) |

---

## Cara baca cepat

| Kalau status… | Artinya biasanya… |
| --- | --- |
| **Out of scope** | Jangan dikerjakan kecuali BRD diubah |
| **Missing + e-sign / email** | Tunggu **keputusan / prerequisite** (kategori B–C) |
| **Partial + SO batch / auto Active** | Butuh **spek bisnis kecil** lalu baru code (C) |
| **Partial + hard delete / filter** | **Belum digarap** — bisa langsung (D) |
| **Partial + review/AMD/term** | Fitur inti ada; kelengkapan BRD penuh ditunda sadar (E) |

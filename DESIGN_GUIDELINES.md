# CMS Design Guidelines

Pedoman desain **single source of truth** untuk UI Contract Management System (DCI).  
Mockup referensi: [`CMS_Mockup.html`](CMS_Mockup.html). Kontribusi UI baru wajib selaras agar terasa **dokumen legal / registry**, bukan dashboard generik.

**Base workflow desain:** [`design-system/MASTER.md`](design-system/MASTER.md) (UI UX Pro Max + override proyek ink/brass). Setiap halaman/komponen baru wajib ikuti hierarki di §0.

---

## 0. Alur desain — UI UX Pro Max (wajib)

Semua pekerjaan UI (halaman baru, polish, komponen) memakai **UI UX Pro Max** sebagai *process base*, dengan **override DCI** yang tidak boleh dilanggar.

### Hierarki sumber (urutan kebenaran)

| Prioritas | Dokumen | Fungsi |
| --- | --- | --- |
| 1 | **`DESIGN_GUIDELINES.md`** (file ini) | Prinsip, token ink/brass, RBAC UI, do/don't |
| 2 | **`design-system/MASTER.md`** | Ringkasan design system + checklist UX Pro Max |
| 3 | **`design-system/pages/<page>.md`** | Override per halaman (login, dashboard, renewal, …) |
| 4 | **`CMS_Mockup.html`** | Interaksi & layout referensi |
| 5 | **`web/src/components/shell.css`** | Implementasi CSS (bukan Tailwind/shadcn) |

### Workflow developer / agent

1. **Baca** §1–§7 di file ini + `MASTER.md`.
2. **Cek** apakah ada `design-system/pages/<page>.md`; buat jika halaman baru.
3. **Opsional — eksplorasi skill** (jangan ganti token proyek):

   ```bash
   npm install -g ui-ux-pro-max-cli   # sekali per mesin
   uipro init --ai cursor             # sekali per repo clone
   python .cursor/skills/ui-ux-pro-max/scripts/search.py "legal enterprise registry calendar" --design-system -p "DCI CMS"
   ```

4. **Terapkan override wajib** setelah saran skill:
   - Warna: `--ink` / `--brass` / `--paper` — **bukan** palet generik skill (navy ungu, cream SaaS, dll.).
   - Font: Source Serif 4 + IBM Plex Sans/Mono — **bukan** Plus Jakarta / Inter default skill.
   - Stack: `shell.css` + Next.js — **tanpa** Tailwind/shadcn kecuali keputusan arsitektur terpisah.
   - Pola: party-centric, status pill BRD §9, RBAC hide vs view-only.
5. **Implement** di `web/src/components/`; style hanya lewat kelas di `shell.css`.
6. **Checklist pre-ship** (dari UI UX Pro Max, disesuaikan proyek):
   - Hover/focus 150–200ms, `:focus-visible` pada kontrol interaktif
   - `cursor-pointer` pada baris/kartu/tab yang bisa diklik
   - `prefers-reduced-motion` dihormati
   - Ikon inline SVG — hindari emoji sebagai ikon UI
   - Paginasi pada list panjang (Parties, Renewal, SO, Activity, Audit)
   - Responsive 375 / 768 / 1024 (drawer sidebar sudah ada)

### Instalasi skill (per developer)

```bash
npm install -g ui-ux-pro-max-cli
cd dci-cms
uipro init --ai cursor
```

Skill lokal: `.cursor/skills/ui-ux-pro-max/` (gitignored). Artefak **commit**: `design-system/`.

---

## 1. Prinsip desain

1. **Party-centric first** — setiap detail kontrak dibaca dalam konteks Party (bukan list kontrak datar sebagai rumah utama).
2. **Clarity over decoration** — Legal & Finance membaca metadata & status; hindari ornamen yang mengganggu scan.
3. **Trustworthy registry** — kontras tinggi, status tidak ambigu, tipografi legible (serif untuk judul dossier, sans untuk UI).
4. **Status is the hero** — lifecycle, Odoo link, SO sync, signature memakai pill/badge konsisten (BRD §9).
5. **Role-shaped chrome** — menu, dashboard, dan tombol menyesuaikan role; jangan tampilkan aksi yang tidak diizinkan.
6. **Progressive disclosure** — daftar Party → Party Detail (tabs, bukan item sidebar) → modal aksi terkontrol.
7. **Accessibility** — kontras teks memadai, tap target cukup, focus state terlihat.
8. **Core vs admin path** — sidebar hanya alur harian (Dashboard, Parties, Renewal; + SO Health untuk Finance/IT). Notifikasi = lonceng. Activity Log & integrasi sekunder = menu profil / konteks Party.

---

## 2. Brand & tema — “Sealed Registry”

Nuansa **dokumen kontrak / stempel legal**, bukan SaaS ungu/cream generik.

| Role | Token | Hex (mockup) | Pemakaian |
| --- | --- | --- | --- |
| Ink (primary) | `--ink` | `#12203A` | Sidebar, header dossier, tombol primary |
| Ink deep | `--ink-2` | `#1C2E4F` | Gradien / accent gelap |
| Paper | `--paper` | `#EEF1F4` | Background halaman |
| Surface | `--paper-2` | `#FFFFFF` | Card, tabel, modal |
| Line | `--line` | `#D8DCE3` | Border, divider |
| Text | `--text` | `#22293A` | Body |
| Muted | `--muted` | `#5B6472` | Meta, caption |
| Brass (accent) | `--brass` | `#A8783C` | Brand seal, CTA sekunder, tab aktif |
| Brass soft | `--brass-light` | `#F1E4D0` | Chip, notice |
| Success | `--green` | `#2E7D5B` | Active, Linked, Synchronized |
| Warning | `--amber` | `#C08A2E` | Pending, Under Review, In Progress |
| Danger | `--red` | `#B84A3A` | Terminated, Error, Mismatch, Void |

> Jangan ganti tema ke purple gradient / cream-terracotta generik. Pertahankan ink + brass.

---

## 3. Tipografi

| Family | Token | Dipakai untuk |
| --- | --- | --- |
| Source Serif 4 | `--serif` | Judul halaman, brand, dossier title, KPI value |
| IBM Plex Sans | `--sans` | UI, form, tabel, nav |
| IBM Plex Mono | `--mono` | Party ID, Contract ID, SO number, timestamp |

Scale (orientasi mockup):

- Page title (serif): ~24px
- Section card title (serif): ~15–16px
- Body: ~13px
- Caption / crumb: ~10–11px uppercase tracking untuk breadcrumb

Rule: satu H1 per view; ID & angka referensi pakai mono.

---

## 4. Layout & shell

- **App shell**: sidebar ~248px (`--ink`) + main content.
- **Content max**: ~1360px, padding ~26–28px.
- **Radius**: ~8–10px kontrol; dossier seal bulat.
- **Tables**: header uppercase muted; row hover untuk navigasi Party.
- **Modals**: overlay + card putih; aksi di footer (ghost kiri, primary/danger kanan).

Spacing base ~4px; pakai kelipatan 8/12/16/24.

---

## 5. Komponen pola (dari mockup)

| Pola | Kapan |
| --- | --- |
| Sidebar nav + role badge | Semua authenticated view |
| KPI cards | Dashboard (isi **berbeda per role**) |
| Status pill | Contract / Odoo / SO / amendment / termination |
| Dossier head (seal + meta) | Party Detail |
| Tabs | Party Detail sections |
| Modal form | Add/Edit/Change CP/Amendment/Termination/Upload/Review |
| Notice / readonly banner | Konteks data atau view-only role |
| Audit list / timeline | History & renewal |

### Tombol

- `primary` (`--ink`) — aksi utama halaman/modal (1 per section).
- `brass` — aksi Legal penting sekunder (Add Contract dari detail, dll).
- `ghost` — minor / batal.
- `danger` — terminate, void, deactivate.

### Role UI (wajib)

| Situasi | Perilaku |
| --- | --- |
| Tidak berhak lihat | Menu/tab **tidak dirender** |
| View-only | Konten terlihat; create/edit **disembunyikan** + banner |
| Legal | Full aksi lifecycle |
| IT | Sync/integrasi tanpa create kontrak Legal |
| Business | Request / view; ajukan ke Legal |

---

## 6. Status visual (BRD §9)

Gunakan kelas pill yang sudah distandarkan di mockup (`active`, `fully_signed`, `under_review`, `draft`, `terminated`, `linked`, `pending`, `mismatch`, `synchronized`, `no_so`, `error`, `voided`, …).  
Jangan memakai label register lama (`Closed` / `In Process`) di UI produk — mapping ke kosakata BRD.

---

## 7. Do / Don’t

**Do**

- Pertahankan party-centric navigation.
- Samakan copy aksi dengan BRD (Change Counterparty, Early Termination, dll).
- **Dashboard**: monitoring & pending indicators saja — **jangan** taruh CTA create (Add Contract / Add Party / Ajukan) di Home; aksi create hanya di Parties / Party Detail.

**Don’t**

- Jangan card-hero landing generik / purple glow.
- Jangan tampilkan tombol Legal ke role view-only “abu-abu disabled” bila bisa disembunyikan — prefer **hide**.
- Jangan hardcode alur approval internal untuk CP/Amendment/Termination (out of scope).

---

## 8. Referensi

- **Design system (UI UX Pro Max + override):** [`design-system/MASTER.md`](design-system/MASTER.md), [`design-system/pages/`](design-system/pages/)
- Interaksi lengkap: `CMS_Mockup.html`
- Requirement: `docs/BRD-Contract-Management-System-v1.3.md`
- How-to: `docs/PANDUAN-OPERASIONAL-CMS.md`
- CSS produk: `web/src/components/shell.css`

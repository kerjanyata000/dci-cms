# Panduan Operasional CMS (Mockup) — Outline A → B → C

Panduan ini mengikuti alur BRD v1.3 (`docs/BRD-Contract-Management-System-v1.3.md`).  
Buka `CMS_Mockup.html` di browser, login sebagai **Legal / Contract Admin** untuk aksi penuh.

---

## A. Masuk & pantau portofolio

### A1. Login (BRD §6.1 / FR-DASH)
1. Buka mockup → layar login.
2. Pilih role (Legal / Business / Finance / Management / IT).
3. Klik **Masuk**.
4. Jika akses tidak valid → pesan error (FR-DASH-002).

### A2. Dashboard per role (FR-DASH-003)
Dashboard **monitoring saja — tanpa CTA create** (Add Contract / Ajukan / Run Sync tidak di Home).

| Role | Fokus dashboard | Menu | Create/Edit (di Parties / Detail) |
| --- | --- | --- | --- |
| Legal | Antrian Legal, lifecycle, PIC | Semua | Ya (bukan dari dashboard) |
| Business | Status permintaan | Dashboard, Parties, Notifikasi | Tidak |
| Finance | SO / commercial | + SO Monitor | Tidak |
| Management | Renewal risk, portfolio | + Renewal, Audit | Tidak |
| IT | Integration exceptions | + SO, Audit | Sync di halaman SO |

Chip **Odoo: DUMMY** di header Home = adapter data siap diganti live.

1. Logout → login role lain untuk melihat perbedaan dashboard.
2. Role non-Legal: banner view-only; Party Detail tab difilter per role.

### A3. Cari Party / kontrak (BRD §6.2 / §6.11)
1. Gunakan search bar atas (Party criteria: nama, PIC, No. Agreement).
2. Atau menu **Parties** → filter Status / Odoo Link / PIC.
3. Klik baris Party → **Party Detail** (konteks utama, BRL-CMS-026).

---

## B. Kelola Party

### B1. Add New Party (BRD §6.12)
1. **Parties** → **+ Add New Party**.
2. Isi Legal Name, PIC, tanggal.
3. Sistem cek kandidat Odoo Partner (mock).
4. Simpan → Party berstatus **Draft** kontrak / **Pending Odoo Link** + notifikasi NOTIF-CMS-019.

### B2. Edit Party (BRD §6.13)
1. Party Detail → **Edit Party**.
2. Ubah contact/remarks (administratif).
3. Legal name / NPWP / address terkunci (BRL-CMS-004) — butuh validasi Odoo.
4. **Refresh / Compare Odoo** = simulasi perbandingan.

### B3. Delete / Deactivate (BRD §6.14)
1. Party Detail → **Delete / Deactivate**.
2. Party belum terpakai → boleh hard delete.
3. Party sudah terpakai → **Inactive** saja (BRL-CMS-029/030).
4. Party Inactive **tidak** muncul di pilihan Add Contract (BRL-CMS-031).

### B4. Odoo Link status (§9.5)
Lihat badge: Linked / Pending Odoo Link / Mismatch / Unlinked / Relink Required.

---

## C. Kelola kontrak di bawah Party

### C1. Add New Contract (BRD §6.3)
1. Buka **Party Detail** (bukan dashboard) → **+ Add Contract**.
2. Pilih Party Active → isi title, type, period, value → upload dokumen.
3. Review extracted metadata (mock).
4. **Simpan sebagai Draft** atau **Lanjutkan Review**.
5. Record muncul di tab **Contracts & Amendments** + audit + NOTIF-CMS-001.

Catatan: mockup alur tetap di CMS. Di produksi, pembuatan kontrak mungkin tetap di CMS atau sebagian di Odoo — UI mockup ini tetap acuan pengalaman Legal.

### C2. Edit Contract Details (BRD §6.4)
1. Tab Contracts → **Edit Contract Details**.
2. Hanya metadata administratif (PIC, tags, notes, recipients).
3. Counterparty / nilai / periode / signed doc **terkunci** (BRL-CMS-006) — pakai Change CP atau Amendment.

### C3. Review & Signature (BRD §6.5 / §9.1–9.2)
1. Tab Contracts → **Update Review Status**.
2. Alur:
   - **Draft** → Mulai Review  
   - **Under Review** → Kirim ke Counterparty  
   - **Sent to Counterparty** → Setuju → Ready for Signature **atau** Revision Required  
   - **Revision Required** → Upload revisi → Under Review  
   - **Ready for Signature** → E-Signature (envelope) **atau** Manual sign  
   - **Sent for Signature** → Fully Signed / Cancelled / Expired / Declined  
3. Manual Fully Signed: isi catatan verifikasi Legal (BRL-CMS-018).
4. Setelah Fully Signed → **Set Active (setelah SO sync)** (BRL-CMS-020).

### C4. Change Counterparty (BRD §6.6)
1. Party Detail → **Change Counterparty**.
2. Pilih Change Type, New Party, Effective Date, **Reason wajib**.
3. Aturan:
   - **Correction** hanya Draft / Under Review (BRL-CMS-008).
   - Jika **Sent for Signature** → batalkan signing dulu (BRL-CMS-009).
   - Tanpa approval internal (BRL-CMS-007).
4. Riwayat di tab **Novation / CP Change** + NOTIF-CMS-008.

### C5. Amendment / Addendum (BRD §6.7)
1. Tab Contracts → **+ Create Amendment/Addendum**.
2. Isi type, category, effective date, summary.
3. Tersimpan sebagai **Draft** linked ke parent (tidak overwrite dokumen induk, BRL-CMS-011).
4. Tanpa approval internal (BRL-CMS-012).
5. Tampil di tab Contracts & Amendments.

### C6. Early Termination (BRD §6.8)
1. Hanya kontrak **Active** (BRL-CMS-013).
2. Tab Contracts → **Early Termination** → type, tanggal efektif, reason.
3. Tanggal masa depan → status **Termination Scheduled** (kontrak tetap aktif sampai efektif, BRL-CMS-014) + NOTIF-CMS-010.
4. Tanggal hari ini/lalu → **Terminated** + NOTIF-CMS-011.
5. Riwayat di tab **Early Termination**.

### C7. Supporting Document (BRD §6.9)
1. Tab Supporting Docs → **Upload**.
2. Upload **tidak** mengubah status lifecycle (BRL-CMS-015) + NOTIF-CMS-012.
3. **Void** = remove/void dengan alasan + audit (bukan hard delete, BRL-CMS-016).

### C8. SO Synchronization (BRD §6.10 / §12.3)
1. Menu **SO Synchronization** atau tab SO di Party Detail.
2. **Run Sync Now** / **Re-sync** per party.
3. Status §9.6: Synchronized / No Active SO / In Progress / Error.
4. Tidak membuat/mengubah SO di Odoo (INT-SO-004); tidak overwrite signed document (BRL-CMS-019).

---

## D. Monitoring & compliance

### D1. Renewal Calendar
Menu **Renewal Calendar** — agenda renewal / expiry / termination effective date.

### D2. Audit Trail
Menu **Audit Trail** — semua create/edit/upload/CP/amend/term/sync/link (BRL-CMS-025).  
Filter per tipe aktivitas.

### D3. Notifikasi (BRD §13)
1. Ikon lonceng atau menu **Notifikasi**.
2. Seed mencakup NOTIF-CMS-001 s.d. 020.
3. Aksi live (add contract, review, CP, term, upload, SO, party) menambah notifikasi baru.
4. **Tandai semua dibaca** = status dibaca (list tetap ada).
5. **Pulihkan notifikasi demo** jika ingin reset seed.

---

## E. Ringkas urutan end-to-end (happy path)

```
A. Login sebagai Legal
   → B1. Add Party (Pending Odoo Link)
   → C1. Add Contract (Draft)
   → C3. Review → Sent CP → Ready → E-Sign → Fully Signed
   → C8. SO Sync → Set Active
   → C5. Amendment (jika perlu)
   → C7. Upload supporting docs
   → D2. Cek Audit Trail
   → D3. Cek Notifikasi
```

---

## Referensi cepat status (BRD §9)

| Domain | Status utama |
| --- | --- |
| Contract | Draft → Under Review → Sent to Counterparty → Revision Required → Ready for Signature → Sent for Signature → Fully Signed → Active → Expired / Termination Scheduled / Terminated / Cancelled |
| Signature | Not Started → Sent for Signature → Fully Signed / Cancelled / Expired / Declined |
| Amendment | Draft → Under Review → Ready → Waiting → Fully Signed / Cancelled |
| Termination | Draft → In Progress → Waiting → Completed / Cancelled |
| Odoo Link | Unlinked / Pending / Linked / Mismatch / Relink Required / Not Required |
| SO Sync | Not Started / In Progress / Synchronized / No Active SO / Error |
| Party | Draft / Active / Inactive / Deleted |

---

*Dokumen ini mendampingi mockup HTML. Integrasi Odoo/e-sign nyata tetap di luar scope prototype (lihat BRD §4.2).*

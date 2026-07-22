# AI Development Life Cycle (AIDLC) — DCI CMS

Siklus kerja untuk mengembangkan **Contract Management System** dengan bantuan AI (Cursor, Claude, dll.). Bukan library terpisah: **urutan baca, artefak, dan verifikasi** agar hasil konsisten dengan BRD, mockup, dan integrasi Odoo.

## Prinsip

1. **Satu sumber kebenaran per domain**
   - Bisnis / requirement → [`BRD-Contract-Management-System-v1.3.md`](./BRD-Contract-Management-System-v1.3.md)
   - UI/UX → [`../DESIGN_GUIDELINES.md`](../DESIGN_GUIDELINES.md) + [`../CMS_Mockup.html`](../CMS_Mockup.html)
   - Odoo → [`ODOO_INTEGRATION.md`](./ODOO_INTEGRATION.md) + BRD §12
   - Operasi pengguna → [`PANDUAN-OPERASIONAL-CMS.md`](./PANDUAN-OPERASIONAL-CMS.md)
2. **Party-centric** — fitur kontrak selalu tertanam di konteks Party kecuali ada keputusan produk tertulis.
3. **Odoo consume-only** untuk SO & Partner master (kecuali scope baru disepakati).
4. **Rahasia tidak masuk repo** — kredensial Odoo, e-sign, `.env`.
5. **Mockup dulu untuk UX** — perubahan alur besar sebaiknya dicerminkan di `CMS_Mockup.html` sebelum/bersamaan implementasi app.

---

## Alur fase

```text
Intake → Spec → Design → Implement → Verify & ship
```

---

## 1. Intake (ruang lingkup)

**Tujuan:** Fitur/bug jelas sebelum kode.

### Checklist

- [ ] Siapa pengguna: **Legal**, **Business**, **Finance**, **Management**, **IT**? (Counterparty/Signer biasanya eksternal)
- [ ] Menyentuh **RBAC**, **lifecycle status**, **Odoo sync/link**, atau **e-sign**?
- [ ] In scope BRD §4.1 atau malah Out of Scope §4.2?
- [ ] Must-have vs nice-to-have?

### Definition of Done

- Scope 2–5 kalimat (boleh template di bawah).
- Tidak mengasumsikan write-back Odoo SO/Partner tanpa keputusan tertulis.

---

## 2. Spec (kriteria penerimaan)

### Checklist

- [ ] Acceptance criteria (given/when/then ringkas).
- [ ] Status BRD §9 yang terlibat (contract / signature / amendment / termination / odoo link / SO).
- [ ] Business rule terkait (BRL-CMS-xxx / FR-xxx) disebut.
- [ ] Dampak per role eksplisit (hide vs view-only vs edit).

### Definition of Done

- Setiap criterion bisa diuji manual di mockup atau app.
- Field sensitif vs administrative dibedakan (BRL-CMS-006 / 004).

---

## 3. Design (arsitektur & UI)

### Baca (urutan)

1. UI → `DESIGN_GUIDELINES.md` + pola di `CMS_Mockup.html`
2. Proses → BRD §6 terkait + `PANDUAN-OPERASIONAL-CMS.md`
3. Integrasi → `ODOO_INTEGRATION.md` + BRD §12
4. Notifikasi → BRD §13 bila ada event baru

### Checklist

- [ ] UI token ink/brass; status pill kosakata BRD
- [ ] Party Detail tetap konteks utama bila menyentuh kontrak
- [ ] Menu/aksi sesuai RBAC (hide jika tidak berhak lihat)
- [ ] Tidak menambah approval workflow internal untuk CP/Amendment/Termination

### Definition of Done

- Tidak bertentangan dengan DESIGN_GUIDELINES / BRD kecuali keputusan produk tertulis.

---

## 4. Implement

### Checklist

- [ ] Hormati BRL (contoh: Correction hanya Draft/Under Review; Termination hanya Active; supporting upload tidak ubah lifecycle)
- [ ] Audit trail untuk aksi material (BRL-CMS-025)
- [ ] Notifikasi event sesuai NOTIF-CMS-xxx bila relevan
- [ ] SO sync tidak overwrite signed document (BRL-CMS-019)
- [ ] Diff fokus pada scope; tidak refactor luas tanpa kebutuhan
- [ ] Update mockup **atau** docs bila perilaku user-facing berubah

### Definition of Done

- Kode/mockup selaras acceptance criteria; secrets tidak ter-commit.

---

## 5. Verify & ship

### Checklist

- [ ] Uji happy path sesuai `PANDUAN-OPERASIONAL-CMS.md` untuk role terkait
- [ ] Uji negatif: view-only tidak bisa create; Inactive party tidak dipilih kontrak baru
- [ ] Uji Odoo path: link status + SO sync status tertampil benar
- [ ] Regresi: Party Detail tabs & audit masih konsisten

### Definition of Done

- Kriteria penerimaan dicentang; catatan residual (ilustratif vs production) jelas.

---

## Template tiket singkat

```text
Judul:
Role terdampak:
BRD ref (FR/BRL/NOTIF/INT):
Acceptance:
- Given …
- When …
- Then …
Odoo impact: none | Party link | SO sync (read) | other:
Out of scope confirm:
```

---

## Referensi cepat Out of Scope (§4.2)

Jangan implement tanpa keputusan baru: auto-create Odoo Partner, approval Legal internal untuk CP/Amend/Term, clause negotiation AI, template drafting penuh, legal advice scoring, SO write-back, invoice/AR-AP, e-sign commercial setup, bulk migration historis, BI prediktif eksternal.

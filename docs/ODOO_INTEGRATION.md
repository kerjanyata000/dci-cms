# Odoo Integration — Contract Management System

Landasan teknis/bisnis untuk menyambungkan CMS ke **Odoo**. Detail requirement: BRD §12 + §6.10 + §6.11.

CMS adalah sistem **party-centric** yang **mengonsumsi** data Odoo untuk validasi Party dan sinkronisasi Sales Order — bukan pengganti modul Sales/Accounting Odoo.

---

## 1. Batas tanggung jawab

| CMS boleh | CMS tidak boleh (default BRD) |
| --- | --- |
| Link / relink CMS Party ↔ Odoo Partner | Auto-create / update / delete Odoo Partner master |
| Bandingkan data CMS vs Partner (mismatch) | Create / amend / cancel / approve Sales Order |
| Inquiry SO aktif terkait Party/Partner + kontrak | Posting invoice, payment, AR/AP, accounting |
| Update **ringkasan CMS** (SO list, expiry hint, flag No Active SO) | Overwrite signed contract document / original contract data |
| Catat hasil sync + error di audit / integration log | Mengganti Legal review / e-sign provider admin komersial |

Referensi: INT-SO-004, INT-PTY-005, BR-CMS-020, Out of Scope §4.2.

---

## 2. Integrasi A — Party ↔ Odoo Partner (INT-PTY)

### Tujuan

Menjaga konsistensi master counterparty antara CMS dan Odoo.

### Status (BRD §9.5)

`Unlinked` | `Pending Odoo Link` | `Linked` | `Mismatch` | `Relink Required` | `Not Required`

### Alur tipikal

1. User Create/Edit Party atau buka Party Detail.
2. CMS inquiry Partner di Odoo by name / NPWP / customer-vendor code (identifier disepakati).
3. Tampilkan **comparison** sebelum link/relink.
4. Exact match → konfirmasi → `Linked` + simpan Odoo Partner ID.
5. No / multiple / mismatch → `Pending` atau `Mismatch`; user resolve.
6. Relink wajib **reason + audit** (BRL-CMS-022).

### Aturan

- Mapping di **Party level**, bukan Contract level (BRL-CMS-021).
- Field sensitif (legal name, NPWP, address) controlled vs Odoo (BRL-CMS-004).

---

## 3. Integrasi B — Sales Order sync (INT-SO)

### Tujuan

Setelah kontrak **Fully Signed** / **Active**, tarik SO relevan untuk aktivasi monitoring & renewal.

### Status (BRD §9.6)

`Not Started` | `In Progress` | `Synchronized` | `No Active SO / Renewal Not Found` | `Error`

### Trigger

- Event: kontrak menjadi Fully Signed (FR-CNT-SO-001).
- Batch scheduler untuk kontrak Active (INT-SO-002).
- Manual “Run Sync” oleh role yang diizinkan (Legal Admin / IT).

### Matching (disepakati implementasi)

Gunakan kombinasi yang tersedia: **Odoo Partner ID**, contract reference, identifier lain yang disetujui bisnis.

### Efek di CMS

- Update linked SO list + last sync timestamp.
- Fully Signed → boleh jadi **Active** jika syarat SO/aktivasi terpenuhi (BRL-CMS-020).
- Tidak ketemu SO aktif → flag **No Active SO / Renewal Not Found** + notifikasi NOTIF-CMS-014.
- Error → NOTIF-CMS-015 (IT / Legal Admin); jangan silent fail.

### Larangan

- Jangan ubah signed PDF / original contract fields dari hasil sync (BRL-CMS-019).

---

## 4. Integrasi C — Notifikasi delivery (INT-NOTIF)

Preferensi BRD: Odoo inbox/activity dan/atau email.  
Mockup HTML memakai in-app list sebagai simulasi; produksi harus mengikat channel yang disepakati tanpa mengubah **isi event** NOTIF-CMS-001…020.

---

## 4b. Document extraction / smart search (bukan modul Partner/SO)

BRD §12.2 meminta **extraction/indexing** + **smart search**. Ini **bukan** fitur bawaan `res.partner` / `sale.order`.

| Lapisan | Peran |
| --- | --- |
| Odoo Document Digitization (IAP) | OCR untuk **invoice / expense / resume** — jangan andalkan untuk MSA/kontrak legal CMS |
| CMS + Supabase | Vault file, dual metadata, rule validasi, RBAC pada search |
| RAGFlow | Parse / chunk / embed / retrieve untuk ekstraksi + smart search |

Persiapan: [`PREP-EKSTRAKSI-RAGFLOW.md`](./PREP-EKSTRAKSI-RAGFLOW.md), [`CHECKLIST-ODOO-TRIAL-DAN-AI.md`](./CHECKLIST-ODOO-TRIAL-DAN-AI.md).

---

## 5. Integrasi D — E-Sign (INT-ESIGN) — terkait Odoo secara longgar

E-sign biasanya provider eksternal (bukan modul Odoo wajib). CMS:

- Buat envelope, terima webhook status, simpan signed doc + evidence.
- Resend setelah cancelled/expired/need-action.

Commercial setup provider = out of scope CMS.

---

## 6. Keamanan & konfigurasi

- Kredensial Odoo (URL, DB, user/API key) hanya di environment / secret store.
- Akses sync dibatasi role (Legal / IT) sesuai RBAC.
- Semua link/relink/sync masuk audit trail (BRL-CMS-025).

---

## 7. Checklist implementasi fitur Odoo

- [ ] Endpoint/inquiry read-only ke Partner & SO terdokumentasi
- [ ] Status enum selaras §9.5 / §9.6
- [ ] UI comparison sebelum link
- [ ] Error path + notifikasi
- [ ] Tidak ada write SO/Partner master
- [ ] Test: Linked, Pending, Mismatch, Synchronized, No Active SO, Error

---

## 8. Referensi

- BRD §6.10, §6.11, §8.10, §8.11, §12.3, §12.4
- Mockup: view **SO Synchronization**, Party tab SO, Odoo link pills
- Panduan: `PANDUAN-OPERASIONAL-CMS.md` bagian C8 & B4
- Dokumen resmi Odoo:
  - [External API (XML-RPC)](https://www.odoo.com/documentation/18.0/developer/reference/external_api.html)
  - [Web Services howto](https://www.odoo.com/documentation/18.0/developer/howtos/web_services.html)
  - [External JSON-2 API (Odoo 19+)](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html)

---

## 9. Konsep: mockup vs aplikasi nyata vs Odoo

```text
┌─────────────────────┐         baca / link          ┌──────────────────────────┐
│  CMS (aplikasi)     │  ←── Partner, SO (API) ────  │  Odoo                    │
│  - Party + kontrak  │         OdooClient           │  - res.partner (Contact) │
│  - dokumen legal    │  ─── tidak create SO ───✗    │  - sale.order (Sales)    │
└─────────────────────┘                              └──────────────────────────┘
         ▲
         │ sekarang
┌────────┴────────────┐
│ CMS_Mockup.html     │  ODOO_MODE = 'dummy'
│ OdooClient adapter  │  bentuk search_read sama → ganti ke live nanti
└─────────────────────┘
```

Di `CMS_Mockup.html` ada objek **`OdooClient`** + data **`ODOO_DUMMY`** (bentuk mirip `search_read` Odoo).  
SO Monitor & pencarian Partner di Add/Edit Party memakai adapter ini. Ganti `ODOO_MODE` / isi TODO `live` saat backend siap — UI tidak perlu dirombak.

---

## 10. Cara menyambung instance Odoo Anda (praktis)

### 10.1 Yang Anda butuhkan

| Item | Contoh | Keterangan |
| --- | --- | --- |
| URL | `https://namaanda.odoo.com` atau `http://localhost:8069` | Alamat instance |
| Database name | sering = subdomain (mis. `namaanda`) | Di Odoo Online biasanya nama instance |
| Login | email user admin/integrasi | User yang punya akses Contacts & Sales |
| Password **atau API Key** | API Key lebih aman | Preferences → Account Security → New API Key |

Dokumen resmi: [External API — Connection](https://www.odoo.com/documentation/18.0/developer/reference/external_api.html).

### 10.2 Penting: paket Odoo Online “gratis”

Menurut dokumentasi resmi Odoo 18:

> *Access to data via the external API is only available on **Custom** Odoo pricing plans. Access to the external API is **not** available on **One App Free** or **Standard** plans.*

Jadi jika instance gratis Anda adalah **Odoo Online One App Free / Standard**, API eksternal sering **diblok**. Opsi:

1. **Odoo Community self-hosted** (Docker/VPS/lokal) — API XML-RPC biasanya tersedia.
2. Naik plan yang mengizinkan External API (Custom), atau tanya Odoo CS.
3. Sementara develop: pakai [demo.odoo.com](https://demo.odoo.com) (lihat docs resmi “Test database”) atau lokal Community.

### 10.3 Setup di Odoo Online (jika API diizinkan)

1. Login admin → **Settings → Users & Companies → Users**.
2. Pilih user integrasi → **Action → Change Password** (wajib di Odoo Online; user sering tanpa local password).
3. **My Profile / Preferences → Account Security → New API Key** — simpan key (tidak bisa dilihat lagi).
4. Pastikan app **Contacts** terpasang (model `res.partner`).
5. Untuk SO sync: app **Sales** terpasang (model `sale.order`).

### 10.4 Model Odoo yang dipakai CMS

| Kebutuhan CMS | Model Odoo | Operasi CMS |
| --- | --- | --- |
| Cari / bandingkan Party | `res.partner` | `search_read` (name, vat/NPWP, ref, …) |
| Simpan link | — (di DB CMS) | Simpan `odoo_partner_id` + status Linked/Mismatch |
| Sync SO | `sale.order` | `search_read` by `partner_id` (+ filter status/periode) |

CMS **tidak** memanggil `create`/`write` pada `sale.order` (BRD). `create` Partner di Odoo juga **out of scope** default.

### 10.5 Contoh minimal: baca Contacts (Python)

Sesuai pola resmi XML-RPC:

```python
import xmlrpc.client

url = "https://YOUR.odoo.com"   # atau http://localhost:8069
db = "YOUR_DB"
username = "you@company.com"
api_key = "YOUR_API_KEY"        # ganti password

common = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common")
print(common.version())         # tes koneksi
uid = common.authenticate(db, username, api_key, {})
assert uid, "login gagal — cek URL/db/user/key atau apakah plan mengizinkan API"

models = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/object")
partners = models.execute_kw(
    db, uid, api_key,
    "res.partner", "search_read",
    [[["is_company", "=", True]]],
    {"fields": ["name", "vat", "ref", "email"], "limit": 10},
)
print(partners)
```

Untuk SO:

```python
orders = models.execute_kw(
    db, uid, api_key,
    "sale.order", "search_read",
    [[["partner_id", "=", PARTNER_ID], ["state", "in", ["sale", "done"]]]],
    {"fields": ["name", "partner_id", "date_order", "state", "amount_total"], "limit": 20},
)
```

### 10.6 Checklist sebelum wiring ke CMS

- [ ] Bisa `common.version()` tanpa error
- [ ] `authenticate` mengembalikan `uid`
- [ ] `res.partner` `search_read` berhasil
- [ ] (Opsional) `sale.order` terbaca
- [ ] Kredensial hanya di `.env` — jangan commit
- [ ] Keputusan: instance Online free **punya** External API atau pindah Community/lokal

### 10.7 Langkah proyek berikutnya (setelah mockup)

1. Simpan `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_API_KEY` di env.
2. Backend CMS: service `OdooClient` (authenticate + search_read).
3. Fitur UI: **Link Party** memanggil pencarian `res.partner` nyata.
4. Fitur UI: **SO Sync** memanggil `sale.order` nyata; tulis hasil ke CMS + audit.
5. Mockup tetap jadi referensi UX; data live diganti dari API.
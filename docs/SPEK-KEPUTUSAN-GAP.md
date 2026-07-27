# Spek kecil & keputusan tertunda

Setelah Must/Should selesai. Dokumen ini merinci: (1) yang sudah digarap, (2) spek kecil yang masih perlu disepakati sebelum coding, (3) yang tunggu keputusan produk/vendor.

---

## 1. Sudah digarap (bisa dipakai sekarang)

| Item | Perilaku |
| --- | --- |
| **Cek duplikat Party** | Create/Edit ditolak jika nama (normalized) atau NPWP (digit-only) sudah ada party lain |
| **Hard delete Party** | Tombol **Hapus Party** di Edit Party hanya jika unused (0 kontrak/dokumen/SO/AMD/term/CP history). Kalau terpakai → wajib Nonaktifkan |
| **Filter Parties** | Cari nama / kode / NPWP / Odoo ID; filter Party Active/Inactive + filter kontrak + Odoo link + PIC |
| **Mockup alignment** | Banner Mockup↔App; dossier actions = Add Contract / Edit Party / Link Odoo (Change CP tetap di aksi baris kontrak seperti app) |

---

## 2. Spek kecil — siap coding setelah jawaban singkat

Ini **bukan** tunggu vendor; tinggal isi kotak keputusan bisnis (1–2 kalimat).

### S-A. Auto Active setelah SO sync

| Field | Isi yang perlu |
| --- | --- |
| Trigger | Setelah Run Sync: jika ada SO `sale`/`done` untuk party? Atau hanya setelah Fully Signed? |
| Aksi | Otomatis set kontrak `active`, atau cukup **usulkan** (banner “Mark Active”)? |
| Multi-kontrak | Jika party punya >1 Fully Signed: aktifkan semua / hanya yang paling baru / pilih Legal? |
| Fallback | Jika sync 0 SO: tetap Fully Signed + flag No Active SO (sudah ada) |

**Default usulan teknis (jika tidak dijawab):** jangan auto; tetap prompt/banner Mark Active (Legal klik).

### S-B. Update expiry / renewal dari SO

| Field | Isi yang perlu |
| --- | --- |
| Sumber field Odoo | `date_order`? custom `x_end_date`? line `subscription`? |
| Arah update | Tulis ke `contracts.expiry_date` / `renewal_date`? |
| Konflik | Jika CMS sudah punya expiry manual — overwrite / skip / max(date)? |
| Scope | Hanya kontrak Fully Signed/Active yang linked partner? |

**Default usulan:** jangan overwrite otomatis; tampilkan SO dates sebagai **referensi** di tab SO sampai spek field Odoo final.

### S-C. NOTIF SO sync success lebih eksplisit

| Field | Isi |
| --- | --- |
| Kapan | Setiap Run Sync sukses, atau hanya jika `ordersUpserted > 0`? |
| Urgent | Tidak (info saja) |
| Kode | NOTIF-CMS-013 |

**Default usulan:** push in-app item “SO Sync OK — N order” bila upsert > 0. Bisa dikerjakan tanpa spek panjang.

### S-D. Filter Smart Search lebih kaya

| Field | Isi |
| --- | --- |
| Kriteria tambahan | NPWP, Odoo Partner ID, related SO name, date range? |
| Scope | Hanya Parties list (sudah) vs juga `/search`? |

**Default usulan:** perluas `/api/search` mirror filter Parties (q → name/code/npwp) dulu; SO name menyusul.

### S-E. Document version history

| Field | Isi |
| --- | --- |
| Apa di-version | Draft upload berulang? Signed PDF? Supporting? |
| UI | List versi di Review Contract vs tab Documents |
| Retensi | Simpan semua / last N |

**Default usulan:** v1 = list dokumen per kontrak berurutan `created_at` (sudah hampir ada); “version number” formal = spek terpisah.

### S-F. Batch cron SO + expiry

| Field | Isi |
| --- | --- |
| Jadwal | Harian jam berapa (WIB)? |
| Host | Vercel Cron / worker eksternal / Supabase scheduled? |
| Scope | Semua party linked, atau hanya Active/Fully Signed? |
| Lifecycle | Cron juga panggil `applyDueLifecycleUpdates()` global? |

**Default usulan:** 1× sehari 06:00 WIB, party linked + status active/fully_signed/signed; + lifecycle global. Butuh **keputusan host deploy** (lihat §3).

---

## 3. Tunggu keputusan (jangan coding penuh dulu)

### D-1. E-sign provider

| Pertanyaan | Pilihan contoh |
| --- | --- |
| Provider? | DocuSign / Privy / Adobe Sign / lain |
| Commercial setup selesai? | Ya/Tidak (§4.2 — lisensi di luar CMS) |
| Siapa signer sequence? | Internal only / CP only / both |
| Webhook URL env? | Staging + prod |
| Fallback jika provider down? | Manual upload signed tetap (sudah ada) |

**Blocked sampai:** nama provider + API credentials + urutan signer.

**Yang ikut blocked:** NOTIF 005/007, signature status §9.2, FR-CNT-RVW-007…011, termination signing via e-sign.

### D-2. Delivery notifikasi (email / Odoo)

| Pertanyaan | Pilihan |
| --- | --- |
| Channel? | Email SMTP saja / Odoo activity saja / keduanya / in-app only (status quo) |
| SMTP? | Provider, from-address, template HTML? |
| Odoo activity? | Model `mail.activity` ke user mana (PIC Legal)? |
| Opt-out? | Preferensi per user (mockup sudah demo checkbox) |

**Blocked sampai:** channel + kredensial.

### D-3. Sync Odoo Documents → vault CMS

| Pertanyaan | Jawaban |
| --- | --- |
| Apakah dibutuhkan? | Default BRD: **tidak** (vault = Supabase upload) |
| Folder Odoo mana? | Path / Documents workspace ID |
| Arah sync? | One-way Odoo→CMS / bidirectional |
| Konflik file? | Rename / skip / overwrite |

**Blocked sampai:** product bilang “ya, sync Documents”.

### D-4. CMS “di dalam Odoo” (BR-001 literal)

| Pertanyaan | Status |
| --- | --- |
| Tetap Next.js standalone? | **Sudah keputusan arsitektur** — dokumentasikan sebagai intentional Partial vs BRD wording |
| Embed iframe di Odoo? | Opsional kemudian — bukan blocker fitur |

---

## 4. Urutan saran kerja berikutnya

1. **S-C** NOTIF SO success (kecil, tanpa keputusan)  
2. **S-D** perluas search API mirror filter  
3. Jawab **S-A / S-B** → baru coding auto Active / expiry  
4. Jawab **D-2** → email delivery  
5. Jawab **D-1** → e-sign sprint  
6. Jawab **S-F** host → batch cron  

---

## 5. Mockup vs App (ringkas)

| Area | App (sumber kebenaran) | Mockup |
| --- | --- | --- |
| Party dossier actions | Add Contract, Edit Party, Link Odoo | Diselaraskan |
| Change CP / AMD / Term | Aksi per baris kontrak | Tetap di mockup via baris / modal |
| Edit Party | NPWP, alamat, tipe, kontak, Nonaktifkan, Hapus jika unused | Edit + Deactivate sudah; Hapus unused = app |
| Review | Revision Required + prompt SO Sync | Ada Revision; SO Sync prompt = app |
| Supporting | Void | Ada di mockup |
| Filter Parties | nama/kode/NPWP/Odoo + Party Active | Ditambah filter Party status + search NPWP |

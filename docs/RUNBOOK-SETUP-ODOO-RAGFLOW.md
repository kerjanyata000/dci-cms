# Runbook — Setup integrasi Odoo + RAGFlow (POC → Live)

Catatan operasional untuk tim: langkah yang sudah dilakukan saat wiring POC, dan checklist sebelum **go-live** production.

> **Jangan commit** file `web/.env.local` atau API key ke git. Runbook ini hanya placeholder.

---

## Ringkasan arsitektur

```text
Browser (CMS Next.js — web/)
  │
  ├─► /api/odoo/*     ──► Odoo Online (Partner + SO, read-only)
  ├─► /api/ragflow/*  ──► RAGFlow self-host (parse / extract / retrieve)
  └─► Supabase        ──► parties, contracts, documents (fondasi DB — lanjutan)

Odoo     = master Partner + Sales Order (consume-only)
RAGFlow  = parse PDF, chunk, embed, smart search
Supabase = vault file + metadata + link ID ke Odoo/RAGFlow
```

Referensi batas integrasi: [`ODOO_INTEGRATION.md`](./ODOO_INTEGRATION.md), [`PREP-EKSTRAKSI-RAGFLOW.md`](./PREP-EKSTRAKSI-RAGFLOW.md).

---

## Bagian A — Odoo (API key & env)

### A.1 Di mana API Odoo dibuat?

**Bukan** di Settings → General Settings. API key ada di **profil user**:

1. Klik avatar/nama kanan atas → **Preferences** / **My Profile**
2. Tab **Account Security**
3. **API Keys** → **New API Key**
4. Copy key sekali (tidak bisa dilihat lagi)

Alternatif: **Settings → Users & Companies → Users** → pilih user integrasi → **Account Security → API Keys**.

### A.2 Data yang dicatat

| Variabel env | Contoh | Catatan |
| --- | --- | --- |
| `ODOO_URL` | `https://tenos-data-teknologi.odoo.com` | **Tanpa** `/odoo` di akhir |
| `ODOO_DB` | `tenos-data-teknologi` | Biasanya = subdomain Odoo Online |
| `ODOO_USERNAME` | email login integrasi | User dengan akses Contacts + Sales |
| `ODOO_API_KEY` | `(secret)` | Ganti password saat connect API |

### A.3 App Odoo wajib terpasang

- **Contacts** → model `res.partner`
- **Sales** → model `sale.order`

### A.4 Env CMS (`web/.env.local`)

```env
NEXT_PUBLIC_ODOO_MODE=live

ODOO_URL=https://YOUR_INSTANCE.odoo.com
ODOO_DB=your-db-name
ODOO_USERNAME=you@company.com
ODOO_API_KEY=your-odoo-api-key
```

Variabel `ODOO_*` **tanpa** prefix `NEXT_PUBLIC_` — hanya dibaca server (API routes).

### A.5 Tes Odoo sebelum lanjut

**Dari server/laptop (Python):**

```python
import xmlrpc.client

url = "https://YOUR_INSTANCE.odoo.com"
db = "your-db-name"
username = "you@company.com"
api_key = "YOUR_API_KEY"

common = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common")
print("version:", common.version())

uid = common.authenticate(db, username, api_key, {})
print("uid:", uid)  # harus angka, bukan False
```

**Dari CMS (dev server jalan):**

| URL | Harus |
| --- | --- |
| `http://localhost:3000/api/odoo/health` | `"ok": true` + uid |
| `http://localhost:3000/parties` → Search Partners | List partner Odoo |

### A.6 Troubleshooting Odoo

| Gejala | Penyebab | Tindakan |
| --- | --- | --- |
| `uid: False` | URL/db/email/key salah | Cek `.env.local` |
| Forbidden / access denied | Plan Odoo blok External API | Upgrade plan atau Community self-host |
| URL dengan `/odoo` | Salah format | Hapus `/odoo` dari `ODOO_URL` |

Dokumen resmi: [Odoo External API](https://www.odoo.com/documentation/18.0/developer/reference/external_api.html).

---

## Bagian B — RAGFlow self-host (Docker di VPS)

### B.1 Lokasi & command

Semua command Docker di folder **`docker`** dalam clone RAGFlow:

```bash
cd /opt/ragflow/docker
git clone https://github.com/infiniflow/ragflow.git   # sekali saja
cd /opt/ragflow/docker
git checkout v0.26.4   # atau tag stable terbaru — lihat GitHub Releases

docker compose pull
docker compose up -d
docker compose ps
```

### B.2 Port — jangan tertukar

| Port (host) | Env variable | Fungsi |
| --- | --- | --- |
| **8080** (atau 18080) | `SVR_WEB_HTTP_PORT` | **UI browser** (register, dataset, API key) |
| **9380** | `SVR_HTTP_PORT` | **API** — dipakai CMS |
| 9381 | `ADMIN_SVR_HTTP_PORT` | Admin API internal |
| 80 / 443 | `SVR_WEB_HTTP_*` | Sering bentrok dengan Nginx — **jangan pakai** kalau server sudah ada web server |

Contoh `.env` di `/opt/ragflow/docker/.env` (POC):

```env
SVR_WEB_HTTP_PORT=8080
SVR_WEB_HTTPS_PORT=9443
SVR_HTTP_PORT=9380
```

Jika error `address already in use` pada 80/443/8443 → ganti ke port tinggi (8080, 9443, 18080).

### B.3 Firewall VPS

```bash
ufw allow 8080/tcp   # UI (sementara; production lewat Nginx)
ufw allow 9380/tcp   # API (batasi ke IP CMS saat live)
```

### B.4 Setup pertama di UI

1. Buka `http://IP_SERVER:8080` (bukan 9380)
2. Register admin
3. **Settings → API Keys** → buat key
4. **Knowledge Base** → create dataset (mis. `dci-cms-test`)
5. Copy **Dataset UUID** dari URL, contoh:

```text
http://IP_SERVER:8080/dataset/files/de38b902866d11f1b8f3cbb3185f07ba
                                    └──────────── UUID dataset ────────────┘
```

**UUID ≠ nama dataset.** API selalu pakai ID hex ~32 karakter.

### B.5 Tes RAGFlow

| URL | Hasil |
| --- | --- |
| `http://IP_SERVER:9380/` | JSON 404 di `/` → **normal** (bukan UI) |
| `http://IP_SERVER:9380/api/v1/system/healthz` | `{"status":"ok","db":"ok",...}` |
| `http://IP_SERVER:8080` | Halaman login RAGFlow |

Referensi API: [RAGFlow HTTP API](https://ragflow.io/docs/http_api_reference).

---

## Bagian C — Wiring CMS (Next.js)

### C.1 Jalankan app dari folder `web/`

```powershell
cd web
npm install
npm run dev
```

**Jangan** `npm run dev` dari root repo `dci-cms/` — tidak ada `package.json` di sana.

### C.2 Env RAGFlow di `web/.env.local`

```env
NEXT_PUBLIC_RAGFLOW_MODE=live
NEXT_PUBLIC_RAGFLOW_DATASET_ID=<uuid-dataset>

RAGFLOW_URL=http://IP_SERVER:9380
RAGFLOW_API_KEY=ragflow-xxxxxxxx
RAGFLOW_DATASET_ID=<uuid-dataset>
```

| ❌ Salah | ✅ Benar |
| --- | --- |
| `RAGFLOW_URL=...:8080` | `RAGFLOW_URL=...:9380` |
| `RAGFLOW_DATASET_ID=cms-contracts` (nama) | UUID dari UI |
| API key di `NEXT_PUBLIC_*` | Hanya di server env |

Restart dev server setelah ubah `.env.local`.

### C.3 API routes CMS (sudah diimplementasi)

| Route | Fungsi |
| --- | --- |
| `GET /api/odoo/health` | Tes koneksi Odoo |
| `POST /api/odoo/partners/search` | Cari `res.partner` |
| `POST /api/odoo/orders/search` | Cari `sale.order` |
| `GET /api/ragflow/health` | Tes koneksi + list dataset |
| `POST /api/ragflow/upload` | Upload dokumen |
| `POST /api/ragflow/extract` | Parse + extract metadata |
| `POST /api/ragflow/retrieve` | Smart search |

Kode server: `web/src/lib/odoo/server.ts`, `web/src/lib/ragflow/server.ts`.

### C.4 Halaman uji di CMS

| Halaman | URL | Uji |
| --- | --- | --- |
| Parties | `/parties` | List Supabase + Add Party + Link Odoo |
| SO Health | `/so` | Load SO |
| Extraction Lab | `/lab/extraction` | Upload PDF → extract → retrieve |

### C.5 Supabase Parties (server API)

Parties CRUD memakai **service role** di server (auth CMS belum Supabase Auth):

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Ambil dari: Supabase Dashboard → **Project Settings → API → service_role** (secret).

Jalankan migration tambahan: [`../supabase/migrations/002_parties_write_policies.sql`](../supabase/migrations/002_parties_write_policies.sql)

API routes: `GET/POST /api/parties`, `POST /api/parties/[id]/link-odoo`

---

## Bagian D — Supabase & hubungan antar sistem

Saat POC ini, **Supabase env sudah terisi** tetapi persist upload/kontrak ke DB **belum** fully di UI.

| Sistem | Peran | Link ke CMS |
| --- | --- | --- |
| **Supabase** | `parties`, `contracts`, `documents`, Storage `contracts` | `parties.odoo_partner_id`, `documents.ragflow_doc_id` |
| **Odoo** | Master Partner + SO | Dibaca via API; disimpan ID di Supabase |
| **RAGFlow** | Parse/chunk/embed | `documents.ragflow_dataset_id` + `ragflow_doc_id` |

Skema awal: [`../supabase/migrations/001_initial.sql`](../supabase/migrations/001_initial.sql).

Langkah Supabase berikutnya (pre-live):

- [ ] Jalankan migration SQL
- [ ] Bucket Storage `contracts` (private)
- [ ] Auth + `profiles.role`
- [ ] Simpan hasil extract ke `documents` / `contracts`

---

## Checklist — POC selesai (status saat runbook ini ditulis)

- [x] Odoo API key dibuat & authenticate sukses
- [x] CMS `/api/odoo/health` OK
- [x] Parties / SO load data Odoo live
- [x] RAGFlow Docker jalan di VPS (`docker compose ps` semua Up)
- [x] Port UI (8080) vs API (9380) dipahami & dikonfigurasi
- [x] Dataset UUID + API key RAGFlow
- [x] CMS `/api/ragflow/health` OK
- [x] Extraction Lab upload PDF (uji pipeline)

---

## Checklist — sebelum go-live production

### Keamanan

- [ ] Rotate API key Odoo & RAGFlow (jangan pakai key POC yang pernah ter-share)
- [ ] `.env.local` / secrets hanya di server/CI secret store — **tidak di git**
- [ ] RAGFlow: tutup port 8080/9380 publik; akses API via Nginx + HTTPS + allowlist IP CMS
- [ ] Supabase RLS diperketat per role (bukan policy starter saja)

### Infrastruktur

- [ ] Domain + SSL untuk RAGFlow (mis. `https://ragflow.perusahaan.com`)
- [ ] Domain + SSL untuk CMS
- [ ] Backup: volume Docker RAGFlow (`mysql_data`, `esdata01`, `minio_data`)
- [ ] Monitoring: healthz RAGFlow + `/api/odoo/health` + uptime CMS

### Odoo production

- [ ] User integrasi dedicated (bukan admin personal)
- [ ] API key dengan rotasi terjadwal
- [ ] Konfirmasi plan mengizinkan External API
- [ ] Data Partner/SO production — bukan seed trial saja

### RAGFlow production

- [ ] Dataset terpisah per environment (dev/staging/prod)
- [ ] Embedding model dikonfigurasi & diuji untuk PDF kontrak Indonesia
- [ ] Timeout parse dokumen besar (>100 halaman) diuji
- [ ] Mapping field extract → `ContractMetadata` didokumentasikan

### CMS / Supabase

- [ ] Migration + bucket di production project Supabase
- [ ] Upload PDF → Storage + row `documents`
- [ ] Dual metadata: `extracted_metadata` / `confirmed_metadata`
- [ ] Link Party ↔ Odoo dengan audit trail
- [ ] SO sync batch + status §9.6 BRD
- [ ] RBAC hide vs view-only

---

## Troubleshooting cepat

| Error | Penyebab | Fix |
| --- | --- | --- |
| `RAGFlow HTTP 200` di `/api/ragflow/health` | `RAGFLOW_URL` pakai port UI (8080) atau healthz format beda | Pakai port **9380**; update kode server (sudah diperbaiki di repo) |
| `npm ENOENT package.json` | Dev di root repo | `cd web` lalu `npm run dev` |
| Docker port 80/8443 in use | Nginx/Apache di VPS | Ubah `SVR_WEB_HTTP_PORT` / `SVR_WEB_HTTPS_PORT` |
| `404` di `http://IP:9380/` | Normal — bukan UI | Buka `:8080` untuk UI, `:9380` untuk API |
| Partner search kosong | Domain Odoo salah / belum ada data | Cek env + buat contact di Odoo |

---

## Referensi file di repo

| File | Isi |
| --- | --- |
| [`web/.env.example`](../web/.env.example) | Template env CMS |
| [`web/README.md`](../web/README.md) | Cara run app |
| [`ODOO_INTEGRATION.md`](./ODOO_INTEGRATION.md) | Batas integrasi Odoo |
| [`CHECKLIST-ODOO-TRIAL-DAN-AI.md`](./CHECKLIST-ODOO-TRIAL-DAN-AI.md) | Seed data trial |
| [`PREP-EKSTRAKSI-RAGFLOW.md`](./PREP-EKSTRAKSI-RAGFLOW.md) | Alur ekstraksi + Supabase |

---

## Catatan versi POC (2026-07-23)

| Item | Nilai POC (ganti saat live) |
| --- | --- |
| Odoo instance | `tenos-data-teknologi.odoo.com` |
| RAGFlow host | VPS self-host (Docker) |
| RAGFlow UI port | `8080` |
| RAGFlow API port | `9380` |
| CMS dev | `localhost:3000` |
| Mode integrasi | `NEXT_PUBLIC_ODOO_MODE=live`, `NEXT_PUBLIC_RAGFLOW_MODE=live` |

*Update baris tabel ini saat pindah ke environment production.*

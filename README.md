# SI-KONI Aceh — Sistem Informasi Manajemen Keolahragaan

Sistem manajemen data terpusat untuk **Komite Olahraga Nasional Indonesia (KONI) Provinsi Aceh**. Mengelola data atlet, prestasi, cabang olahraga, kepengurusan (SK), dan dashboard analitik dengan sistem multi-peran (Super Admin + 23 Admin Wilayah).

**Repo:** https://github.com/halimelsaputra/sistem-manajemen-koni.git
**Produksi:** https://sistem-manajemen-koni.vercel.app

---

## 📑 Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder](#3-struktur-folder)
4. [Panduan Setup & Menjalankan](#4-panduan-setup-menjalankan)
5. [Environment Variables](#5-environment-variables)
6. [Database Schema](#6-database-schema)
7. [Migrasi Database](#7-migrasi-database)
8. [Sistem Autentikasi & Otorisasi](#8-sistem-autentikasi-otorisasi)
9. [API Endpoints](#9-api-endpoints)
10. [Fitur Frontend](#10-fitur-frontend)
11. [Akun Admin & Hak Akses](#11-akun-admin-hak-akses)
12. [Fitur-Fitur Utama](#12-fitur-fitur-utama)
13. [Deployment](#13-deployment)
14. [Arsitektur Keamanan](#14-arsitektur-keamanan)
15. [Panduan untuk AI / Developer Baru](#15-panduan-untuk-ai-developer-baru)

---

## 1. Arsitektur Sistem

Sistem ini menggunakan arsitektur **monorepo dua aplikasi Next.js** yang berjalan secara terpisah:

```
┌─────────────────────────────────────────────────────────┐
│                     User's Browser                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Frontend (Next.js, port 3000)                          │
│  ├─ /app       → Halaman-halaman (Dashboard, Athletes)  │
│  ├─ /components → Komponen reusable                      │
│  └─ next.config.ts → Rewrite proxy /api/* → backend      │
└──────────────────────┬──────────────────────────────────┘
                       │ /api/* (rewrite proxy)
┌──────────────────────▼──────────────────────────────────┐
│  Backend (Next.js API-only, port 3001)                  │
│  ├─ /app/api    → Route handlers (REST)                 │
│  ├─ /repositories → Query Supabase                      │
│  ├─ /services    → Business logic                       │
│  ├─ /lib         → Auth, Supabase client, helpers       │
│  └─ middleware.ts → Auth guard untuk semua /api/*        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Supabase (PostgreSQL + Storage)                        │
│  ├─ Database: 11 tabel + 6+ triggers + 20+ index        │
│  └─ Storage: 2 bucket (sk-documents, atlet-photos)      │
└─────────────────────────────────────────────────────────┘
```

### Alur Request

1. Browser memanggil `frontend.example.com/api/dashboard`
2. Frontend `next.config.ts` me-rewrite ke `BACKEND_URL/api/dashboard`
3. Backend `middleware.ts` memverifikasi token sesi dari cookie `auth_token`
4. Route handler memanggil service → repository → Supabase
5. Response dikembalikan ke browser

### Mengapa Dua Aplikasi?

- **Frontend** punya akses ke `AUTH_SECRET` (untuk verifikasi cookie di middleware Edge)
- **Backend** punya akses ke `SUPABASE_SECRET_KEY` (service role, full akses DB)
- Pemisahan ini mencegah secret key bocor ke bundle JavaScript frontend

---

## 2. Tech Stack

### Backend (`/backend`)
| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 16.2.11 | API Routes (App Router, API-only tanpa UI) |
| React | 19.2.4 | Peer dependency |
| TypeScript | ^5 | Type safety |
| Supabase JS | ^2.110.8 | PostgreSQL client + Storage |
| Node.js crypto | built-in | Hashing password (scrypt) |
| Web Crypto API | built-in | HMAC-SHA256 token sesi (Edge-compatible) |

### Frontend (`/frontend`)
| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 16.2.10 | React framework (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Utility-first styling |
| Leaflet + React-Leaflet | ^1.9.4 / ^5.0.0 | Peta interaktif Aceh |
| Chart.js + react-chartjs-2 | ^4.5.1 / ^5.3.1 | Grafik tren medali |
| Lucide React | ^1.25.0 | Icon library |

### Database
| Komponen | Fungsi |
|---|---|
| PostgreSQL (via Supabase) | Database utama |
| Supabase Storage | File upload (PDF SK, foto atlet) |
| SQL Migrations | Dikelola manual di Supabase SQL Editor |

---

## 3. Struktur Folder

```
sistem-manajemen-koni/
├── backend/                          # Aplikasi backend (API-only Next.js)
│   ├── .env                          # ⚠️ SECRET — tidak di-commit
│   ├── .env.example                  # Template env (aman di-commit)
│   ├── middleware.ts                  # Auth guard untuk semua /api/*
│   ├── package.json
│   ├── next.config.ts
│   ├── app/
│   │   ├── api/                      # 27 route files REST API
│   │   │   ├── auth/                 # Login, logout, me, password
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   └── password/route.ts
│   │   │   ├── admin/                # Manajemen akun admin (superadmin only)
│   │   │   │   ├── route.ts          # GET list, POST tambah
│   │   │   │   └── [id]/route.ts     # PUT edit, DELETE hapus
│   │   │   ├── atlet/                # CRUD atlet + upload foto
│   │   │   │   ├── route.ts          # GET list (paginated), POST tambah
│   │   │   │   ├── upload/route.ts   # POST upload foto
│   │   │   │   ├── [id]/route.ts     # GET detail, PUT edit, DELETE hapus
│   │   │   │   ├── [id]/foto/route.ts    # GET signed URL foto
│   │   │   │   └── [id]/dependencies/    # Cek dependensi sebelum hapus
│   │   │   ├── cabor/                # CRUD cabor + cabang cabor
│   │   │   │   ├── route.ts          # GET list, POST tambah
│   │   │   │   ├── [id]/route.ts     # GET detail, PUT edit, DELETE hapus
│   │   │   │   ├── [id]/cabang/route.ts          # GET/POST cabang cabor
│   │   │   │   ├── [id]/cabang/[cabangId]/route.ts  # PUT/DELETE cabang
│   │   │   │   └── [id]/dependencies/route.ts
│   │   │   ├── prestasi/             # CRUD prestasi
│   │   │   │   ├── route.ts          # GET list (paginated), POST tambah
│   │   │   │   └── [id]/route.ts     # GET detail, PUT edit, DELETE hapus
│   │   │   ├── kepengurusan/         # CRUD SK Pemprov + upload PDF
│   │   │   │   ├── route.ts          # GET list, POST tambah
│   │   │   │   ├── [id]/route.ts     # GET detail, PUT edit, DELETE hapus
│   │   │   │   ├── [id]/download/route.ts   # GET signed URL download PDF
│   │   │   │   └── upload/route.ts   # POST upload PDF SK
│   │   │   ├── kepengurusan-kabupaten/  # CRUD SK Kabupaten
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── [id]/download/route.ts
│   │   │   ├── dashboard/            # Statistik dashboard
│   │   │   │   └── route.ts
│   │   │   └── admin/                # Manajemen akun admin
│   │   │       ├── route.ts
│   │   │       └── [id]/route.ts
│   │   └── db/
│   │       ├── schema/               # SQL schema (untuk fresh install)
│   │       │   ├── cabor.sql
│   │       │   ├── atlet.sql
│   │       │   ├── prestasi.sql
│   │       │   ├── kepengurusan.sql
│   │       │   ├── cabang_cabor.sql
│   │       │   └── create mv medal by region.sql
│   │       └── migrations/           # 16 file migrasi (jalankan manual di SQL Editor)
│   │           ├── 001_cabor.sql
│   │           ├── 002_atlet.sql
│   │           ├── 003_prestasi.sql
│   │           ├── 004_kepengurusan.sql
│   │           ├── 005_create mv medals by region.sql
│   │           ├── 006_prestasi_tanggal.sql
│   │           ├── 007_create_storage_bucket.sql
│   │           ├── 008_cabang_cabor.sql
│   │           ├── 009_unique_duplikat.sql
│   │           ├── 010_create_admin_users.sql
│   │           ├── 011_add_atlet_fields.sql
│   │           ├── 012_create_atlet_photos_bucket.sql
│   │           ├── 013_kepengurusan_kabupaten.sql
│   │           ├── 014_kepengurusan_pemprov_text.sql
│   │           ├── 015_add_tanggal_berakhir.sql
│   │           └── 016_drop_masa_bakti.sql
│   ├── repositories/                 # Data access layer (query Supabase)
│   │   ├── atlet.repository.ts
│   │   ├── cabor.repository.ts
│   │   ├── cabang-cabor.repository.ts
│   │   ├── prestasi.repository.ts
│   │   ├── kepengurusan.repository.ts
│   │   ├── kepengurusan-kabupaten.repository.ts
│   │   └── dashboard.repository.ts
│   ├── services/                     # Business logic layer
│   │   ├── atlet.service.ts
│   │   ├── cabor.service.ts
│   │   ├── cabang-cabor.service.ts
│   │   ├── prestasi.service.ts
│   │   ├── kepengurusan.service.ts
│   │   ├── kepengurusan-kabupaten.service.ts
│   │   └── dashboard.service.ts
│   ├── lib/                          # Shared utilities
│   │   ├── supabase.ts               # Supabase client (service role)
│   │   ├── auth.ts                   # Token sesi HMAC (Edge-compatible)
│   │   ├── password.ts               # Hashing scrypt (Node-only)
│   │   ├── storage.ts                # Helper upload/hapus file storage
│   │   ├── pagination.ts             # Helper pagination
│   │   ├── delete-guard.ts           # Validasi frasa konfirmasi hapus
│   │   └── errors.ts                 # ValidationError class
│   └── scratch/                      # Skrip test sementara (di-gitignore)
│
├── frontend/                         # Aplikasi frontend (Next.js UI)
│   ├── .env                          # ⚠️ SECRET — tidak di-commit
│   ├── .env.example                  # Template env
│   ├── next.config.ts                # Rewrite proxy /api/* → backend
│   ├── package.json
│   ├── src/
│   │   ├── middleware.ts             # Route guard (login required, role check)
│   │   ├── lib/
│   │   │   ├── session.ts            # Verifikasi token sesi di Edge (sama seperti backend)
│   │   │   └── utils.ts             # cn() helper (clsx + tailwind-merge)
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Sidebar + mobile drawer (role-aware)
│   │   │   ├── DashboardStatCard.tsx  # KPI card animasi
│   │   │   ├── AcehMap.tsx           # Peta Leaflet 23 wilayah (dynamic import)
│   │   │   ├── athletes-page.tsx     # Komponen utama Direktori Prestasi
│   │   │   ├── management-page.tsx   # Komponen utama Kepengurusan
│   │   │   └── ui/                   # Reusable UI components
│   │   │       ├── card.tsx
│   │   │       ├── confirm-delete-modal.tsx  # Modal hapus 2-step
│   │   │       ├── dropdown-filter.tsx
│   │   │       ├── expandable-card.tsx
│   │   │       ├── form-select.tsx
│   │   │       └── pagination.tsx
│   │   ├── data/
│   │   │   └── mockData.ts          # 23 wilayah Aceh + region interface
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout + Navbar
│   │   │   ├── page.tsx              # Dashboard (peta + chart + EWS)
│   │   │   ├── globals.css           # Tailwind + custom CSS
│   │   │   ├── login/page.tsx        # Halaman login
│   │   │   ├── athletes/             # Direktori Prestasi (3 sub-halaman)
│   │   │   │   ├── page.tsx          # Manajemen Prestasi (default)
│   │   │   │   ├── atlet/page.tsx    # Manajemen Atlet
│   │   │   │   └── cabor/page.tsx    # Manajemen Cabor
│   │   │   ├── management/           # Kepengurusan (3 sub-halaman)
│   │   │   │   ├── page.tsx          # Kepengurusan Pemprov (default)
│   │   │   │   ├── kabupaten/page.tsx # Kepengurusan Kabupaten
│   │   │   │   └── histori/page.tsx  # Histori Kepengurusan KONI
│   │   │   ├── pengaturan/page.tsx   # Pengaturan Admin (superadmin only)
│   │   │   └── api/auth/login/route.ts  # Frontend login (redirect-based)
│   │   └── types/                    # TypeScript type definitions
│   └── public/
│       └── img/koni-logo.png
│
├── docs/                             # Dokumentasi tambahan
└── .git/
```

---

## 4. Panduan Setup & Menjalankan

### Prasyarat
- Node.js >= 18
- npm
- Akun Supabase (project sudah dibuat)

### Backend

```bash
cd backend
cp .env.example .env      # Isi semua env vars
npm install
npm run dev                # Running di http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env      # Isi AUTH_SECRET (sama dengan backend)
npm install
npm run dev                # Running di http://localhost:3000
```

Buka **http://localhost:3000** — frontend otomatis proxy `/api/*` ke backend port 3001 via rewrite di `next.config.ts`.

### Build Produksi

```bash
# Backend
cd backend && npm run build && npm start  # port 3001

# Frontend
cd frontend && npm run build && npm start  # port 3000
```

---

## 5. Environment Variables

### Backend (`backend/.env`)

```env
# Supabase
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SECRET_KEY=eyJ...           # Service role key (BUKAN anon key)

# Auth
AUTH_SECRET=<random-32-char-string>  # Secret untuk HMAC token sesi

# Super Admin Credentials
ADMIN_USERNAME=adminkoni
ADMIN_PASSWORD=<password-superadmin>
```

### Frontend (`frontend/.env`)

```env
# Auth — HARUS SAMA dengan backend
AUTH_SECRET=<sama-dengan-backend>

# Backend URL — untuk rewrite proxy
BACKEND_URL=http://localhost:3001    # Lokal
# BACKEND_URL=https://sistem-manajemen-koni-backend.vercel.app  # Produksi
```

**⚠️ Penting:**
- `AUTH_SECRET` harus **identik** di backend dan frontend (dipakai untuk sign & verify token)
- `SUPABASE_SECRET_KEY` hanya boleh ada di backend (service role = full akses DB)
- Kedua `.env` sudah di-gitignore dan tidak boleh di-commit

---

## 6. Database Schema

### Entity Relationship

```
┌──────────┐     ┌──────────┐     ┌─────────────┐
│  cabor   │────<│  atlet   │────<│  prestasi   │
│          │     │          │     │             │
│ id       │     │ id       │     │ id          │
│ nama_cabor│    │ nama_atlet│    │ atlet_id FK │
│          │     │ cabor_id FK    │ event_kejuaraan
│          │     │ kabupaten_kota│ tanggal (date)│
│          │     │ nik (unique)  │ tingkat_lomba│
│          │     │ jenis_kelamin │ mendali (enum)│
│          │     │ tempat_lahir  │ cabang_cabor_id FK│
│          │     │ tanggal_lahir │             │
│          │     │ no_hp         │             │
│          │     │ berat_badan   │             │
│          │     │ alamat_lengkap│             │
│          │     │ foto_url      │             │
└──────┬───┘     └──────────────┘     └─────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│cabang_cabor  │
│              │
│ id           │
│ cabor_id FK  │
│ nama_cabang  │
└──────────────┘

┌─────────────────────┐     ┌──────────────────────────┐
│   kepengurusan      │     │  kepengurusan_kabupaten  │
│ (Pemprov / level    │     │ (per kabupaten/kota)     │
│  provinsi)          │     │                          │
│                     │     │ id                       │
│ id                  │     │ kabupaten_kota           │
│ cabor_id FK (nullable)  │  nomor_sk                 │
│ pemprov (text)      │     │ tanggal_sk (date)        │
│ nomor_sk            │     │ tanggal_berakhir (date)  │
│ tanggal_sk (date)   │     │ ketua_umum               │
│ tanggal_berakhir    │     │ sekretaris               │
│ ketua_umum          │     │ file_path_sk             │
│ sekretaris          │     │ status_kepengurusan      │
│ file_path_sk        │     └──────────────────────────┘
│ status_kepengurusan │
└─────────────────────┘

┌──────────────┐
│ admin_users  │
│              │
│ id           │
│ username     │
│ password_hash│
│ role         │  (superadmin | admin_wilayah)
│ kabupaten_kota│
└──────────────┘
```

### Enum Types

```sql
-- prestasi.mendali
CREATE TYPE mendali_enum AS ENUM ('Emas', 'Perak', 'Perunggu', 'Tanpa Medali');

-- prestasi.tingkat_lomba
CREATE TYPE tingkat_lomba_enum AS ENUM ('Daerah', 'Nasional', 'Internasional');

-- kepengurusan.status_kepengurusan
CREATE TYPE status_kepengurusan_enum AS ENUM ('Aktif', 'Berakhir');
```

### Index Penting

| Table | Index | Fungsi |
|---|---|---|
| `cabor` | `uq_cabor_nama` (unique) | Cegah nama cabor duplikat (case-insensitive) |
| `cabang_cabor` | `uq_cabang_cabor_nama` (unique) | Cegah nama cabang duplikat per cabor |
| `atlet` | `uq_atlet_nama_cabor_daerah` (unique) | Cegah atlet duplikat (nama + cabor + daerah) |
| `atlet` | `idx_atlet_nik` (partial unique) | NIK unik, tapi data lama tanpa NIK aman |
| `prestasi` | `uq_prestasi_kombinasi` (unique, NULLS NOT DISTINCT) | Cegah prestasi duplikat |
| `prestasi` | `idx_prestasi_tanggal_mendali` | Optimasi query tren medali |
| `kepengurusan` | `idx_kepengurusan_pemprov` | Filter & auto-deactivate per pemprov |

### Triggers

| Trigger | Table | Fungsi |
|---|---|---|
| `trg_update_status_kepengurusan` | `kepengurusan` | SK baru Aktif → SK lama untuk pemprov sama otomatis Berakhir |
| `trg_update_status_kepengurusan_kab` | `kepengurusan_kabupaten` | SK baru Aktif → SK lama untuk kabupaten sama otomatis Berakhir |

---

## 7. Migrasi Database

Semua migrasi dijalankan **manual** di **Supabase SQL Editor** (tidak ada auto-migrate). Migrasi sudah dijalankan di database produksi sampai **016**.

| # | File | Fungsi | Tanggal |
|---|---|---|---|
| 001 | `001_cabor.sql` | Tabel cabor | Initial |
| 002 | `002_atlet.sql` | Tabel atlet + FK cabor | Initial |
| 003 | `003_prestasi.sql` | Tabel prestasi + enum mendali/tingkat | Initial |
| 004 | `004_kepengurusan.sql` | Tabel kepengurusan + trigger auto-deactivate | Initial |
| 005 | `005_create mv medals by region.sql` | Materialized view medali per wilayah | Initial |
| 006 | `006_prestasi_tanggal.sql` | Ubah kolom `tahun` → `tanggal` (DATE) di prestasi | Jul 2025 |
| 007 | `007_create_storage_bucket.sql` | Bucket `sk-documents` (upload PDF SK) | Jul 2025 |
| 008 | `008_cabang_cabor.sql` | Tabel `cabang_cabor` + FK di prestasi | Jul 2025 |
| 009 | `009_unique_duplikat.sql` | Bersihkan duplikat + buat index unik | Jul 2025 |
| 010 | `010_create_admin_users.sql` | Tabel `admin_users` + seed 23 admin wilayah | Aug 2025 |
| 011 | `011_add_atlet_fields.sql` | 8 kolom baru di atlet (NIK, JK, lahir, HP, etc.) | Aug 2025 |
| 012 | `012_create_atlet_photos_bucket.sql` | Bucket `atlet-photos` (foto profil atlet) | Aug 2025 |
| 013 | `013_kepengurusan_kabupaten.sql` | Tabel `kepengurusan_kabupaten` + trigger | Aug 2025 |
| 014 | `014_kepengurusan_pemprov_text.sql` | Kolom `pemprov` (text), drop `ketua_harian` | Aug 2025 |
| 015 | `015_add_tanggal_berakhir.sql` | Kolom `tanggal_berakhir` (DATE) untuk EWS | Aug 2025 |
| 016 | `016_drop_masa_bakti.sql` | Backfill `tanggal_berakhir` dari `masa_bakti`, lalu drop `masa_bakti` | Aug 2025 |

**Cara menjalankan migrasi baru:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file migrasi
3. Klik "Run"
4. Verifikasi dengan query `SELECT column_name FROM information_schema.columns WHERE table_name='...'`

---

## 8. Sistem Autentikasi & Otorisasi

### Arsitektur Auth

```
Login Flow:
  POST /api/auth/login { username, password }
  → Backend cek:
    1. Superadmin? → cocokkan dengan ADMIN_USERNAME/ADMIN_PASSWORD di env
    2. Admin wilayah? → cocokkan dengan tabel admin_users (scrypt verify)
  → Buat token: HMAC-SHA256(payload, AUTH_SECRET)
  → Set cookie: auth_token = base64url(payload).base64url(signature)
  → Cookie: httpOnly, secure (production), sameSite=strict, maxAge=7 hari

Token Format:
  eyJ1aWQiOiJzdXBlcmFkbWluIiwidXNlcm5hbWUiOiJhZG1pbmtvbml
  ...
  .signature_base64url

Payload:
  { uid, username, role, region, exp }
```

### Middleware Auth

**Backend** (`backend/middleware.ts`):
- Mengintercept semua request ke `/api/*`
- Public paths: `/api/auth/login`, `/api/auth/logout` (di-skip)
- Memverifikasi cookie `auth_token` → 401 jika tidak valid
- Role-based access (superadmin / admin_wilayah) diperiksa di masing-masing route handler

**Frontend** (`frontend/src/middleware.ts`):
- Mengintercept semua request halaman (bukan API)
- `/login` → redirect ke `/` jika sudah login
- Semua halaman lain → redirect ke `/login` jika belum login
- `/management/*` dan `/pengaturan/*` → redirect ke `/` jika bukan superadmin

### Perbedaan Auth Backend vs Frontend

| Aspek | Backend | Frontend |
|---|---|---|
| File | `lib/auth.ts` | `lib/session.ts` |
| Runtime | Node + Edge (middleware) | Edge (middleware only) |
| Import | `crypto.subtle` (Web Crypto) | `crypto.subtle` (Web Crypto) |
| `AUTH_SECRET` | Dari `.env` | Dari `.env` (harus sama) |
| Password hashing | `lib/password.ts` (Node crypto) | Tidak ada |

---

## 9. API Endpoints

### Auth

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login (superadmin + admin wilayah) |
| POST | `/api/auth/logout` | Public | Hapus cookie sesi |
| GET | `/api/auth/me` | Required | Info pengguna yang login |
| PUT | `/api/auth/password` | Required | Ubah password sendiri (admin wilayah) |

### Dashboard

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/dashboard` | Required | Statistik: total atlet/cabor/prestasi, medali per wilayah, EWS SK |

### Atlet

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/atlet` | Required | List atlet (paginated + search + filter) |
| POST | `/api/atlet` | Required | Tambah atlet baru (dengan validasi duplikat) |
| GET | `/api/atlet/:id` | Required | Detail atlet (termasuk prestasi) |
| PUT | `/api/atlet/:id` | Required | Edit atlet |
| DELETE | `/api/atlet/:id` | Required | Hapus atlet + foto dari storage |
| POST | `/api/atlet/upload` | Required | Upload foto atlet (ke bucket `atlet-photos`) |
| GET | `/api/atlet/:id/foto` | Required | Signed URL foto (5 menit) |
| GET | `/api/atlet/:id/dependencies` | Required | Cek dependensi sebelum hapus |

### Cabang Olahraga (Cabor)

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/cabor` | Required | List semua cabor (+ cabang_cabor) |
| POST | `/api/cabor` | Admin+ | Tambah cabor baru |
| GET | `/api/cabor/:id` | Required | Detail cabor |
| PUT | `/api/cabor/:id` | Admin+ | Edit cabor |
| DELETE | `/api/cabor/:id` | Admin+ | Hapus cabor (+ cascade cabang) |
| GET | `/api/cabor/:id/cabang` | Required | List cabang cabor |
| POST | `/api/cabor/:id/cabang` | Admin+ | Tambah cabang cabor |
| PUT | `/api/cabor/:id/cabang/:cabangId` | Admin+ | Edit cabang |
| DELETE | `/api/cabor/:id/cabang/:cabangId` | Admin+ | Hapus cabang |

### Prestasi

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/prestasi` | Required | List prestasi (paginated + filter + join atlet) |
| POST | `/api/prestasi` | Required | Tambah prestasi (validasi duplikat) |
| GET | `/api/prestasi/:id` | Required | Detail prestasi |
| PUT | `/api/prestasi/:id` | Required | Edit prestasi |
| DELETE | `/api/prestasi/:id` | Required | Hapus prestasi |

### Kepengurusan Pemprov (Superadmin Only)

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/kepengurusan` | Superadmin | List SK (filter: status) |
| POST | `/api/kepengurusan` | Superadmin | Tambah SK + auto-deactivate SK lama |
| GET | `/api/kepengurusan/:id` | Superadmin | Detail SK |
| PUT | `/api/kepengurusan/:id` | Superadmin | Edit SK |
| DELETE | `/api/kepengurusan/:id` | Superadmin | Hapus SK (dengan frasa konfirmasi) |
| GET | `/api/kepengurusan/:id/download` | Superadmin | Signed URL download PDF SK |
| POST | `/api/kepengurusan/upload` | Superadmin | Upload PDF SK |

### Kepengurusan Kabupaten (Superadmin Only)

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/kepengurusan-kabupaten` | Superadmin | List SK kabupaten |
| POST | `/api/kepengurusan-kabupaten` | Superadmin | Tambah SK kabupaten + auto-deactivate |
| GET | `/api/kepengurusan-kabupaten/:id` | Superadmin | Detail SK kabupaten |
| PUT | `/api/kepengurusan-kabupaten/:id` | Superadmin | Edit SK kabupaten |
| DELETE | `/api/kepengurusan-kabupaten/:id` | Superadmin | Hapus SK kabupaten |
| GET | `/api/kepengurusan-kabupaten/:id/download` | Superadmin | Signed URL download PDF |

### Admin Management (Superadmin Only)

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/admin` | Superadmin | List semua admin |
| POST | `/api/admin` | Superadmin | Tambah admin wilayah baru |
| PUT | `/api/admin/:id` | Superadmin | Edit username/password/wilayah admin |
| DELETE | `/api/admin/:id` | Superadmin | Hapus akun admin |

### Konvensi Response

Semua endpoint mengembalikan format konsisten:

```json
// Sukses
{ "status": "success", "message": "...", "data": { ... } }

// Gagal (validasi)
{ "status": "fail", "message": "..." }

// Error (server)
{ "status": "error", "message": "..." }
```

### Pagination

Endpoint list mendukung pagination opsional:
```
GET /api/atlet?page=1&pageSize=20
```
Tanpa parameter `page`/`pageSize`, endpoint mengembalikan semua data (mode backward-compatible, dipakai untuk dropdown).

Response paginated:
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": { "page": 1, "pageSize": 20, "total": 150, "totalPages": 8 }
  }
}
```

---

## 10. Fitur Frontend

### Routing

| Route | Halaman | Akses |
|---|---|---|
| `/login` | Login | Public |
| `/` | Dashboard | Semua (tampilan berbeda per role) |
| `/athletes` | Manajemen Prestasi | Semua (filtered by region untuk admin wilayah) |
| `/athletes/atlet` | Manajemen Atlet | Semua |
| `/athletes/cabor` | Manajemen Cabor | Semua |
| `/management` | Kepengurusan Pemprov | Superadmin only |
| `/management/kabupaten` | Kepengurusan Kabupaten | Superadmin only |
| `/management/histori` | Histori Kepengurusan | Superadmin only |
| `/pengaturan` | Pengaturan Admin | Superadmin only |

### Komponen Utama

| Komponen | Lokasi | Fungsi |
|---|---|---|
| `Navbar.tsx` | `components/` | Sidebar collapsible + mobile drawer + submenu |
| `DashboardStatCard.tsx` | `components/` | KPI card animasi (counter up) |
| `AcehMap.tsx` | `components/` | Peta Leaflet interaktif 23 wilayah (dynamic import) |
| `athletes-page.tsx` | `components/` | Komponen utama Direktori Prestasi (3 section: prestasi/atlet/cabor) |
| `management-page.tsx` | `components/` | Komponen utama Kepengurusan (3 section: pemprov/kabupaten/histori) |
| `confirm-delete-modal.tsx` | `components/ui/` | Modal hapus permanen 2-step (konfirmasi + ketik frasa) |
| `pagination.tsx` | `components/ui/` | Komponen pagination |

### Responsive Design

- **Mobile** (`< 1024px`): Top bar + hamburger menu, drawer geser dari kiri, kartu 2 kolom, peta disembunyikan
- **Desktop** (`>= 1024px`): Sidebar collapsible, kartu 4 kolom, peta interaktif

---

## 11. Akun Admin & Hak Akses

### Super Admin
- Login menggunakan kredensial di `backend/.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)
- Akses penuh ke semua fitur
- Dapat mengelola akun admin wilayah (tambah/hapus/edit) di halaman Pengaturan Admin
- Melihat peta interaktif di dashboard
- Mengelola Kepengurusan (SK Pemprov + Kabupaten + Histori)

### Admin Wilayah (23 kabupaten/kota)

Password default untuk **semua** akun: **`koni2024`**

> ⚠️ **Wajib diganti setelah login pertama** melalui menu Pengaturan Admin.

| # | Wilayah | Username |
|---|---|---|
| 1 | Banda Aceh | `admin.banda-aceh` |
| 2 | Aceh Besar | `admin.aceh-besar` |
| 3 | Pidie | `admin.pidie` |
| 4 | Lhokseumawe | `admin.lhokseumawe` |
| 5 | Aceh Timur | `admin.aceh-timur` |
| 6 | Bireuen | `admin.bireuen` |
| 7 | Aceh Utara | `admin.aceh-utara` |
| 8 | Langsa | `admin.langsa` |
| 9 | Aceh Barat | `admin.aceh-barat` |
| 10 | Aceh Tengah | `admin.aceh-tengah` |
| 11 | Sabang | `admin.sabang` |
| 12 | Aceh Jaya | `admin.aceh-jaya` |
| 13 | Pidie Jaya | `admin.pidie-jaya` |
| 14 | Aceh Tamiang | `admin.aceh-tamiang` |
| 15 | Aceh Selatan | `admin.aceh-selatan` |
| 16 | Subulussalam | `admin.subulussalam` |
| 17 | Bener Meriah | `admin.bener-meriah` |
| 18 | Nagan Raya | `admin.nagan-raya` |
| 19 | Gayo Lues | `admin.gayo-lues` |
| 20 | Aceh Tenggara | `admin.aceh-tenggara` |
| 21 | Simeulue | `admin.simeulue` |
| 22 | Aceh Singkil | `admin.aceh-singkil` |
| 23 | Aceh Barat Daya | `admin.aceh-barat-daya` |

### Matrix Hak Akses

| Fitur | Super Admin | Admin Wilayah |
|---|---|---|
| Dashboard — Peta interaktif | ✅ | ❌ (hanya ringkasan medali wilayah) |
| Dashboard — EWS (peringatan SK) | ✅ | ❌ |
| Dashboard — Tren medali | ✅ | ✅ (hanya data wilayahnya) |
| Manajemen Prestasi | Semua wilayah | Hanya wilayahnya sendiri |
| Manajemen Atlet | Semua wilayah | Hanya wilayahnya sendiri |
| Manajemen Cabor | Kelola penuh (CRUD) | Baca saja |
| Kepengurusan Pemprov | Kelola penuh | ❌ Tidak ada akses |
| Kepengurusan Kabupaten | Kelola penuh | ❌ Tidak ada akses |
| Histori Kepengurusan | Lihat + download | ❌ Tidak ada akses |
| Pengaturan Admin | Kelola akun admin | ❌ Tidak ada akses |
| Ubah Kata Sandi | Via env backend | ✅ Menu tersedia |

### Filter Data by Region

Ketika admin wilayah login:
- **Atlet**: hanya atlet dengan `kabupaten_kota` = wilayah admin
- **Prestasi**: hanya prestasi atlet di wilayah admin
- **Dashboard**: ringkasan medali wilayah admin saja (tanpa peta)
- **Cabor**: bisa melihat semua cabor (read-only)

---

## 12. Fitur-Fitur Utama

### Dashboard
- **4 KPI Cards**: Total Atlet, Total Cabor, Total Prestasi, Total Medali Emas Regional
- **Peta Interaktif Aceh**: 23 wilayah kabupaten/kota, klik untuk detail medali (Emas/Perak/Perunggu)
- **Tren Medali Tahunan**: Grafik garis medali emas dengan filter waktu (1 Bulan, 3 Bulan, 1 Tahun, 3 Tahun, Semua)
- **Early Warning System (EWS)**: Peringatan SK yang akan kedaluwarsa dalam ≤ 90 hari (warna kuning ≤ 90 hari, merah ≤ 14 hari)
- **Mobile**: Peta disembunyikan, hanya daftar wilayah yang ditampilkan

### Direktori Prestasi (3 sub-halaman)

**Manajemen Prestasi** (`/athletes`):
- Tabel prestasi dengan filter: event, tahun, tingkat, medali
- Pagination + search
- Tambah/Edit prestasi (modal form dengan dropdown atlet searchable, cabor, cabang cabor)
- Hapus dengan konfirmasi 2-step (ketik frasa persis)
- Field: event_kejuaraan, tanggal (date), tingkat_lomba (Daerah/Nasional/Internasional), medali, cabor, cabang cabor

**Manajemen Atlet** (`/athletes/atlet`):
- Tabel atlet dengan avatar foto, nama, jenis kelamin, daerah, cabor
- Data diri lengkap: NIK (16 digit, unik), jenis kelamin, tempat/tanggal lahir, no HP, berat badan, alamat, foto
- Upload foto atlet (JPG/PNG/WebP, max 2MB, preview)
- Tombol 👁 "Lihat" → modal pop-up biodata + riwayat prestasi
- Filter search + daerah + cabor

**Manajemen Cabor** (`/athletes/cabor`):
- Tabel cabor + cabang cabor (expandable)
- Tambah cabor + cabang cabor (multi cabang sekaligus)
- Edit nama cabang cabor
- Hapus dengan cek dependensi (atlet/prestasi/SK terkait)
- Search

### Kepengurusan (3 sub-halaman)

**Kepengurusan Pemprov** (`/management`):
- Tabel SK pengurus provinsi per cabor/pemprov
- Kolom: Pemprov, No. SK, Tanggal Penetapan, Tanggal Berakhir, Ketua Umum, Sekretaris
- Status Aktif/Berakhir dikelola otomatis oleh trigger database
- Upload PDF SK
- Auto-deactivation: SK baru Aktif → SK lama untuk pemprov sama otomatis Berakhir

**Kepengurusan Kabupaten** (`/management/kabupaten`):
- Tabel SK pengurus kabupaten/kota
- Kolom mirip Pemprov, tapi field: Kabupaten-Kota (dropdown 23 wilayah)

**Histori Kepengurusan** (`/management/histori`):
- 2 kartu: Histori Pemprov + Histori Kabupaten
- Hanya menampilkan SK dengan status "Berakhir"
- Read-only + download PDF

### Pengaturan Admin (`/pengaturan`)
- **Superadmin only**
- 23 card kecil, masing-masing untuk 1 admin wilayah
- Setiap card menampilkan: username, wilayah, password (tersembunyi)
- Fitur: edit username/password/wilayah, tambah admin baru, hapus admin

### Fitur Keamanan
- **Hapus Permanen 2-Step**: Modal konfirmasi → ketik frasa persis (mis. "hapus cabor Basket") → baru bisa hapus
- **Server-side Validation**: Backend menghitung ulang frasa yang diharapkan dari data DB → cocokkan dengan input user
- **NIK Unique**: Validasi NIK 16 digit + duplikat check
- **Anti Duplikat Data**: Validasi di level application + index unik di database

---

## 13. Deployment

### Platform: Vercel

Sistem ini di-deploy ke Vercel dengan konfigurasi:

**Frontend:**
- Repository: `halimelsaputra/sistem-manajemen-koni`, root directory: `frontend`
- Build: `npm run build`
- Environment variables: `AUTH_SECRET`, `BACKEND_URL`

**Backend:**
- Repository: `halimelsaputra/sistem-manajemen-koni`, root directory: `backend`
- Build: `npm run build`
- Environment variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`

### Deploy Flow

```
git push origin main
  → Vercel detect changes
  → Build frontend + backend secara paralel
  → Deploy (~1-2 menit)
  → Live di https://sistem-manajemen-koni.vercel.app
```

### Setup Pertama Kali

1. Fork repo ke GitHub account kamu
2. Buat 2 project di Vercel (frontend + backend), hubungkan ke repo yang sama
3. Set root directory masing-masing (`frontend` / `backend`)
4. Tambahkan environment variables di Vercel Dashboard
5. Deploy — Vercel akan auto-build
6. Jalankan semua migrasi database (001-016) di Supabase SQL Editor

---

## 14. Arsitektur Keamanan

### Keamanan Data

| Layer | Mekanisme |
|---|---|
| **Database** | Row Level Security (RLS) di bucket storage; FK constraints ON DELETE RESTRICT |
| **Backend** | Auth middleware (token verifikasi) di semua endpoint; role-based guard |
| **Frontend** | Route guard (middleware); hide menu berdasarkan role |
| **Transport** | HTTPS (Vercel); cookie httpOnly + secure + sameSite=strict |
| **Password** | Scrypt hashing (Node crypto) — salt:hash format |
| **Token** | HMAC-SHA256 (Web Crypto) — kompatibel Node & Edge runtime |
| **File Storage** | Bucket privat; akses hanya via signed URL (5 menit expiry) |
| **Hapus Data** | 2-step: konfirmasi modal + ketik frasa; server-side recompute frasa |
| **Duplikat** | Index unik database (cabor, atlet, prestasi, NIK) + validasi application |

### Secret Management

- `SUPABASE_SECRET_KEY` → hanya backend (service role = full DB access)
- `AUTH_SECRET` → backend + frontend (harus identik, untuk sign/verify token)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` → hanya backend (superadmin credentials)
- Semua `.env` di-gitignore (tidak masuk repository)

---

## 15. Panduan untuk AI / Developer Baru

### Memahami Codebase dengan Cepat

1. **Mulai dari `backend/app/api/`** — setiap folder adalah endpoint REST. Route handler memanggil service → repository → Supabase.
2. **`backend/repositories/`** — semua query Supabase ada di sini. Ini layer paling penting untuk memahami data flow.
3. **`backend/services/`** — business logic, validasi, transformasi data.
4. **`backend/lib/`** — shared utilities (auth, supabase client, pagination, dll).
5. **`frontend/src/components/`** — komponen utama: `athletes-page.tsx` (~1400 baris, mengelola 3 section prestasi/atlet/cabor) dan `management-page.tsx` (~900 baris, mengelola 3 section kepengurusan).
6. **`frontend/src/app/`** — route files yang mostly wrapper tipis ke komponen shared.

### Pola Penting

**API Response Pattern:**
```typescript
// Semua endpoint mengikuti pola ini:
export async function GET(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== 'superadmin') return forbiddenResponse();

        const data = await SomeRepository.findAll();
        return NextResponse.json({
            status: "success",
            message: "data berhasil diambil",
            data,
        });
    } catch (error: any) {
        console.error("Gagal ...:", error);
        return NextResponse.json(
            { status: "error", message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}
```

**Role-Based Data Filtering:**
```typescript
// Di repository, filter berdasarkan region admin wilayah:
if (session.role === 'admin_wilayah' && session.region) {
    query = query.eq('kabupaten_kota', session.region);
}
```

**Auto-Deactivation Trigger:**
```sql
-- SK baru Aktif → SK lama untuk pemprov/kabupaten sama otomatis Berakhir
-- Trigger di database, bukan di application code
```

**Delete Guard:**
```typescript
// Backend menghitung frasa dari data DB:
const expectedPhrase = `hapus cabor ${existing.nama_cabor}`;
const guardError = validateConfirmPhrase(body?.confirmText, expectedPhrase);
if (guardError) return NextResponse.json({ status: "fail", message: guardError }, { status: 400 });
```

### Konvensi Nama

| Item | Konvensi | Contoh |
|---|---|---|
| Tabel database | `snake_case` | `kepengurusan_kabupaten` |
| Kolom database | `snake_case` | `nama_cabor`, `status_kepengurusan` |
| API endpoint | `kebab-case` | `/api/kepengurusan-kabupaten` |
| File TypeScript | `kebab-case` | `cabang-cabor.repository.ts` |
| React component | `PascalCase` | `DashboardStatCard`, `ConfirmDeleteModal` |
| State variable | `camelCase` | `showAtletModal`, `newCaborNama` |
| CSS classes | Tailwind utility | `bg-white`, `rounded-xl`, `font-bold` |

### Saat Mengedit Kode

1. **Backend berubah** → jalankan `npx tsc --noEmit` di `/backend` untuk typecheck
2. **Frontend berubah** → jalankan `npx tsc --noEmit` di `/frontend` untuk typecheck
3. **Build produksi** → `npm run build` di kedua project
4. **Migrasi DB** → selalu buat file migrasi baru di `backend/app/db/migrations/`, JANGAN edit migrasi yang sudah jalan
5. **Push ke GitHub** → Vercel auto-deploy dari branch `main`

### Pattern Architecture

```
Request → Middleware (auth) → Route Handler → Service (logic) → Repository (query) → Supabase
                                                                          ↓
Response ← Route Handler ← Service ← Repository ← Supabase Response
```

### File yang Sering Diubah

| File | Alasan |
|---|---|
| `frontend/src/components/athletes-page.tsx` | CRUD prestasi/atlet/cabor (komponen terbesar) |
| `frontend/src/components/management-page.tsx` | CRUD kepengurusan pemprov/kabupaten/histori |
| `backend/repositories/*.repository.ts` | Query Supabase untuk setiap entitas |
| `backend/services/*.service.ts` | Business logic, validasi |
| `backend/app/api/*/route.ts` | Route handler (sering ditambah untuk fitur baru) |
| `frontend/src/components/Navbar.tsx` | Navigasi + sidebar + role check |
| `frontend/src/components/ui/confirm-delete-modal.tsx` | Modal hapus permanen |

### Backend-Specific Notes

- Backend berjalan di **port 3001** (dikonfigurasi di `package.json` scripts)
- Backend adalah **API-only** — tidak ada halaman UI
- `backend/middleware.ts` melindungi semua `/api/*` dari akses tanpa sesi
- `lib/password.ts` menggunakan Node `crypto` — **tidak boleh diimpor dari middleware** (Edge runtime)
- `lib/auth.ts` menggunakan Web Crypto — aman di Edge runtime

### Frontend-Specific Notes

- Frontend menggunakan **rewrite proxy** di `next.config.ts` untuk forward `/api/*` ke backend
- Di Vercel, `BACKEND_URL` env var menentukan tujuan proxy
- `AcehMap.tsx` di-load secara **dynamic** (SSR disabled) karena Leaflet butuh `window`
- Middleware frontend memverifikasi token secara **independent** (tidak memanggil backend `/api/auth/me`)
- `athletes-page.tsx` menggunakan **createPortal** untuk modal — porting ke `document.body`

### Known Issues / Tech Debt

1. **Materialized View `mv_medals_by_region`** — ada di schema tapi query di `dashboard.repository.ts` sudah diganti ke dynamic calculation (join `prestasi` + `atlet`). MV bisa di-drop jika tidak dipakai lagi.
2. **`cabor_id` nullable di `kepengurusan`** — data lama masih punya `cabor_id`, data baru pakai `pemprov` text. Kode masih join ke `cabor` untuk backward compatibility.
3. **Pagination mode dual** — endpoint bisa return array langsung atau paginated object, tergantung ada parameter `page`/`pageSize` atau tidak.

---

## Lisensi

Proyek internal KONI Provinsi Aceh.

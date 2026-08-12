# SI-KONI Aceh — Sistem Manajemen Keolahragaan

Sistem manajemen data atlet, prestasi, cabang olahraga, dan kepengurusan (SK) KONI Aceh.

---

## 🔐 Akun Admin

### Super Admin
Login super admin menggunakan kredensial yang dikonfigurasi di **env backend** (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

### Admin Wilayah (23 kabupaten/kota)

Password default untuk **semua** akun: **`koni2024`**

> ⚠️ **Wajib diganti setelah login pertama** melalui menu **Ubah Kata Sandi** di sidebar. Jangan gunakan password default di produksi.

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

---

## 📋 Daftar Hak Akses

| Fitur | Super Admin | Admin Wilayah |
|---|---|---|
| Atlet & Prestasi | Semua wilayah | Hanya wilayahnya sendiri |
| Dashboard | Peta seluruh Aceh | Ringkasan wilayahnya (tanpa peta) |
| Cabor & Cabang Cabor | Kelola penuh | Baca saja |
| Kepengurusan / SK | Kelola penuh | Tidak ada akses |
| Ubah Kata Sandi | Via env backend | Menu Pengaturan |

---

## 🚀 Menjalankan di Lokal

```bash
# Backend (port 3001)
cd backend
cp .env.example .env   # isi sesuai lingkungan
npm install
npm run dev

# Frontend (port 3000)
cd frontend
cp .env.example .env   # isi AUTH_SECRET sama dengan backend
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

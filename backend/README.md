# SI-KONI Aceh — Backend API

Backend API untuk Sistem Manajemen Keolahragaan KONI Aceh (Next.js + Supabase).

## Ringkasan

- Seluruh endpoint `/api/*` dilindungi **cookie sesi `auth_token`** (token bertanda tangan HMAC-SHA256, masa berlaku 7 hari).
- **Autentikasi**: route `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/password`.
- **Multi-peran**: super admin (dari env) & 23 admin wilayah (tabel `admin_users`). Admin wilayah hanya dapat mengakses data wilayahnya sendiri.
- **Kunci sesi**: env `AUTH_SECRET` — **wajib identik** dengan frontend.
- **Kredensial super admin**: env `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
- **Koneksi database**: env `SUPABASE_URL` / `SUPABASE_SECRET_KEY`.

> Lihat daftar akun admin wilayah di `frontend/README.md`.

## Menjalankan di Lokal

```bash
cp .env.example .env   # isi sesuai lingkungan
npm install
npm run dev            # port 3001
```

## Migrasi Database

Migrasi SQL ada di `app/db/migrations/` (dijalankan manual di Supabase, diurutkan sesuai nomor file).

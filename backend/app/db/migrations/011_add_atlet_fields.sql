-- 011: Tambah kolom data diri atlet (registrasi atlet lengkap)
-- Jalankan di Supabase SQL Editor.
-- Semua kolom nullable agar data atlet lama tidak rusak (backward compatible).
-- Kolom baru diisi lewat form Registrasi Atlet (wajib di UI, tapi nullable di DB
-- karena data lama belum punya nilai).

ALTER TABLE atlet ADD COLUMN IF NOT EXISTS nik varchar(20);
ALTER TABLE atlet ADD COLUMN IF NOT EXISTS jenis_kelamin varchar(10);      -- 'Laki-laki' | 'Perempuan'
ALTER TABLE atlet ADD COLUMN IF NOT EXISTS tempat_lahir varchar(255);
ALTER TABLE atlet ADD COLUMN IF NOT EXISTS tanggal_lahir date;
ALTER TABLE atlet ADD COLUMN IF NOT EXISTS no_hp varchar(20);
ALTER TABLE atlet ADD COLUMN IF NOT EXISTS berat_badan numeric(5,2);        -- kg
ALTER TABLE atlet ADD COLUMN IF NOT EXISTS alamat_lengkap text;
ALTER TABLE atlet ADD COLUMN IF NOT EXISTS foto_url varchar(500);          -- path di bucket atlet-photos

-- NIK harus unik antar atlet (partial unique index: NULL tidak dihitung,
-- jadi atlet lama tanpa NIK tetap boleh banyak).
CREATE UNIQUE INDEX IF NOT EXISTS idx_atlet_nik ON atlet (nik) WHERE nik IS NOT NULL AND nik <> '';

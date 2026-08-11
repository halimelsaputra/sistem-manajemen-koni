-- ============================================================================
-- 006: Ubah prestasi.tahun (integer) → prestasi.tanggal (date)
-- ============================================================================
-- TUJUAN:  Menyamakan pola dengan kepengurusan.tanggal_sk (tanggal penetapan).
--          Kode aplikasi (backend + frontend) SUDAH di-update memakai `tanggal`.
--
-- CARA PAKAI (sekali jalan, di Supabase Dashboard → SQL Editor):
--   1. Jalankan SELURUH script ini dalam satu eksekusi.
--   2. Tidak ada data yang hilang: nilai `tahun` lama di-backfill menjadi
--      1 Januari pada tahun tersebut (mis. tahun 2024 → 2024-01-01).
--   3. Script idempotent (aman dijalankan ulang / sebagian).
--
-- PENTING:
--   * Script ini untuk DATABASE LIVE YANG SUDAH ADA (upgrade), BUKAN bagian
--     chain instalasi baru. Di database baru, migrasi 003 sudah membuat kolom
--     `tanggal`, jadi langkah backfill di bawah otomatis dilewati (guard).
--   * URUTAN DEPLOY WAJIB: kode baru (yang memakai `tanggal`) ter-deploy DULU,
--     baru jalankan script ini. Langkah terakhir menghapus kolom `tahun`.
-- ============================================================================

-- 1) Tambah kolom tanggal (nullable dulu agar data lama bisa diisi)
ALTER TABLE public.prestasi ADD COLUMN IF NOT EXISTS tanggal date;

-- 2) Backfill data lama: tahun → 1 Januari tahun tersebut
--    (dijalankan hanya jika kolom `tahun` masih ada — guard untuk fresh install)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'prestasi' AND column_name = 'tahun'
    ) THEN
        UPDATE public.prestasi
        SET tanggal = make_date(tahun, 1, 1)
        WHERE tanggal IS NULL AND tahun IS NOT NULL;
    END IF;
END $$;

-- 3) Wajibkan nilai + index baru (menggantikan index lama berbasis tahun)
ALTER TABLE public.prestasi ALTER COLUMN tanggal SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prestasi_tanggal ON public.prestasi (tanggal);
CREATE INDEX IF NOT EXISTS idx_prestasi_tanggal_mendali ON public.prestasi (tanggal, mendali);

-- 4) Hapus kolom & index lama (kode sudah sepenuhnya memakai `tanggal`)
ALTER TABLE public.prestasi DROP COLUMN IF EXISTS tahun;
DROP INDEX IF EXISTS idx_prestasi_tahun;
DROP INDEX IF EXISTS idx_prestasi_tahun_mendali;

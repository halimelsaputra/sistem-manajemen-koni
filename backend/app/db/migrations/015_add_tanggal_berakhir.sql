-- 015: Kolom tanggal_berakhir untuk EWS (Early Warning System) SK
-- WAJIB dijalankan di Supabase SQL Editor.
--
-- Menambahkan kolom `tanggal_berakhir` (DATE) di tabel kepengurusan dan
-- kepengurusan_kabupaten. Sistem EWS (peringatan kedaluwarsa SK) memakai
-- tanggal ini untuk menghitung sisa hari. Untuk data lama yang belum punya
-- nilai, sistem tetap memakai fallback parsing dari masa_bakti (YYYY-YYYY).

ALTER TABLE kepengurusan ADD COLUMN IF NOT EXISTS tanggal_berakhir DATE;
ALTER TABLE kepengurusan_kabupaten ADD COLUMN IF NOT EXISTS tanggal_berakhir DATE;

CREATE INDEX IF NOT EXISTS idx_kepengurusan_tanggal_berakhir ON kepengurusan (tanggal_berakhir);
CREATE INDEX IF NOT EXISTS idx_kepengurusan_kab_tanggal_berakhir ON kepengurusan_kabupaten (tanggal_berakhir);

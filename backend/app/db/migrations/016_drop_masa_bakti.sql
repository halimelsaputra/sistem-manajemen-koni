-- 016: Hapus kolom masa_bakti (redundan — digantikan tanggal_berakhir)
-- WAJIB dijalankan di Supabase SQL Editor.
--
-- 1. Sebelum drop, backfill `tanggal_berakhir` untuk data lama yang masih NULL:
--    ambil tahun akhir dari string masa_bakti ("2020-2024" -> 2024) lalu
--    gabung dengan tanggal & bulan tanggal_sk (perilaku yang sama dengan
--    fallback EWS sebelumnya).
-- 2. Drop kolom masa_bakti di kepengurusan dan kepengurusan_kabupaten.

-- 1. Backfill tanggal_berakhir dari masa_bakti (data lama)
UPDATE kepengurusan k
SET tanggal_berakhir = (
    SELECT make_date(
        (regexp_match(k.masa_bakti, '(\d{4})\s*$'))[1]::int,
        EXTRACT(MONTH FROM k.tanggal_sk)::int,
        EXTRACT(DAY FROM k.tanggal_sk)::int
    )
)
WHERE k.tanggal_berakhir IS NULL
  AND k.masa_bakti IS NOT NULL
  AND k.tanggal_sk IS NOT NULL
  AND regexp_match(k.masa_bakti, '(\d{4})\s*$') IS NOT NULL;

UPDATE kepengurusan_kabupaten k
SET tanggal_berakhir = (
    SELECT make_date(
        (regexp_match(k.masa_bakti, '(\d{4})\s*$'))[1]::int,
        EXTRACT(MONTH FROM k.tanggal_sk)::int,
        EXTRACT(DAY FROM k.tanggal_sk)::int
    )
)
WHERE k.tanggal_berakhir IS NULL
  AND k.masa_bakti IS NOT NULL
  AND k.tanggal_sk IS NOT NULL
  AND regexp_match(k.masa_bakti, '(\d{4})\s*$') IS NOT NULL;

-- 2. Drop kolom masa_bakti
ALTER TABLE kepengurusan DROP COLUMN IF EXISTS masa_bakti;
ALTER TABLE kepengurusan_kabupaten DROP COLUMN IF EXISTS masa_bakti;

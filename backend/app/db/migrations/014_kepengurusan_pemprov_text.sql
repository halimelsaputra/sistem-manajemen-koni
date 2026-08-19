-- 014: Kepengurusan — kolom "pemprov" (input manual), cabor_id opsional, hapus ketua_harian
-- WAJIB dijalankan di Supabase SQL Editor sebelum fitur Kepengurusan Pemprov baru dipakai.
--
-- Perubahan:
-- 1. Kolom baru `pemprov` (teks) — nama organisasi pengurus provinsi, diinput manual.
-- 2. Data lama di-backfill dari nama cabor yang terhubung (agar histori tetap tampil).
-- 3. `cabor_id` tidak lagi wajib (data baru memakai pemprov manual).
-- 4. Kolom `ketua_harian` dihapus (tidak dipakai lagi) di tabel kepengurusan & kepengurusan_kabupaten.
-- 5. Trigger auto-deaktivasi kini berbasis `pemprov` (bukan cabor_id).

-- 1. Kolom baru pemprov
ALTER TABLE kepengurusan ADD COLUMN IF NOT EXISTS pemprov VARCHAR(150);

-- 2. Backfill data lama dari nama cabor
UPDATE kepengurusan k
SET pemprov = c.nama_cabor
FROM cabor c
WHERE k.cabor_id = c.id
  AND k.pemprov IS NULL;

-- 3. cabor_id tidak lagi wajib
ALTER TABLE kepengurusan ALTER COLUMN cabor_id DROP NOT NULL;

-- 4. Hapus kolom ketua_harian di kedua tabel kepengurusan
ALTER TABLE kepengurusan DROP COLUMN IF EXISTS ketua_harian;
ALTER TABLE kepengurusan_kabupaten DROP COLUMN IF EXISTS ketua_harian;

-- 5. Trigger deaktivasi berbasis pemprov (data lama yang sudah di-backfill ikut berfungsi)
DROP TRIGGER IF EXISTS trg_update_status_kepengurusan ON kepengurusan;

CREATE OR REPLACE FUNCTION fn_update_status_kepengurusan()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE kepengurusan
    SET status_kepengurusan = 'Berakhir',
        updated_at = NOW()
    WHERE pemprov = NEW.pemprov
      AND id <> NEW.id
      AND status_kepengurusan = 'Aktif';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_status_kepengurusan
AFTER INSERT ON kepengurusan
FOR EACH ROW
WHEN (NEW.status_kepengurusan = 'Aktif' AND NEW.pemprov IS NOT NULL)
EXECUTE FUNCTION fn_update_status_kepengurusan();

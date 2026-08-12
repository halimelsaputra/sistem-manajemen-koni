-- ============================================================
-- 009: CEGAH DUPLIKAT DI LEVEL DATABASE (jaring pengaman final)
-- ============================================================
-- Dua bagian:
--   Bagian 1: bersihkan duplikat yang SUDAH ADA (keep id terkecil)
--             agar index unik dapat dibuat (index unik GAGAL jika ada duplikat).
--   Bagian 2: buat index unik (case-insensitive).
--
-- ⚠️ Catatan: bagian 1 MENGHAPUS data duplikat secara permanen.
--    Saat migrasi ini ditulis, yang terhapus hanya:
--      - 3 cabor "panahan" duplikat (id 14,15,16) + 3 cabang_cabor miliknya
--        (tidak ada atlet/prestasi yang hilang — sudah diverifikasi).
--    Urutan hapus: prestasi → atlet → cabang → cabor (aman terhadap FK).

BEGIN;

-- ---------- BAGIAN 1: DEDUPE ----------

-- 1) Prestasi duplikat: kombinasi lengkap sama (keep MIN id)
--    cabang_cabor_id nullable → gunakan COALESCE agar dua "Tanpa Cabang" ikut terdeteksi.
DELETE FROM prestasi p
WHERE p.id NOT IN (
    SELECT MIN(id)
    FROM prestasi
    GROUP BY atlet_id, event_kejuaraan, tanggal, tingkat_lomba, mendali,
             COALESCE(cabang_cabor_id, 0)
);

-- 2) Atlet duplikat: nama + cabor + daerah sama (keep MIN id)
--    Jika atlet duplikat masih punya prestasi, DELETE ditolak (FK prestasi.atlet_id
--    adalah ON DELETE RESTRICT) → migrasi gagal total sebagai pengaman, bukan
--    menghapus atlet yang masih dipakai. (Kondisi saat ini: 0 atlet duplikat.)
DELETE FROM atlet a
WHERE a.id NOT IN (
    SELECT MIN(id)
    FROM atlet
    GROUP BY lower(nama_atlet), cabor_id, lower(kabupaten_kota)
);

-- 3) Cabang cabor duplikat: nama sama dalam cabor yang sama (keep MIN id)
--    Prestasi yang mereferensikannya otomatis NULL via FK ON DELETE SET NULL.
DELETE FROM cabang_cabor b
WHERE b.id NOT IN (
    SELECT MIN(id)
    FROM cabang_cabor
    GROUP BY lower(nama_cabang), cabor_id
);

-- 4) Cabor duplikat: nama sama (keep MIN id)
--    Cabang miliknya ikut terhapus via FK ON DELETE CASCADE.
--    Atlet/kepengurusan milik cabor yang akan dihapus akan MENOLAK delete
--    (FK ON DELETE RESTRICT) — migrasi gagal total (transaksi) bila ada, sebagai
--    pengaman agar tidak menghapus cabor yang masih dipakai.
DELETE FROM cabor c
WHERE c.id NOT IN (
    SELECT MIN(id)
    FROM cabor
    GROUP BY lower(nama_cabor)
);

-- ---------- BAGIAN 2: INDEX UNIK ----------

-- Cabor: satu nama (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_cabor_nama
    ON cabor (lower(nama_cabor));

-- Cabang cabor: satu nama per cabor (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_cabang_cabor_nama
    ON cabang_cabor (cabor_id, lower(nama_cabang));

-- Atlet: satu nama per cabor & daerah (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_atlet_nama_cabor_daerah
    ON atlet (cabor_id, lower(nama_atlet), lower(kabupaten_kota));

-- Prestasi: kombinasi lengkap unik.
-- NULLS NOT DISTINCT (PG15+ / Supabase) → dua prestasi "Tanpa Cabang" identik
-- tetap terdeteksi sebagai duplikat (default Postgres menganggap NULL != NULL).
CREATE UNIQUE INDEX IF NOT EXISTS uq_prestasi_kombinasi
    ON prestasi (atlet_id, event_kejuaraan, tanggal, tingkat_lomba, mendali, cabang_cabor_id)
    NULLS NOT DISTINCT;

COMMIT;

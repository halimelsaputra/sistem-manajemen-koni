-- 013: Tabel kepengurusan kabupaten/kota (KONI Kabupaten/Kota se-Aceh)
-- WAJIB dijalankan di Supabase SQL Editor sebelum fitur halaman Kepengurusan Kabupaten dipakai.
--
-- Struktur: 1 pengurus aktif per kabupaten/kota (mirip kepengurusan per cabor di level
-- provinsi, tapi level wilayah). Status Aktif/Berakhir memakai enum yang sudah ada
-- (status_kepengurusan_enum dari migrasi 004).

CREATE TABLE IF NOT EXISTS kepengurusan_kabupaten (
    id BIGSERIAL PRIMARY KEY,
    kabupaten_kota VARCHAR(255) NOT NULL,   -- harus PERSIS sama dengan atlet.kabupaten_kota
    masa_bakti VARCHAR(50) NOT NULL,        -- contoh: "2024 - 2028"
    nomor_sk VARCHAR(100) NOT NULL,
    tanggal_sk DATE NOT NULL,
    ketua_umum VARCHAR(100) NOT NULL,
    ketua_harian VARCHAR(100),
    sekretaris VARCHAR(100) NOT NULL,
    file_path_sk VARCHAR(255),              -- lokasi dokumen PDF SK di bucket sk-documents
    status_kepengurusan status_kepengurusan_enum NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kepengurusan_kab_kabupaten ON kepengurusan_kabupaten (kabupaten_kota);
CREATE INDEX IF NOT EXISTS idx_kepengurusan_kab_status ON kepengurusan_kabupaten (status_kepengurusan);
CREATE INDEX IF NOT EXISTS idx_kepengurusan_kab_tanggal ON kepengurusan_kabupaten (tanggal_sk);

-- Trigger: saat SK baru berstatus Aktif masuk untuk suatu kabupaten/kota,
-- seluruh pengurus Aktif lain di kabupaten yang sama otomatis jadi Berakhir
-- (hanya satu pengurus aktif per wilayah — konsisten dengan kepengurusan provinsi).
CREATE OR REPLACE FUNCTION fn_update_status_kepengurusan_kab()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE kepengurusan_kabupaten
    SET status_kepengurusan = 'Berakhir',
        updated_at = NOW()
    WHERE kabupaten_kota = NEW.kabupaten_kota
      AND id <> NEW.id
      AND status_kepengurusan = 'Aktif';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_status_kepengurusan_kab ON kepengurusan_kabupaten;

CREATE TRIGGER trg_update_status_kepengurusan_kab
AFTER INSERT ON kepengurusan_kabupaten
FOR EACH ROW
WHEN (NEW.status_kepengurusan = 'Aktif')
EXECUTE FUNCTION fn_update_status_kepengurusan_kab();

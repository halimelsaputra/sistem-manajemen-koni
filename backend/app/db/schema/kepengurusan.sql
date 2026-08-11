DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_kepengurusan_enum') THEN
        CREATE TYPE status_kepengurusan_enum AS ENUM ('Aktif', 'Berakhir');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS kepengurusan (
    id BIGSERIAL PRIMARY KEY,
    cabor_id BIGINT NOT NULL REFERENCES cabor(id) ON DELETE RESTRICT,
    masa_bakti VARCHAR(50) NOT NULL,       -- contoh: "2024 - 2028"
    nomor_sk VARCHAR(100) NOT NULL,
    tanggal_sk DATE NOT NULL,
    ketua_umum VARCHAR(100) NOT NULL,
    ketua_harian VARCHAR(100),
    sekretaris VARCHAR(100) NOT NULL,
    file_path_sk VARCHAR(255),             -- lokasi dokumen PDF SK (dikelola modul Security)
    status_kepengurusan status_kepengurusan_enum NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kepengurusan_cabor_id ON kepengurusan (cabor_id);
CREATE INDEX IF NOT EXISTS idx_kepengurusan_status ON kepengurusan (status_kepengurusan);
CREATE INDEX IF NOT EXISTS idx_kepengurusan_tanggal_sk ON kepengurusan (tanggal_sk);


CREATE OR REPLACE FUNCTION fn_update_status_kepengurusan()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE kepengurusan
    SET status_kepengurusan = 'Berakhir',
        updated_at = NOW()
    WHERE cabor_id = NEW.cabor_id
      AND id <> NEW.id
      AND status_kepengurusan = 'Aktif';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_status_kepengurusan ON kepengurusan;

CREATE TRIGGER trg_update_status_kepengurusan
AFTER INSERT ON kepengurusan
FOR EACH ROW
WHEN (NEW.status_kepengurusan = 'Aktif')
EXECUTE FUNCTION fn_update_status_kepengurusan();
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mendali_enum') THEN
        CREATE TYPE mendali_enum AS ENUM ('Emas', 'Perak', 'Perunggu', 'Tanpa Medali');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tingkat_lomba_enum') THEN
        CREATE TYPE tingkat_lomba_enum AS ENUM ('Daerah', 'Nasional', 'Internasional');
    END IF;
END$$;

create table if not exists prestasi (
    id bigserial primary key,
    atlet_id bigint not null references atlet(id) on delete restrict,
    event_kejuaraan varchar(255) not null,
    tanggal date not null,
    tingkat_lomba tingkat_lomba__enum not null,
    mendali mendali_enum not null default "tidak mendapat peringkat",
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

create index if not exists idx-prestasi-atlet_id on prestasi(atlet_id);
create index if not exists idx-prestasi-tanggal on prestasi(tanggal);
CREATE INDEX IF NOT EXISTS idx_prestasi_medali ON prestasi (medali);

create index if not exists idx-prestasi-tanggal_mendali on prestasi(tanggal, mendali);

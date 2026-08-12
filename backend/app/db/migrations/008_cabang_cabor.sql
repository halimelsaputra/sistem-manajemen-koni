-- 008: Cabang Cabor (sub-cabang dari sebuah cabor, mis. Renang → "Renang 200 meter", "Renang 300 meter")
-- WAJIB dijalankan di Supabase SEBELUM backend versi ini di-deploy (query backend sudah mereferensikan tabel ini).

-- Tabel cabang cabor
create table if not exists cabang_cabor (
    id bigserial primary key,
    cabor_id bigint not null references cabor(id) on delete cascade,
    nama_cabang varchar(150) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_cabang_cabor_cabor_id on cabang_cabor(cabor_id);
create index if not exists idx_cabang_cabor_nama on cabang_cabor(nama_cabang);

-- Kolom opsional di prestasi: cabang spesifik yang dipertandingkan
-- (on delete set null → menghapus cabang tidak menghapus prestasi, hanya mengosongkan referensinya)
alter table prestasi add column if not exists cabang_cabor_id bigint references cabang_cabor(id) on delete set null;
create index if not exists idx_prestasi_cabang_cabor_id on prestasi(cabang_cabor_id);

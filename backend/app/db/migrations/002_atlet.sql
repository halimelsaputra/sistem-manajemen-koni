create table if not exists atlet (
    id bigserial primary key,
    nama_atlet varchar(255) not null,
    kabupaten_kota varchar(255) not null,
    cabor_id bigint not null references cabor(id) on delete restrict,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp);

create index if not exists idx_atlet_nama on atlet(nama_atlet);
create index if not exists idx_atlet_kabupaten_kota on atlet(kabupaten_kota);
create index if not exists idx_atlet_cabor_id on atlet(cabor_id);

CREATE INDEX IF NOT EXISTS idx_atlet_kabkota_cabor ON atlet (kabupaten_kota, cabor_id);

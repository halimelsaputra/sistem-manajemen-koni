create table if not exists cabor(
    id bigserial primary key,
    nama_cabor varchar(100) not null,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW()
);
create index if not exists idx_cabor_nama on cabor(nama_cabor);

create table cabor(
    id bigserial primary key,
    nama_cabor varchar(100) not null,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW()
);
create index if not exists idx-cabor-nama on cabor(nama_cabor);
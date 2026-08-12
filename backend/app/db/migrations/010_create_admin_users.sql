-- 010: Tabel pengguna sistem (admin) + seed 23 admin wilayah
-- WAJIB dijalankan di Supabase SQL Editor SEBELUM backend versi ini di-deploy.
--
-- Daftar akun admin wilayah (password default: koni2024):
--   admin.banda-aceh = Banda Aceh
--   admin.aceh-besar = Aceh Besar
--   admin.pidie = Pidie
--   admin.lhokseumawe = Lhokseumawe
--   admin.aceh-timur = Aceh Timur
--   admin.bireuen = Bireuen
--   admin.aceh-utara = Aceh Utara
--   admin.langsa = Langsa
--   admin.aceh-barat = Aceh Barat
--   admin.aceh-tengah = Aceh Tengah
--   admin.sabang = Sabang
--   admin.aceh-jaya = Aceh Jaya
--   admin.pidie-jaya = Pidie Jaya
--   admin.aceh-tamiang = Aceh Tamiang
--   admin.aceh-selatan = Aceh Selatan
--   admin.subulussalam = Subulussalam
--   admin.bener-meriah = Bener Meriah
--   admin.nagan-raya = Nagan Raya
--   admin.gayo-lues = Gayo Lues
--   admin.aceh-tenggara = Aceh Tenggara
--   admin.simeulue = Simeulue
--   admin.aceh-singkil = Aceh Singkil
--   admin.aceh-barat-daya = Aceh Barat Daya
-- ⚠️ Segera ganti password masing-masing via menu "Ubah Kata Sandi" setelah login pertama.

create table if not exists admin_users (
    id bigserial primary key,
    username varchar(100) not null unique,
    password_hash text not null,
    role varchar(20) not null default 'admin_wilayah'
        check (role in ('superadmin', 'admin_wilayah')),
    kabupaten_kota varchar(255),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_admin_users_role on admin_users(role);
create index if not exists idx_admin_users_kabupaten on admin_users(kabupaten_kota);

-- Seed 23 admin wilayah.
-- Nilai kabupaten_kota harus PERSIS sama dengan nilai pada tabel atlet (case-sensitive).
insert into admin_users (username, password_hash, role, kabupaten_kota) values
('admin.banda-aceh', '741a61b1456ec6bf6589f0035ab1b642:b0c7b2d4c5b7cbc40c6c4400b1bce1f7c980516db2a4e37231333c4b6b6f7692f359dbd111415d1f42a1e6fd1f3142346cd04d529405186ed41e42aa201bdc69', 'admin_wilayah', 'Banda Aceh'),
('admin.aceh-besar', '8b350ea67e8d7a4a9f726b9f4a54bc22:1ea99c7fe01b499427db8ee0c9468c5e4b341ee89dd544751d6959e7f30e678c0e313dbc9fadc81db90c30af5fca075b314550bf0bca86559b6b4840ae3fc2ba', 'admin_wilayah', 'Aceh Besar'),
('admin.pidie', 'cdddfbe523c10a200b9370fb0e064680:0e58be4040e5ed5bcb7cf302a069c64a3a6587e6e3efa4a0e89f6b9acb3a207b27be0d33209d6c75788404604b410117883231a034dbe63d72210ae02055f719', 'admin_wilayah', 'Pidie'),
('admin.lhokseumawe', '9d5937ac847e8e159bd4403399a05a37:a27f1776a3377552f00c650930465841e24034e0623158b53a64095c70931c40840dc41d6023ecd3cbda9d3d36d5d29458ddde90d7edddaf5011a07d2adffc9a', 'admin_wilayah', 'Lhokseumawe'),
('admin.aceh-timur', 'e6f8bce2c4aa78e7b1627d569ed344cb:100301649d36cff4c03d438fd3ee2fd38b67911dd7c075edd7673989e911396f85b7a9e0714d27f8cbc0fb4fa316d9014b4ac2ac5f531674bb5a334907320e04', 'admin_wilayah', 'Aceh Timur'),
('admin.bireuen', 'aa56c84f21e02992e3bc159f0fbd72ea:012bff854606dbc0b267bb850d17966b77d62c25ff66226f8ba97ba98b768085a14ae488b3ea4228fe4a4218fea4b6deb646f889b5b4c60fc1252b3d61210799', 'admin_wilayah', 'Bireuen'),
('admin.aceh-utara', '2e0b109dec1fb67e275f59683a8df2e0:ca58f0dad21f72bcc2098718024f363a3ef548d8a6d76abaff34ebc82ac259968779b2dafac96695bdfbe07219dcaee8a16f19bca4ab3cdc8e59ace828490c85', 'admin_wilayah', 'Aceh Utara'),
('admin.langsa', 'b9cca818f5e255bd20fe0c98fde031cb:510283dc9decbd54f6f8fc905d76a5c1e0b178cda60dc25d8b2f1937f11d7d8d45bd5d0590c8dce85e1f81b763e5c6faf3a0631a54704cdc0056a8b2f38caddf', 'admin_wilayah', 'Langsa'),
('admin.aceh-barat', '11c2d70fde78b6aff428feeefe045436:cb346b4606c3f6a105c4748635a81cc6f83a547561dbe2d7df364bffbd438e1050b881ba39e9e24603dadd5c0b360809ace8670b70c2c05b5210f3ada99bb76a', 'admin_wilayah', 'Aceh Barat'),
('admin.aceh-tengah', '809b9788db79c849be84a1af43f2c523:131f7ea36b0974189c8f7cb19b9e5c6c3dee992a4c109c015ca7748e66d72226a896fbe328ef4d3c459e3aba00adb2fa692e99457c50936b6b1ecf5b0f94fc4c', 'admin_wilayah', 'Aceh Tengah'),
('admin.sabang', '55beea8ca827264c396ae6f95ff1a22b:9fe285d6e6df6045e46945df291f689a01060d29285227509e8f12eda9c66cef06654e5f4ceae2b750561c1da4399225229315ba4cf5126210ecdbbd293587cb', 'admin_wilayah', 'Sabang'),
('admin.aceh-jaya', '93dfbc88cc6fef65298f1321e6c792a6:f0f0a461d53506c9dedad40ef6acc4f37798ef5bb14adda674e414302204f6c8e5d8121e9031c9ea28e006f0f791501d4bf462b0c791cb6ab84068248e62dd3b', 'admin_wilayah', 'Aceh Jaya'),
('admin.pidie-jaya', '2f424e084150f886e81fc466dfff6396:88d92a00ea05cf96653a1742341b688014f1dd13194ee988aed40df2b556590fd37f9eb2580fcd216ab2b104950136e3251a5f024f1463f1b2ce08fdd18c2f42', 'admin_wilayah', 'Pidie Jaya'),
('admin.aceh-tamiang', 'b5705281f8b3fc08983b7d147375db1b:765cab6f89f805bf2da17d1441af584268d32b7bf56347d5f068db8ea38b3d7b748116da6a44acd39246c3386df72ce9362d0e0bf0518dce99061f3c435dd62c', 'admin_wilayah', 'Aceh Tamiang'),
('admin.aceh-selatan', '212a7757e26740f2f524e5cb17180bdb:a9f8c2af1f506be09640adb37c97a4381482cabf73c4696845f1324921f3ef2af450119bcf08adf36836e42446fbbb10dc745b86fdd16c9286640f2a282cc14a', 'admin_wilayah', 'Aceh Selatan'),
('admin.subulussalam', '243ae7094b7d0ef8d59c02e819dbac9c:c50041760eed62fbffbabc25680f6f83b0a9df395559650689566f30ab7b6819e6b2f814dc19a77458b7e2dab1706b53d9409c57a1f216fd14d57e81ec4cbe2a', 'admin_wilayah', 'Subulussalam'),
('admin.bener-meriah', '1fb4a4b12d05670df0068d49b7b950dd:debb9fce639fa01a55c1aefca47ca259925845898aa516c1cc8d4d409a2d0d3e539299cd28407285768f50c7a732983308ffe3b4873b7a1301b3bda27c4e1ff4', 'admin_wilayah', 'Bener Meriah'),
('admin.nagan-raya', 'd34f2491d18b7464e68f22ef0cdfe627:f3d1179ca003ef6cc38114b763cd07e1d7cedcdb9e1abad6cb1aadb9694169714ceab18ffba58bb346cfbbbdd80d18ac422224d8f1ff71594848e55ab35ee2c0', 'admin_wilayah', 'Nagan Raya'),
('admin.gayo-lues', 'e6f838a4b940f9561d257c750a455aa9:ede2b7ec3588cef7c48f79605037116ff6d4c540c27a375bcbfcfc958b9fe594b8fed37afd69fd9f35a2624d2049d6b0a2fbe60fcd0ac81e86d3595afb4e7a19', 'admin_wilayah', 'Gayo Lues'),
('admin.aceh-tenggara', '5642358e72487e6f57d1db3e684e9bee:67f9b55f626818759bd0a8edc4c42f3b83f421496183556eb57345839ce2c3f26bf5ebb8e4a28f6ae6f9a9d5886f701b1637683e9f8a274ffed58bd2b322b2bf', 'admin_wilayah', 'Aceh Tenggara'),
('admin.simeulue', 'd37f32797bb59180209dc31bcf073e06:c723a701bad36b27ec70296564c877f1352f1a16f38229ea460b0fd2fba689f9ad60bb2f1193ce7036c595b4c1cfc9eddb789832c7f4e2fcd7539da113b6d9c0', 'admin_wilayah', 'Simeulue'),
('admin.aceh-singkil', '88a5898922cdc09edeb1e7533bf9c090:e82afa18bc723ead67d9d8f4578810eca42329b03afb64816d5b31dcc81f196146778ee6fb5f674a9ce3259546929cff9f72710633380375eb4d28ab49eb7e3f', 'admin_wilayah', 'Aceh Singkil'),
('admin.aceh-barat-daya', '5ac01344a6defe396ceaf1b560e7ad95:2cffd4e49252a8e51a54ec0098a6a9254411934cc19842efa2289d024365b0ba8564321b3e463818fb42e7164f898857a067823ead5121253669ef3399643c72', 'admin_wilayah', 'Aceh Barat Daya')
on conflict (username) do nothing;

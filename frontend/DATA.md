# Skema Data SI-KONI Aceh

## Ringkasan

Dua data utama yang dikelola admin:
1. **Prestasi** — pencapaian atlet di suatu kejuaraan
2. **SK Kepengurusan** — dokumen resmi kepengurusan cabor

---

## Reference Tables

### `wilayah` — 23 kabupaten/kota

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | SERIAL PK | |
| `nama` | VARCHAR(100) UNIQUE | Banda Aceh, Aceh Besar, dll |
| `kode_bps` | VARCHAR(10) | Cocokkan dengan GeoJSON `11-01` |

### `cabor` — cabang olahraga

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | SERIAL PK | |
| `nama` | VARCHAR(100) UNIQUE | Atletik, Renang, dll |
| `singkatan` | VARCHAR(50) | PASI, PRSI, dll |

---

## Master Tables

### `atlet` — data atlet

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | SERIAL PK | |
| `nama` | VARCHAR(200) NOT NULL | |
| `wilayah_id` | INT FK → wilayah | Asal daerah |
| `jenis_kelamin` | CHAR(1) | L / P |
| `tanggal_lahir` | DATE | |
| `no_registrasi` | VARCHAR(50) UNIQUE | Nomor induk atlet |
| `created_at` | TIMESTAMP | |

---

## Transaction Tables

### `prestasi` — pencapaian atlet

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | SERIAL PK | |
| `atlet_id` | INT FK → atlet | |
| `cabor_id` | INT FK → cabor | |
| `nama_event` | VARCHAR(200) | PORA XIV, PON XXI |
| `tanggal` | DATE | Tanggal kejuaraan (format YYYY-MM-DD, seperti `tanggal_sk`) |
| `tingkat` | VARCHAR(20) | Provinsi / Nasional / Internasional |
| `medali` | VARCHAR(20) | Emas / Perak / Perunggu / Tanpa Medali |
| `metadata_dinamis` | JSONB DEFAULT '{}' | Skor dinamis per cabor |
| `created_at` | TIMESTAMP | |

### `kepengurusan` — SK kepengurusan cabor

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | SERIAL PK | |
| `cabor_id` | INT FK → cabor | |
| `masa_bakti_mulai` | INT | Tahun mulai |
| `masa_bakti_selesai` | INT | Tahun selesai |
| `nomor_sk` | VARCHAR(100) | SK/012/KONI-ACEH/2024 |
| `tanggal_sk` | DATE | Tanggal penetapan |
| `ketua_umum` | VARCHAR(200) | |
| `ketua_harian` | VARCHAR(200) | Opsional |
| `sekretaris` | VARCHAR(200) | |
| `file_path_sk` | VARCHAR(500) | Path file PDF |
| `created_at` | TIMESTAMP | |

---

## Relasi

```
wilayah 1──→ N atlet 1──→ N prestasi N←──1 cabor 1──→ N kepengurusan
```

---

## Contoh `metadata_dinamis` (JSONB)

| Cabor | Contoh Isi |
|-------|-----------|
| Atletik | `{"catatan_waktu_detik": 10.45, "nomor_lintasan": 4}` |
| Renang | `{"gaya_renang": "Gaya Bebas 100m", "waktu_tempuh": "00:58.21"}` |
| Tarung Derajat | `{"jumlah_ronde_menang": 3, "kelas_tanding": "Kelas 60kg Putra"}` |
| Panahan | `{"total_skor_kualifikasi": 675, "busur_digunakan": "Recurve 70m"}` |

---

## Dashboard Queries

| KPI | Query |
|-----|-------|
| Total Atlet | `SELECT COUNT(DISTINCT atlet_id) FROM prestasi` |
| Total Cabor | `SELECT COUNT(DISTINCT cabor_id) FROM prestasi` |
| Total Event | `SELECT COUNT(DISTINCT nama_event \|\| tanggal) FROM prestasi` |
| Emas per Wilayah | JOIN prestasi → atlet → wilayah, WHERE medali='Emas', GROUP BY wilayah |
| EWS SK | `masa_bakti_selesai - EXTRACT(YEAR FROM NOW()) <= 1` |

---

## Status

- [x] Skema direncanakan
- [ ] Buat tabel di database
- [ ] Seed data reference tables (wilayah, cabor)
- [ ] Hubungkan frontend ke API
- [ ] Input form sesuai skema baru

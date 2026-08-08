# Dokumentasi REST API - Sistem Manajemen KONI
## Richardson Maturity Model (RMM) - Level 2

Dokumentasi ini disusun berdasarkan **Richardson Maturity Model Level 2**, yang memanfaatkan:
1. **URI sebagai Identitas Resource** (contoh: `/api/atlet`, `/api/atlet/[id]`).
2. **HTTP Verbs secara Tepat** (`GET` untuk mengambil data, `POST` untuk membuat data baru, `PUT` untuk memperbarui data, dan `DELETE` untuk menghapus data).
3. **HTTP Status Codes** (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`) untuk merepresentasikan hasil pemrosesan.

---

## Ringkasan Status Kesiapan API

Berikut adalah status kesiapan seluruh endpoint untuk digunakan oleh Front-End:

### 🟢 FIKS (Siap Digunakan)
*   **Modul Atlet:** `GET /api/atlet`, `POST /api/atlet`, `GET /api/atlet/[id]`, `PUT /api/atlet/[id]`, `DELETE /api/atlet/[id]`
*   **Modul Cabor:** `GET /api/cabor`, `POST /api/cabor`, `GET /api/cabor/[id]`, `PUT /api/cabor/[id]`, `DELETE /api/cabor/[id]`
*   **Modul Kepengurusan:** `GET /api/kepengurusan`, `POST /api/kepengurusan`, `GET /api/kepengurusan/[id]`, `PUT /api/kepengurusan/[id]`, `DELETE /api/kepengurusan/[id]`
*   **Modul Prestasi:** `GET /api/prestasi`, `POST /api/prestasi`, `GET /api/prestasi/[id]`, `PUT /api/prestasi/[id]`, `DELETE /api/prestasi/[id]`
*   **Modul Dashboard:** `GET /api/dashboard` (Mendukung data dasar, sebaran peta medali per wilayah, dan peringatan kedaluwarsa SK kepengurusan).

---

## Konvensi Pagination (Semua List Endpoint)

Seluruh list endpoint (`GET /api/atlet`, `GET /api/cabor`, `GET /api/kepengurusan`, `GET /api/prestasi`) mendukung pagination server-side:

*   **Query Parameters (Opsional):**
    *   `page` (number): Nomor halaman, dimulai dari 1 (default: `1`).
    *   `pageSize` (number): Jumlah data per halaman (default: `20`, maksimum: `100`).
*   **Perilaku:**
    *   Jika **`page` atau `pageSize` diberikan**, response `data` berbentuk objek:
        ```json
        {
          "items": [ ... ],
          "pagination": {
            "page": 1,
            "pageSize": 20,
            "total": 352,
            "totalPages": 18
          }
        }
        ```
    *   Jika **keduanya tidak diberikan**, endpoint mengembalikan **seluruh data sebagai array** (mode kompatibilitas) — dipakai untuk kebutuhan yang memang butuh semua data, misalnya dropdown atlet/cabor dan grafik tren dashboard.
*   **Filter server-side:** seluruh filter pada endpoint berlaku di **seluruh dataset** (bukan hanya halaman aktif), karena diterapkan di query database sebelum pagination.

---

## 1. Modul: Dashboard

Endpoint ini menyuplai data statistik untuk halaman utama Dashboard.

### `GET /api/dashboard` `[FIKS]`
Mengambil data ringkasan statistik, data persebaran medali wilayah, dan peringatan kedaluwarsa SK.

*   **Status Kode RMM Level 2:** `200 OK` (Sukses), `500 Internal Server Error` (Gagal).
*   **Response Headers:** `Content-Type: application/json`

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data dashboard berhasil diambil",
  "data": {
    "totalAtlet": 150,
    "totalCabor": 23,
    "totalPrestasi": 352,
    "totalKepengurusan": 23,
    "medalsByRegion": [
      {
        "kabupaten_kota": "Banda Aceh",
        "total_emas": 45,
        "total_perak": 30,
        "total_perunggu": 15
      }
    ],
    "skWarnings": [
      {
        "id": 1,
        "cabor": "Atletik",
        "nomor_sk": "SK-001",
        "tanggal_sk": "2020-01-15",
        "masa_bakti": "2020-2024",
        "expiry_date": "2024-01-14",
        "days_remaining": -927,
        "is_expired": true
      }
    ]
  }
}
```

#### Catatan Kesesuaian Desain UI Dashboard:
*   **Total Medali Emas Regional (UI: 352)**: Front-End dapat menghitung total medali emas dengan menjumlahkan seluruh atribut `total_emas` di dalam array `medalsByRegion`.
*   **Peta Wilayah & Medali (UI: Persebaran 23 Wilayah)**: Array `medalsByRegion` berisi daftar perolehan medali untuk 23 kabupaten/kota di Aceh yang dapat langsung diplot di peta.
*   **Early Warning System SK Kedaluwarsa (UI Warning)**: Properti `skWarnings` menyuplai daftar SK aktif kepengurusan cabor yang telah kedaluwarsa atau segera kedaluwarsa dalam waktu kurang dari 3 bulan (90 hari).

---

## 2. Modul: Cabang Olahraga (Cabor)

Mengelola data master cabang olahraga.

### `GET /api/cabor`
Mendapatkan daftar seluruh cabang olahraga dengan pencarian.

*   **Query Parameters (Opsional):**
    *   `search` (string): Pencarian nama cabor (sebagian nama, case-insensitive).
*   **Status Kode RMM Level 2:** `200 OK` (Ditemukan), `404 Not Found` (Data kosong), `500 Internal Server Error`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data cabor berhasil diambil",
  "data": [
    {
      "id": 1,
      "nama_cabor": "Pencak Silat",
      "created_at": "2026-07-28T09:39:14.000Z",
      "updated_at": "2026-07-28T09:39:14.000Z"
    }
  ]
}
```

### `POST /api/cabor`
Membuat cabang olahraga baru.

*   **Request Body (JSON):**
    ```json
    {
      "nama_cabor": "Taekwondo"
    }
    ```
*   **Status Kode RMM Level 2:** `201 Created` (Sukses dibuat), `400 Bad Request` (Validasi gagal), `500 Internal Server Error`.

#### Response Sukses (`201 Created`)
```json
{
  "status": "success",
  "message": "data cabor berhasil ditambahkan",
  "data": {
    "id": 2,
    "nama_cabor": "Taekwondo",
    "created_at": "2026-07-30T15:19:32.000Z",
    "updated_at": "2026-07-30T15:19:32.000Z"
  }
}
```

### `GET /api/cabor/[id]`
Mengambil data detail cabor tertentu berdasarkan ID.

*   **Status Kode RMM Level 2:** `200 OK` (Ditemukan), `404 Not Found` (Cabor tidak terdaftar).

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data cabor berhasil diambil",
  "data": {
    "id": 1,
    "nama_cabor": "Pencak Silat",
    "created_at": "2026-07-28T09:39:14.000Z",
    "updated_at": "2026-07-28T09:39:14.000Z"
  }
}
```

### `PUT /api/cabor/[id]`
Memperbarui data cabor tertentu.

*   **Request Body (JSON):**
    ```json
    {
      "nama_cabor": "Pencak Silat Kategori A"
    }
    ```
*   **Status Kode RMM Level 2:** `200 OK` (Sukses update), `400 Bad Request` (Validasi gagal), `404 Not Found`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data cabor berhasil diperbarui",
  "data": {
    "id": 1,
    "nama_cabor": "Pencak Silat Kategori A",
    "created_at": "2026-07-28T09:39:14.000Z",
    "updated_at": "2026-07-30T15:19:32.000Z"
  }
}
```

### `DELETE /api/cabor/[id]`
Menghapus cabor berdasarkan ID.

*   **Status Kode RMM Level 2:** `200 OK` (Sukses terhapus), `404 Not Found`, `500 Internal Server Error` (Gagal jika masih dirujuk oleh tabel atlet/kepengurusan - Foreign Key Restrict).

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data cabor berhasil dihapus"
}
```

---

## 3. Modul: Atlet

Mengelola profil atlet. Dapat diintegrasikan secara inline di dalam form prestasi Front-End.

### `GET /api/atlet`
Mendapatkan daftar atlet dengan pencarian dan filter.

*   **Query Parameters (Opsional):**
    *   `search` (string): Pencarian nama atlet (sebagian nama, case-insensitive).
    *   `kabupaten_kota` (string): Menyaring asal wilayah atlet secara presisi.
    *   `cabor_id` (number): Menyaring berdasarkan cabang olahraga.
    *   `page` (number): Nomor halaman (default: `1`).
    *   `pageSize` (number): Data per halaman (default: `20`, maks: `100`).
*   **Status Kode RMM Level 2:** `200 OK`, `404 Not Found` (Atlet kosong), `500 Internal Server Error`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data berhasil diambil",
  "data": [
    {
      "id": 10,
      "nama_atlet": "Ahmad Dani",
      "kabupaten_kota": "Banda Aceh",
      "cabor_id": 1,
      "created_at": "2026-07-28T09:39:14.000Z",
      "updated_at": "2026-07-28T09:39:14.000Z",
      "cabor": {
        "nama_cabor": "Pencak Silat"
      }
    }
  ]
}
```

### `POST /api/atlet`
Membuat data atlet baru.

*   **Request Body (JSON):**
    ```json
    {
      "nama_atlet": "Budi Santoso",
      "kabupaten_kota": "Aceh Besar",
      "cabor_id": 1
    }
    ```
*   **Status Kode RMM Level 2:** `201 Created`, `400 Bad Request` (Kolom wajib ada yang kosong), `500 Internal Server Error`.

#### Response Sukses (`201 Created`)
```json
{
  "status": "success",
  "message": "data atlet berhasil ditambahkan",
  "data": {
    "id": 11,
    "nama_atlet": "Budi Santoso",
    "kabupaten_kota": "Aceh Besar",
    "cabor_id": 1,
    "created_at": "2026-07-30T15:19:32.000Z",
    "updated_at": "2026-07-30T15:19:32.000Z",
    "cabor": {
      "nama_cabor": "Pencak Silat"
    }
  }
}
```

### `GET /api/atlet/[id]`
Mengambil detail atlet tertentu.

*   **Status Kode RMM Level 2:** `200 OK`, `404 Not Found`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data berhasil diambil",
  "data": {
    "id": 10,
    "nama_atlet": "Ahmad Dani",
    "kabupaten_kota": "Banda Aceh",
    "cabor_id": 1,
    "created_at": "2026-07-28T09:39:14.000Z",
    "updated_at": "2026-07-28T09:39:14.000Z",
    "cabor": {
      "nama_cabor": "Pencak Silat"
    }
  }
}
```

### `PUT /api/atlet/[id]`
Memperbarui data atlet.

*   **Request Body (JSON, Parsial/Opsional):**
    ```json
    {
      "nama_atlet": "Ahmad Dani Jr."
    }
    ```
*   **Status Kode RMM Level 2:** `200 OK`, `400 Bad Request`, `404 Not Found`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data atlet berhasil diperbarui",
  "data": {
    "id": 10,
    "nama_atlet": "Ahmad Dani Jr.",
    "kabupaten_kota": "Banda Aceh",
    "cabor_id": 1,
    "created_at": "2026-07-28T09:39:14.000Z",
    "updated_at": "2026-07-30T15:19:32.000Z"
  }
}
```

### `DELETE /api/atlet/[id]`
Menghapus atlet berdasarkan ID.

*   **Status Kode RMM Level 2:** `200 OK`, `404 Not Found`, `500 Internal Server Error` (Gagal jika masih dirujuk oleh tabel prestasi).

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data atlet berhasil dihapus"
}
```

---

## 4. Modul: Kepengurusan

Mengelola administrasi kepengurusan cabang olahraga dan arsip SK.

### `GET /api/kepengurusan`
Mengambil daftar riwayat kepengurusan cabor (menyuplai tabel **Arsip Histori Kepengurusan Cabor**).

*   **Query Parameters (Opsional):**
    *   `cabor_id` (number): Menyaring kepengurusan berdasarkan cabang olahraga.
    *   `status_kepengurusan` (string): `"Aktif"` atau `"Berakhir"`.
    *   `search` (string): Pencarian nama cabor, ketua_umum, ketua_harian, sekretaris, atau nomor_sk.
    *   `page` (number): Nomor halaman (default: `1`).
    *   `pageSize` (number): Data per halaman (default: `20`, maks: `100`).
*   **Status Kode RMM Level 2:** `200 OK`, `404 Not Found`, `500 Internal Server Error`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data kepengurusan berhasil diambil",
  "data": [
    {
      "id": 5,
      "cabor_id": 1,
      "masa_bakti": "2024 - 2028",
      "nomor_sk": "SK-KONI-2024-099",
      "tanggal_sk": "2024-05-15",
      "ketua_umum": "Budi Santoso",
      "ketua_harian": "M. Alwi",
      "sekretaris": "Farida",
      "file_path_sk": "uploads/sk/sk-koni-2024-099.pdf",
      "status_kepengurusan": "Aktif",
      "created_at": "2026-07-28T09:39:14.000Z",
      "updated_at": "2026-07-28T09:39:14.000Z",
      "cabor": {
        "nama_cabor": "Pencak Silat"
      }
    }
  ]
}
```

### `POST /api/kepengurusan`
Menambahkan data kepengurusan baru beserta dokumen SK (UI: **+ Tambah SK**).
*Pemberlakuan trigger PostgreSQL otomatis merubah status kepengurusan aktif yang lama untuk cabor ini menjadi 'Berakhir'.*

*   **Request Body (JSON):**
    ```json
    {
      "cabor_id": 1,
      "masa_bakti": "2026 - 2030",
      "nomor_sk": "SK-KONI-2026-101",
      "tanggal_sk": "2026-07-30",
      "ketua_umum": "Zulkifli",
      "ketua_harian": "T. Iskandar",
      "sekretaris": "Cut Nyak",
      "file_path_sk": "uploads/sk/sk-koni-2026-101.pdf",
      "status_kepengurusan": "Aktif"
    }
    ```
*   **Status Kode RMM Level 2:** `201 Created`, `400 Bad Request`, `500 Internal Server Error`.

#### Response Sukses (`201 Created`)
```json
{
  "status": "success",
  "message": "data kepengurusan berhasil ditambahkan",
  "data": {
    "id": 6,
    "cabor_id": 1,
    "masa_bakti": "2026 - 2030",
    "nomor_sk": "SK-KONI-2026-101",
    "tanggal_sk": "2026-07-30",
    "ketua_umum": "Zulkifli",
    "ketua_harian": "T. Iskandar",
    "sekretaris": "Cut Nyak",
    "file_path_sk": "uploads/sk/sk-koni-2026-101.pdf",
    "status_kepengurusan": "Aktif",
    "created_at": "2026-07-30T15:19:32.000Z",
    "updated_at": "2026-07-30T15:19:32.000Z",
    "cabor": {
      "nama_cabor": "Pencak Silat"
    }
  }
}
```

### `PUT /api/kepengurusan/[id]`
Memperbarui data kepengurusan.

*   **Request Body (JSON, Parsial/Opsional):**
    ```json
    {
      "status_kepengurusan": "Berakhir"
    }
    ```
*   **Status Kode RMM Level 2:** `200 OK`, `400 Bad Request`, `404 Not Found`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data kepengurusan berhasil diperbarui",
  "data": {
    "id": 5,
    "cabor_id": 1,
    "status_kepengurusan": "Berakhir",
    "updated_at": "2026-07-30T15:19:32.000Z"
  }
}
```

### `DELETE /api/kepengurusan/[id]`
Menghapus arsip kepengurusan berdasarkan ID.

*   **Status Kode RMM Level 2:** `200 OK`, `404 Not Found`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data kepengurusan berhasil dihapus"
}
```

---

## 5. Modul: Prestasi

Mengelola pencapaian prestasi atlet regional (menyuplai tabel **Database Prestasi Regional**).

### `GET /api/prestasi`
Mengambil daftar prestasi beserta informasi atlet dan cabornya.

*   **Query Parameters (Opsional):**
    *   `atlet_id` (number): Menyaring prestasi atlet tertentu.
    *   `tingkat_lomba` (string): `"Daerah"`, `"Nasional"`, atau `"Internasional"`.
    *   `mendali` (string): `"Emas"`, `"Perak"`, `"Perunggu"`, atau `"Tanpa Medali"`.
    *   `tanggal` (string): Menyaring tanggal perolehan prestasi (format `YYYY-MM-DD`).
    *   `cabor_id` (number): Menyaring berdasarkan cabang olahraga atlet (filter relasi `atlet.cabor_id`).
    *   `kabupaten_kota` (string): Menyaring berdasarkan asal daerah atlet (filter relasi `atlet.kabupaten_kota`).
    *   `search` (string): Pencarian nama event kejuaraan (`event_kejuaraan`) **atau** nama atlet (`atlet.nama_atlet`).
    *   `page` (number): Nomor halaman (default: `1`).
    *   `pageSize` (number): Data per halaman (default: `20`, maks: `100`).
*   **Status Kode RMM Level 2:** `200 OK`, `404 Not Found`, `500 Internal Server Error`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data prestasi berhasil diambil",
  "data": [
    {
      "id": 1,
      "atlet_id": 10,
      "event_kejuaraan": "Pekan Olahraga Nasional (PON) XXI",
      "tanggal": "2024-01-15",
      "tingkat_lomba": "Nasional",
      "mendali": "Emas",
      "created_at": "2026-07-28T09:39:14.000Z",
      "updated_at": "2026-07-28T09:39:14.000Z",
      "atlet": {
        "nama_atlet": "Ahmad Dani",
        "kabupaten_kota": "Banda Aceh",
        "cabor": {
          "nama_cabor": "Pencak Silat"
        }
      }
    }
  ]
}
```

### `POST /api/prestasi`
Menambahkan prestasi baru untuk atlet (UI: **+ Tambah Prestasi**).
*Catatan: Pastikan `atlet_id` yang dikirim valid. Jika atlet belum terdaftar, lakukan alur Inline Creation `POST /api/atlet` terlebih dahulu.*

*   **Request Body (JSON):**
    ```json
    {
      "atlet_id": 10,
      "event_kejuaraan": "PON XXI 2024",
      "tanggal": "2024-01-15",
      "tingkat_lomba": "Nasional",
      "mendali": "Emas"
    }
    ```
*   **Status Kode RMM Level 2:** `201 Created`, `400 Bad Request` (Format data salah), `500 Internal Server Error` (Jika `atlet_id` tidak ada di tabel atlet).

#### Response Sukses (`201 Created`)
```json
{
  "status": "success",
  "message": "data prestasi berhasil ditambahkan",
  "data": {
    "id": 2,
    "atlet_id": 10,
    "event_kejuaraan": "PON XXI 2024",
    "tanggal": "2024-01-15",
    "tingkat_lomba": "Nasional",
    "mendali": "Emas",
    "created_at": "2026-07-30T15:19:32.000Z",
    "updated_at": "2026-07-30T15:19:32.000Z",
    "atlet": {
      "nama_atlet": "Ahmad Dani",
      "kabupaten_kota": "Banda Aceh",
      "cabor": {
        "nama_cabor": "Pencak Silat"
      }
    }
  }
}
```

### `GET /api/prestasi/[id]`
Mengambil detail data prestasi.

*   **Status Kode RMM Level 2:** `200 OK`, `404 Not Found`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data prestasi berhasil diambil",
  "data": {
    "id": 1,
    "atlet_id": 10,
    "event_kejuaraan": "Pekan Olahraga Nasional (PON) XXI",
    "tanggal": "2024-01-15",
    "tingkat_lomba": "Nasional",
    "mendali": "Emas",
    "created_at": "2026-07-28T09:39:14.000Z",
    "updated_at": "2026-07-28T09:39:14.000Z",
    "atlet": {
      "nama_atlet": "Ahmad Dani",
      "kabupaten_kota": "Banda Aceh",
      "cabor": {
        "nama_cabor": "Pencak Silat"
      }
    }
  }
}
```

### `PUT /api/prestasi/[id]`
Memperbarui data prestasi.

*   **Request Body (JSON, Parsial/Opsional):**
    ```json
    {
      "mendali": "Perak"
    }
    ```
*   **Status Kode RMM Level 2:** `200 OK`, `400 Bad Request`, `404 Not Found`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data prestasi berhasil diperbarui",
  "data": {
    "id": 1,
    "atlet_id": 10,
    "event_kejuaraan": "Pekan Olahraga Nasional (PON) XXI",
    "tanggal": "2024-01-15",
    "tingkat_lomba": "Nasional",
    "mendali": "Perak",
    "created_at": "2026-07-28T09:39:14.000Z",
    "updated_at": "2026-07-30T15:19:32.000Z"
  }
}
```

### `DELETE /api/prestasi/[id]`
Menghapus data prestasi berdasarkan ID.

*   **Status Kode RMM Level 2:** `200 OK`, `404 Not Found`.

#### Response Sukses (`200 OK`)
```json
{
  "status": "success",
  "message": "data prestasi berhasil dihapus"
}
```

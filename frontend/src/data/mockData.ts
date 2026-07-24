export interface RegionMedal {
  id: string;
  kabupaten_kota: string;
  total_emas: number;
  total_perak: number;
  total_perunggu: number;
  color_density_code: string;
}

export interface AtletPrestasi {
  id: number;
  nama_atlet: string;
  kabupaten_kota: string;
  cabor: string;
  event: string;
  tahun: number;
  tingkat: string;
  medali: 'Emas' | 'Perak' | 'Perunggu' | 'Tanpa Medali';
  metadata_dinamis: Record<string, any>;
}

export interface KepengurusanSK {
  id: number;
  cabor: string;
  masa_bakti: string;
  nomor_sk: string;
  tanggal_sk: string;
  ketua_umum: string;
  ketua_harian?: string;
  sekretaris: string;
  status: 'Aktif' | 'Berakhir';
  file_path_sk: string;
  days_to_expire?: number;
}

export const MOCK_DASHBOARD_LINE_TREND = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
  medal_emas: [42, 60, 55, 58, 95, 82],
};

export const MOCK_DASHBOARD_BAR_STATS = {
  labels: ['PMR', 'KSR', 'TSR', 'DDS', 'KPB'],
  totals: [310, 265, 195, 210, 170],
};

export const MOCK_CABOR_OPTIONS = [
  'Tarung Derajat',
  'Atletik',
  'Renang',
  'Panahan',
  'Anggar',
  'Bola Voli',
  'Bulu Tangkis',
];

export const MOCK_REGIONS: RegionMedal[] = [
  { id: '1', kabupaten_kota: 'Banda Aceh', total_emas: 45, total_perak: 30, total_perunggu: 15, color_density_code: '#1e3a8a' },
  { id: '2', kabupaten_kota: 'Aceh Besar', total_emas: 38, total_perak: 42, total_perunggu: 20, color_density_code: '#1e40af' },
  { id: '3', kabupaten_kota: 'Pidie', total_emas: 32, total_perak: 25, total_perunggu: 22, color_density_code: '#1d4ed8' },
  { id: '4', kabupaten_kota: 'Lhokseumawe', total_emas: 28, total_perak: 20, total_perunggu: 18, color_density_code: '#2563eb' },
  { id: '5', kabupaten_kota: 'Aceh Timur', total_emas: 25, total_perak: 18, total_perunggu: 19, color_density_code: '#3b82f6' },
  { id: '6', kabupaten_kota: 'Bireuen', total_emas: 22, total_perak: 24, total_perunggu: 15, color_density_code: '#3b82f6' },
  { id: '7', kabupaten_kota: 'Aceh Utara', total_emas: 20, total_perak: 22, total_perunggu: 16, color_density_code: '#60a5fa' },
  { id: '8', kabupaten_kota: 'Langsa', total_emas: 18, total_perak: 15, total_perunggu: 14, color_density_code: '#60a5fa' },
  { id: '9', kabupaten_kota: 'Aceh Barat', total_emas: 16, total_perak: 14, total_perunggu: 12, color_density_code: '#93c5fd' },
  { id: '10', kabupaten_kota: 'Aceh Tengah', total_emas: 15, total_perak: 12, total_perunggu: 10, color_density_code: '#93c5fd' },
  { id: '11', kabupaten_kota: 'Sabang', total_emas: 14, total_perak: 10, total_perunggu: 8, color_density_code: '#bfdbfe' },
  { id: '12', kabupaten_kota: 'Aceh Jaya', total_emas: 12, total_perak: 11, total_perunggu: 9, color_density_code: '#bfdbfe' },
  { id: '13', kabupaten_kota: 'Pidie Jaya', total_emas: 11, total_perak: 9, total_perunggu: 8, color_density_code: '#dbeafe' },
  { id: '14', kabupaten_kota: 'Aceh Tamiang', total_emas: 10, total_perak: 12, total_perunggu: 11, color_density_code: '#dbeafe' },
  { id: '15', kabupaten_kota: 'Aceh Selatan', total_emas: 9, total_perak: 8, total_perunggu: 7, color_density_code: '#eff6ff' },
  { id: '16', kabupaten_kota: 'Subulussalam', total_emas: 8, total_perak: 7, total_perunggu: 6, color_density_code: '#eff6ff' },
  { id: '17', kabupaten_kota: 'Bener Meriah', total_emas: 7, total_perak: 6, total_perunggu: 5, color_density_code: '#eff6ff' },
  { id: '18', kabupaten_kota: 'Nagan Raya', total_emas: 6, total_perak: 5, total_perunggu: 5, color_density_code: '#eff6ff' },
  { id: '19', kabupaten_kota: 'Gayo Lues', total_emas: 5, total_perak: 4, total_perunggu: 4, color_density_code: '#eff6ff' },
  { id: '20', kabupaten_kota: 'Aceh Tenggara', total_emas: 4, total_perak: 5, total_perunggu: 3, color_density_code: '#eff6ff' },
  { id: '21', kabupaten_kota: 'Simeulue', total_emas: 3, total_perak: 3, total_perunggu: 2, color_density_code: '#eff6ff' },
  { id: '22', kabupaten_kota: 'Aceh Singkil', total_emas: 2, total_perak: 2, total_perunggu: 2, color_density_code: '#eff6ff' },
  { id: '23', kabupaten_kota: 'Aceh Barat Daya', total_emas: 2, total_perak: 1, total_perunggu: 1, color_density_code: '#eff6ff' },
];

export const MOCK_PRESTASI: AtletPrestasi[] = [
  {
    id: 1024,
    nama_atlet: 'Muhammad Syukri',
    kabupaten_kota: 'Banda Aceh',
    cabor: 'Tarung Derajat',
    event: 'PORA Pidie XIV',
    tahun: 2022,
    tingkat: 'Provinsi',
    medali: 'Emas',
    metadata_dinamis: {
      jumlah_ronde_menang: 3,
      kelas_tanding: 'Kelas 60kg Putra',
      waktu_ko_detik: 120,
    },
  },
  {
    id: 1025,
    nama_atlet: 'Ahmad Fauzi',
    kabupaten_kota: 'Banda Aceh',
    cabor: 'Atletik',
    event: 'PON XXI',
    tahun: 2024,
    tingkat: 'Nasional',
    medali: 'Emas',
    metadata_dinamis: {
      catatan_waktu_detik: 10.45,
      nomor_lintasan: 4,
      kondisi_cuaca: 'Cerah Berawan',
    },
  },
  {
    id: 1026,
    nama_atlet: 'Siti Rahma',
    kabupaten_kota: 'Pidie',
    cabor: 'Renang',
    event: 'PORA XIV',
    tahun: 2022,
    tingkat: 'Provinsi',
    medali: 'Perak',
    metadata_dinamis: {
      gaya_renang: 'Gaya Bebas 100m',
      waktu_tempuh: '00:58.21',
      rekam_jejak_putaran: ['28.10s', '30.11s'],
    },
  },
  {
    id: 1027,
    nama_atlet: 'Budi Santoso',
    kabupaten_kota: 'Lhokseumawe',
    cabor: 'Panahan',
    event: 'Kejurnas',
    tahun: 2023,
    tingkat: 'Nasional',
    medali: 'Perunggu',
    metadata_dinamis: {
      total_skor_kualifikasi: 675,
      busur_digunakan: 'Recurve 70m',
      angin_kecepatan: '12 km/jam',
    },
  },
  {
    id: 1028,
    nama_atlet: 'Cut Mutia',
    kabupaten_kota: 'Bireuen',
    cabor: 'Anggar',
    event: 'PON XXI',
    tahun: 2024,
    tingkat: 'Nasional',
    medali: 'Emas',
    metadata_dinamis: {
      senjata: 'Floret Putri',
      skor_final: '15 - 12',
      pelatih: 'Coach Hendra',
    },
  },
  {
    id: 1029,
    nama_atlet: 'Rizky Maulana',
    kabupaten_kota: 'Aceh Besar',
    cabor: 'Bola Voli',
    event: 'PORA XIV',
    tahun: 2022,
    tingkat: 'Provinsi',
    medali: 'Perak',
    metadata_dinamis: {
      posisi: 'Spiker',
      set_menang: 3,
      pelatih: 'Coach Rudi',
    },
  },
  {
    id: 1030,
    nama_atlet: 'Nabila Salsabila',
    kabupaten_kota: 'Aceh Timur',
    cabor: 'Renang',
    event: 'Kejuaraan Renang Aceh Open',
    tahun: 2023,
    tingkat: 'Provinsi',
    medali: 'Emas',
    metadata_dinamis: {
      gaya_renang: 'Gaya Kupu-Kupu 50m',
      waktu_tempuh: '00:28.41',
      lintasan: 2,
    },
  },
  {
    id: 1031,
    nama_atlet: 'Fahmi Ramadhan',
    kabupaten_kota: 'Aceh Tengah',
    cabor: 'Atletik',
    event: 'POMNAS',
    tahun: 2024,
    tingkat: 'Nasional',
    medali: 'Perunggu',
    metadata_dinamis: {
      nomor_lomba: '1500m',
      catatan_waktu_detik: 244.18,
      kondisi_lintasan: 'Kering',
    },
  },
  {
    id: 1032,
    nama_atlet: 'Salsa Aulia',
    kabupaten_kota: 'Banda Aceh',
    cabor: 'Bulu Tangkis',
    event: 'PON XXI',
    tahun: 2024,
    tingkat: 'Nasional',
    medali: 'Perak',
    metadata_dinamis: {
      nomor_pertandingan: 'Ganda Putri',
      skor_final: '21-18, 19-21, 21-15',
      pelatih: 'Coach Arman',
    },
  },
  {
    id: 1033,
    nama_atlet: 'Hendra Saputra',
    kabupaten_kota: 'Pidie Jaya',
    cabor: 'Panahan',
    event: 'Kejurnas',
    tahun: 2023,
    tingkat: 'Nasional',
    medali: 'Emas',
    metadata_dinamis: {
      total_skor_kualifikasi: 688,
      busur_digunakan: 'Recurve 70m',
      angin_kecepatan: '8 km/jam',
    },
  },
  {
    id: 1034,
    nama_atlet: 'Maya Lestari',
    kabupaten_kota: 'Lhokseumawe',
    cabor: 'Anggar',
    event: 'PORA XIV',
    tahun: 2022,
    tingkat: 'Provinsi',
    medali: 'Perunggu',
    metadata_dinamis: {
      senjata: 'Epee Putri',
      skor_final: '13 - 15',
      pelatih: 'Coach Hendra',
    },
  },
];

export const MOCK_KEPENGURUSAN: KepengurusanSK[] = [
  {
    id: 1,
    cabor: 'PASI (Atletik)',
    masa_bakti: '2024-2028',
    nomor_sk: 'SK/012/KONI-ACEH/2024',
    tanggal_sk: '2024-01-15',
    ketua_umum: 'Ir. H. T. A. Khalid, MM',
    sekretaris: 'Drs. H. M. Nasir',
    status: 'Aktif',
    file_path_sk: 'https://koni-aceh.id/secure/sk_pasi_2024.pdf',
    days_to_expire: 1150,
  },
  {
    id: 2,
    cabor: 'PASI (Atletik)',
    masa_bakti: '2020-2024',
    nomor_sk: 'SK/045/KONI-ACEH/2020',
    tanggal_sk: '2020-01-10',
    ketua_umum: 'Drs. H. Bakhtiar',
    sekretaris: 'Arman Syahputra, S.Pd',
    status: 'Berakhir',
    file_path_sk: 'https://koni-aceh.id/secure/sk_pasi_2020.pdf',
  },
  {
    id: 3,
    cabor: 'PBVSI (Bola Voli)',
    masa_bakti: '2023-2027',
    nomor_sk: 'SK/088/KONI-ACEH/2023',
    tanggal_sk: '2023-05-20',
    ketua_umum: 'Kombes Pol. Dede Rojudin',
    sekretaris: 'Mukhlis, SH',
    status: 'Aktif',
    file_path_sk: 'https://koni-aceh.id/secure/sk_pbvsi_2023.pdf',
    days_to_expire: 850,
  },
  {
    id: 4,
    cabor: 'PBSI (Bulu Tangkis)',
    masa_bakti: '2019-2023',
    nomor_sk: 'SK/112/KONI-ACEH/2019',
    tanggal_sk: '2019-03-12',
    ketua_umum: 'Safaruddin, S.Sos., M.S.P.',
    sekretaris: 'Agus Riyanto',
    status: 'Berakhir',
    file_path_sk: 'https://koni-aceh.id/secure/sk_pbsi_2019.pdf',
  },
  {
    id: 5,
    cabor: 'PRSI (Renang)',
    masa_bakti: '2021-2025',
    nomor_sk: 'SK/078/KONI-ACEH/2020',
    tanggal_sk: '2021-08-01',
    ketua_umum: 'T. Anwar Basri',
    sekretaris: 'Rizal Fahmi',
    status: 'Aktif',
    file_path_sk: 'https://koni-aceh.id/secure/sk_prsi_2021.pdf',
    days_to_expire: 21,
  },
  {
    id: 6,
    cabor: 'PERPANI (Panahan)',
    masa_bakti: '2020-2024',
    nomor_sk: 'SK/045/KONI-ACEH/2020',
    tanggal_sk: '2020-09-10',
    ketua_umum: 'Prof. Dr. Syamsul Rizal',
    sekretaris: 'Mahdi, M.Si',
    status: 'Aktif',
    file_path_sk: 'https://koni-aceh.id/secure/sk_perpani_2020.pdf',
    days_to_expire: 14,
  },
  {
    id: 7,
    cabor: 'TI (Taekwondo)',
    masa_bakti: '2020-2024',
    nomor_sk: 'SK/123/KONI-ACEH/2020',
    tanggal_sk: '2020-08-01',
    ketua_umum: 'H. Ilmiza Saáduddin Djamal',
    sekretaris: 'Firdaus, SE',
    status: 'Aktif',
    file_path_sk: 'https://koni-aceh.id/secure/sk_ti_2020.pdf',
    days_to_expire: 5,
  },
];

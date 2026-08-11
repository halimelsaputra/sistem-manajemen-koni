export interface RegionMedal {
  id: string;
  kabupaten_kota: string;
  total_emas: number;
  total_perak: number;
  total_perunggu: number;
  color_density_code: string;
}

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

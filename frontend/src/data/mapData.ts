export interface RegionCoordinate {
  id: string;
  kabupaten_kota: string;
  lat: number;
  lng: number;
  labelOffset?: [number, number]; // [latOffset, lngOffset] for label fine-tuning
}

export const REGION_COORDINATES: RegionCoordinate[] = [
  { id: '1', kabupaten_kota: 'Banda Aceh', lat: 5.5417, lng: 95.3333, labelOffset: [0.12, -0.10] },
  { id: '2', kabupaten_kota: 'Aceh Besar', lat: 5.3833, lng: 95.5167, labelOffset: [0.04, 0] },
  { id: '3', kabupaten_kota: 'Pidie', lat: 5.0800, lng: 96.1100, labelOffset: [0, -0.18] },
  { id: '4', kabupaten_kota: 'Lhokseumawe', lat: 5.1333, lng: 97.0667, labelOffset: [0.15, -0.14] },
  { id: '5', kabupaten_kota: 'Aceh Timur', lat: 4.6333, lng: 97.6333 },
  { id: '6', kabupaten_kota: 'Bireuen', lat: 5.0833, lng: 96.5833, labelOffset: [0.04, -0.08] },
  { id: '7', kabupaten_kota: 'Aceh Utara', lat: 4.9700, lng: 97.1400, labelOffset: [0.14, -0.08] },
  { id: '8', kabupaten_kota: 'Langsa', lat: 4.4700, lng: 97.9300, labelOffset: [0.08, -0.04] },
  { id: '9', kabupaten_kota: 'Aceh Barat', lat: 4.4500, lng: 96.1667, labelOffset: [0.08, -0.08] },
  { id: '10', kabupaten_kota: 'Aceh Tengah', lat: 4.5100, lng: 96.8550, labelOffset: [0.04, -0.08] },
  { id: '11', kabupaten_kota: 'Sabang', lat: 5.8794, lng: 95.3322, labelOffset: [0, -0.08] },
  { id: '12', kabupaten_kota: 'Aceh Jaya', lat: 4.8600, lng: 95.6400 },
  { id: '13', kabupaten_kota: 'Pidie Jaya', lat: 5.1500, lng: 96.2167, labelOffset: [0.13, -0.08] },
  { id: '14', kabupaten_kota: 'Aceh Tamiang', lat: 4.2500, lng: 97.9667, labelOffset: [0.04, -0.16] },
  { id: '15', kabupaten_kota: 'Aceh Selatan', lat: 3.1667, lng: 97.4167, labelOffset: [0.04, -0.08] },
  { id: '16', kabupaten_kota: 'Subulussalam', lat: 2.7500, lng: 97.9333, labelOffset: [0.04, -0.18] },
  { id: '17', kabupaten_kota: 'Bener Meriah', lat: 4.7302, lng: 96.8616, labelOffset: [0.14, -0.01] },
  { id: '18', kabupaten_kota: 'Nagan Raya', lat: 4.1667, lng: 96.5167, labelOffset: [0.07, -0.08] },
  { id: '19', kabupaten_kota: 'Gayo Lues', lat: 3.9500, lng: 97.3900, labelOffset: [0.08, -0.08] },
  { id: '20', kabupaten_kota: 'Aceh Tenggara', lat: 3.3667, lng: 97.7000, labelOffset: [0.04, -0.12] },
  { id: '21', kabupaten_kota: 'Simeulue', lat: 2.6167, lng: 96.0833 },
  { id: '22', kabupaten_kota: 'Aceh Singkil', lat: 2.4167, lng: 97.9167, labelOffset: [0.08, -0.08] },
  { id: '23', kabupaten_kota: 'Aceh Barat Daya', lat: 3.8333, lng: 96.8833, labelOffset: [0.13, -0.08] },
];

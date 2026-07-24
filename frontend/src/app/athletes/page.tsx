'use client';

import React, { useState } from 'react';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Save, 
  Search, 
  Filter, 
  ChevronRight, 
  Eye, 
  X, 
  CheckCircle2, 
  Code2 
} from 'lucide-react';
import { MOCK_PRESTASI, AtletPrestasi, MOCK_REGIONS, MOCK_CABOR_OPTIONS } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { FormSelect } from '@/components/ui/form-select';

interface DynamicParam {
  id: string;
  key: string;
  value: string;
}

export default function AthletesPage() {
  const [prestasiList, setPrestasiList] = useState<AtletPrestasi[]>(MOCK_PRESTASI);
  
  // Form state
  const [namaAtlet, setNamaAtlet] = useState('');
  const [daerah, setDaerah] = useState('Banda Aceh');
  const [cabor, setCabor] = useState('Tarung Derajat');
  const [event, setEvent] = useState('');
  const [tahun, setTahun] = useState('2024');
  const [tingkat, setTingkat] = useState('Provinsi');
  const [medali, setMedali] = useState<'Emas' | 'Perak' | 'Perunggu' | 'Tanpa Medali'>('Emas');
  const [dynamicParams, setDynamicParams] = useState<DynamicParam[]>([
    { id: '1', key: 'Jumlah Gol / Poin', value: '5' }
  ]);

  // Filter state
  const [filterCabor, setFilterCabor] = useState('Semua Cabor');
  const [filterDaerah, setFilterDaerah] = useState('Semua Daerah');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Detail state
  const [selectedPrestasi, setSelectedPrestasi] = useState<AtletPrestasi | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const handleAddDynamicParam = () => {
    setDynamicParams(prev => [
      ...prev,
      { id: Date.now().toString(), key: '', value: '' }
    ]);
  };

  const handleRemoveDynamicParam = (id: string) => {
    setDynamicParams(prev => prev.filter(p => p.id !== id));
  };

  const handleParamChange = (id: string, field: 'key' | 'value', val: string) => {
    setDynamicParams(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaAtlet || !event) {
      alert('Mohon isi nama atlet dan nama event kejuaraan.');
      return;
    }

    const metadataObj: Record<string, any> = {};
    dynamicParams.forEach(p => {
      if (p.key.trim()) {
        metadataObj[p.key.trim()] = p.value;
      }
    });

    const newItem: AtletPrestasi = {
      id: Date.now(),
      nama_atlet: namaAtlet,
      kabupaten_kota: daerah,
      cabor: cabor,
      event: event,
      tahun: parseInt(tahun) || 2024,
      tingkat: tingkat,
      medali: medali,
      metadata_dinamis: metadataObj
    };

    setPrestasiList([newItem, ...prestasiList]);
    setNamaAtlet('');
    setEvent('');
    setDynamicParams([{ id: '1', key: '', value: '' }]);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 4000);
  };

  const filteredList = prestasiList.filter(item => {
    const matchSearch = item.nama_atlet.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.event.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCabor = filterCabor === 'Semua Cabor' || item.cabor === filterCabor;
    const matchDaerah = filterDaerah === 'Semua Daerah' || item.kabupaten_kota === filterDaerah;
    return matchSearch && matchCabor && matchDaerah;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#b91c1c] mb-1">
          <span>Executive Portal</span>
          <span>•</span>
          <span>Prestasi & Skor Dinamis</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Direktori Prestasi & Rekap Skor Dinamis</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manajemen pencapaian atlet regional secara terstruktur dan terukur menggunakan PostgreSQL JSONB.
        </p>
      </div>

      {showSuccessAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">Prestasi baru dan parameter skor dinamis (JSONB) berhasil disimpan!</span>
          </div>
          <button onClick={() => setShowSuccessAlert(false)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Section: Input Prestasi Baru (Matching Screenshot 114015.png) */}
      <Card className="rounded-2xl overflow-hidden py-0">
        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-gray-900">Input Prestasi Atlet Baru</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Main Grid Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Nama Atlet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap"
                value={namaAtlet}
                onChange={(e) => setNamaAtlet(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
              />
            </div>

            <div>
              <FormSelect
                label="Asal Daerah/Kabupaten"
                value={daerah}
                options={MOCK_REGIONS.map(r => r.kabupaten_kota)}
                onSelect={setDaerah}
              />
            </div>

            <div>
              <FormSelect
                label="Cabang Olahraga"
                value={cabor}
                options={MOCK_CABOR_OPTIONS}
                onSelect={setCabor}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Nama Event <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: PORA 2022"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tahun</label>
                <input
                  type="number"
                  placeholder="YYYY"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
                />
              </div>
              <div>
                <FormSelect
                label="Tingkat"
                value={tingkat}
                options={['Provinsi', 'Nasional', 'Internasional']}
                onSelect={setTingkat}
              />
              </div>
            </div>

            <div>
              <FormSelect
                label="Jenis Medali"
                value={medali}
                options={['Emas', 'Perak', 'Perunggu', 'Tanpa Medali']}
                onSelect={(val) => setMedali(val as any)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900">Parameter Skor Tambahan (Dinamis JSONB)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Tambahkan metrik unik sesuai Cabor (misal: Jumlah Gol pada Sepak Bola, Catatan Waktu pada Atletik, atau Ronde Menang pada Tarung Derajat) tanpa merubah skema tabel database.
              </p>
            </div>

            {/* Dynamic Rows */}
            <div className="space-y-3">
              {dynamicParams.map((p) => (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Nama Metrik (Contoh: Jumlah Gol)"
                      value={p.key}
                      onChange={(e) => handleParamChange(p.id, 'key', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c]"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Nilai (Contoh: 5 atau 10.45 detik)"
                      value={p.value}
                      onChange={(e) => handleParamChange(p.id, 'value', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c]"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveDynamicParam(p.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Hapus Parameter"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddDynamicParam}
                className="flex items-center space-x-1.5 text-xs font-bold text-[#b91c1c] hover:text-red-800 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Parameter Baru</span>
              </button>

              <button
                type="submit"
                className="flex items-center space-x-2 bg-[#b91c1c] hover:bg-red-800 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Prestasi</span>
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* Table Section: Database Prestasi Regional (Matching Screenshot 114015.png) */}
      <Card className="rounded-2xl overflow-hidden py-0">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900">Database Prestasi Regional</h2>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
              {filteredList.length} rekor
            </span>
          </div>

          {/* Filter Bar & Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari atlet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg outline-none focus:border-[#b91c1c]"
              />
            </div>

            <FormSelect
              label="Cabor"
              value={filterCabor}
              options={['Semua Cabor', ...MOCK_CABOR_OPTIONS]}
              onSelect={setFilterCabor}
            />

            <FormSelect
              label="Daerah"
              value={filterDaerah}
              options={['Semua Daerah', ...MOCK_REGIONS.map(r => r.kabupaten_kota)]}
              onSelect={setFilterDaerah}
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-6">Nama Atlet</th>
                <th className="py-3.5 px-6">Daerah</th>
                <th className="py-3.5 px-6">Cabor</th>
                <th className="py-3.5 px-6">Event</th>
                <th className="py-3.5 px-6">Medali</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredList.map((item) => {
                let medalBadge = '';
                if (item.medali === 'Emas') {
                  medalBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                } else if (item.medali === 'Perak') {
                  medalBadge = 'bg-slate-100 text-slate-800 border-slate-300';
                } else if (item.medali === 'Perunggu') {
                  medalBadge = 'bg-orange-100 text-orange-800 border-orange-300';
                } else {
                  medalBadge = 'bg-gray-100 text-gray-600 border-gray-200';
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-bold text-gray-900">{item.nama_atlet}</td>
                    <td className="py-3.5 px-6 text-gray-600 font-medium">{item.kabupaten_kota}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-800">{item.cabor}</td>
                    <td className="py-3.5 px-6 text-gray-600">
                      <span>{item.event}</span>
                      <span className="text-xs text-gray-400 ml-1.5">({item.tahun})</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wide ${medalBadge}`}>
                        {item.medali}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setSelectedPrestasi(item)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada data atlet/prestasi yang cocok dengan pencarian filter Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-slate-50/40 text-xs text-gray-500 flex justify-between items-center">
          <span>Menampilkan 1-{filteredList.length} dari {prestasiList.length} hasil</span>
          <div className="flex items-center space-x-1">
            <button className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-400 font-bold">&lt;</button>
            <button className="px-2.5 py-1 rounded bg-[#b91c1c] text-white font-bold">1</button>
            <button className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-400 font-bold">&gt;</button>
          </div>
        </div>
      </Card>

      {/* JSONB Detail Drawer / Modal */}
      {selectedPrestasi && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="bg-[#b91c1c] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Detail Skor & Metadata Dinamis (JSONB)</h3>
              </div>
              <button
                onClick={() => setSelectedPrestasi(null)}
                className="text-red-100 hover:text-white hover:bg-red-800 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div>
                  <div className="text-xl font-black text-gray-900">{selectedPrestasi.nama_atlet}</div>
                  <div className="text-xs font-semibold text-gray-500 mt-0.5">
                    {selectedPrestasi.cabor} • {selectedPrestasi.kabupaten_kota}
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-300 uppercase">
                  {selectedPrestasi.medali}
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Struktur Data Kolom `metadata_dinamis` (PostgreSQL JSONB)
                </div>
                <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl overflow-x-auto border border-slate-800 shadow-inner">
                  <pre>{JSON.stringify(selectedPrestasi.metadata_dinamis, null, 2)}</pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 bg-slate-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="font-bold text-gray-800">Event:</span> {selectedPrestasi.event}
                </div>
                <div>
                  <span className="font-bold text-gray-800">Tahun:</span> {selectedPrestasi.tahun}
                </div>
                <div>
                  <span className="font-bold text-gray-800">Tingkat:</span> {selectedPrestasi.tingkat}
                </div>
                <div>
                  <span className="font-bold text-gray-800">ID Rekor:</span> #{selectedPrestasi.id}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedPrestasi(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Tutup Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

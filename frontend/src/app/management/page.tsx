'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  Save, 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  X, 
  Clock 
} from 'lucide-react';
import { MOCK_KEPENGURUSAN, KepengurusanSK } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { FormSelect } from '@/components/ui/form-select';

export default function ManagementPage() {
  const [skList, setSkList] = useState<KepengurusanSK[]>(MOCK_KEPENGURUSAN);
  
  // Form state
  const [cabor, setCabor] = useState('PASI (Atletik)');
  const [masaBakti, setMasaBakti] = useState('2024-2028');
  const [nomorSk, setNomorSk] = useState('');
  const [tanggalSk, setTanggalSk] = useState(new Date().toISOString().split('T')[0]);
  const [ketuaUmum, setKetuaUmum] = useState('');
  const [ketuaHarian, setKetuaHarian] = useState('');
  const [sekretaris, setSekretaris] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Search & alert state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorSk || !ketuaUmum || !sekretaris) {
      alert('Mohon lengkapi Nomor SK, Ketua Umum, dan Sekretaris.');
      return;
    }

    // PRD-1.3 logic: Apabila Admin mengunggah dokumen SK baru yang sah, 
    // maka sistem wajib mengubah status baris periode sebelumnya menjadi `Berakhir` dan menyetel data terbaru menjadi `Aktif`.
    const updatedList = skList.map(item => {
      if (item.cabor === cabor && item.status === 'Aktif') {
        return { ...item, status: 'Berakhir' as const, days_to_expire: undefined };
      }
      return item;
    });

    const newItem: KepengurusanSK = {
      id: Date.now(),
      cabor: cabor,
      masa_bakti: masaBakti,
      nomor_sk: nomorSk,
      tanggal_sk: tanggalSk,
      ketua_umum: ketuaUmum,
      ketua_harian: ketuaHarian || undefined,
      sekretaris: sekretaris,
      status: 'Aktif',
      file_path_sk: selectedFile ? `https://koni-aceh.id/secure/${selectedFile.name}` : 'https://koni-aceh.id/secure/sk_baru.pdf',
      days_to_expire: 1460 // 4 years
    };

    setSkList([newItem, ...updatedList]);
    setNomorSk('');
    setKetuaUmum('');
    setKetuaHarian('');
    setSekretaris('');
    setSelectedFile(null);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 4500);
  };

  const filteredList = skList.filter(item => {
    return item.cabor.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.nomor_sk.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.ketua_umum.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDownloadSignedUrl = (sk: KepengurusanSK) => {
    // PRD Non-Functional Security: Akses unduhan dokumen fisik SK tidak boleh berupa tautan statis, 
    // melainkan wajib melalui *Secure Signed URL* yang kedaluwarsa otomatis dalam waktu 5 menit.
    alert(`[Simulasi Secure Signed URL]\n\nMenghasilkan token unduhan sementara (TTL: 5 menit)...\nMengunduh berkas: ${sk.nomor_sk}\nURL: ${sk.file_path_sk}?token=signed_jwt_e38a29f&expires_in=300`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#b91c1c] mb-1">
          <span>Executive Portal</span>
          <span>•</span>
          <span>Manajemen SK & Organisasi</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manajemen Organisasi & Histori SK</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola kepengurusan cabang olahraga dan arsip Surat Keputusan secara terpusat dan imutabel (*Archive Only*).
        </p>
      </div>

      {showSuccessAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">SK Baru Berhasil Diunggah!</span> Sistem otomatis memutasi status periode lama menjadi <span className="underline">Berakhir</span> dan mengaktifkan SK terbaru.
            </div>
          </div>
          <button onClick={() => setShowSuccessAlert(false)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Section: Form Registrasi SK Kepengurusan Baru (Matching Screenshot 114002.png) */}
      <Card className="rounded-2xl overflow-hidden py-0">
        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-[#b91c1c]" />
          <h2 className="text-lg font-bold text-gray-900">Form Registrasi SK Kepengurusan Baru</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FormSelect
                label="Cabang Olahraga"
                value={cabor}
                options={['PASI (Atletik)', 'PBVSI (Bola Voli)', 'PBSI (Bulu Tangkis)', 'PRSI (Renang)', 'PERPANI (Panahan)', 'TI (Taekwondo)', 'Tarung Derajat']}
                onSelect={setCabor}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Masa Bakti <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 2024-2028"
                value={masaBakti}
                onChange={(e) => setMasaBakti(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Nomor SK <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan Nomor Surat Keputusan"
                value={nomorSk}
                onChange={(e) => setNomorSk(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:bg-white focus:border-[#b91c1c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Tanggal Penetapan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={tanggalSk}
                  onChange={(e) => setTanggalSk(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Ketua Umum <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={ketuaUmum}
                onChange={(e) => setKetuaUmum(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Ketua Harian
              </label>
              <input
                type="text"
                placeholder="Nama Lengkap (Opsional)"
                value={ketuaHarian}
                onChange={(e) => setKetuaHarian(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Sekretaris <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={sekretaris}
                onChange={(e) => setSekretaris(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
              />
            </div>
          </div>

          {/* PDF Drag-and-Drop Area (Matching Screenshot 114002.png) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Berkas Asli PDF SK <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 hover:border-[#b91c1c] rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-red-50/20 transition cursor-pointer relative group">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#b91c1c] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                <Upload className="w-6 h-6" />
              </div>
              {selectedFile ? (
                <div>
                  <div className="font-bold text-sm text-gray-900">{selectedFile.name}</div>
                  <div className="text-xs text-emerald-600 font-semibold mt-1">Siap untuk dienkripsi & disimpan ke server</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    <span className="text-[#b91c1c] font-bold">Klik untuk upload</span> atau drag and drop
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    File PDF via Secure Signed URL (Max 5MB) — Imutabel & terenkripsi
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center space-x-2 bg-[#b91c1c] hover:bg-red-800 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg hover:shadow-xl"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Otomatisasi Status</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Table Section: Arsip Histori Kepengurusan Cabor (Matching Screenshot 114002.png) */}
      <Card className="rounded-2xl overflow-hidden py-0">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-[#b91c1c]" />
            <h2 className="text-lg font-bold text-gray-900">Arsip Histori Kepengurusan Cabor</h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari arsip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg outline-none focus:border-[#b91c1c]"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-6">Cabor</th>
                <th className="py-3.5 px-6">Masa Bakti</th>
                <th className="py-3.5 px-6">No. SK</th>
                <th className="py-3.5 px-6">Ketua Umum</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredList.map((sk) => {
                const isAktif = sk.status === 'Aktif';
                return (
                  <tr key={sk.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-bold text-gray-900">{sk.cabor}</td>
                    <td className="py-3.5 px-6 text-gray-600 font-medium">{sk.masa_bakti}</td>
                    <td className="py-3.5 px-6 font-mono text-xs font-semibold text-gray-700">{sk.nomor_sk}</td>
                    <td className="py-3.5 px-6 font-medium text-gray-800">{sk.ketua_umum}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          isAktif
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {sk.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDownloadSignedUrl(sk)}
                        className="text-xs font-bold text-gray-700 hover:text-[#b91c1c] hover:bg-red-50 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-gray-200 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada arsip SK yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-slate-50/40 text-xs text-gray-500 flex justify-between items-center">
          <span>Menampilkan 1-{filteredList.length} dari {skList.length} arsip</span>
          <div className="flex items-center space-x-1">
            <button className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-400 font-bold">&lt;</button>
            <button className="px-2.5 py-1 rounded bg-[#b91c1c] text-white font-bold">1</button>
            <button className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-800 font-bold">2</button>
            <button className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-800 font-bold">3</button>
            <button className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-800 font-bold">&gt;</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

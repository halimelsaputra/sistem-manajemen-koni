'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Plus,
  Save,
  Search,
  X,
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import { MOCK_REGIONS } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { FormSelect } from '@/components/ui/form-select';
import Pagination from '@/components/ui/pagination';

interface Cabor {
  id: number;
  nama_cabor: string;
}

interface Atlet {
  id: number;
  nama_atlet: string;
  kabupaten_kota: string;
  cabor_id: number;
}

interface Prestasi {
  id: number;
  atlet_id: number;
  event_kejuaraan: string;
  tanggal: string;
  tingkat_lomba: string;
  mendali: string;
  atlet?: Atlet;
}

// Jumlah rekor per halaman (dipakai di fetch & footer pagination)
const PAGE_SIZE = 20;

// Format tanggal DB (YYYY-MM-DD) → tampilan Indonesia (mis. 15 Jan 2024)
const formatTanggal = (t?: string): string => {
  if (!t) return '';
  const d = new Date(`${t}T00:00:00`);
  if (isNaN(d.getTime())) return t;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function AthletesPage() {
  const [prestasiList, setPrestasiList] = useState<Prestasi[]>([]);
  const [atletList, setAtletList] = useState<Atlet[]>([]);
  const [caborList, setCaborList] = useState<Cabor[]>([]);

  // Filter state
  const [filterCabor, setFilterCabor] = useState('Semua Cabor');
  const [filterDaerah, setFilterDaerah] = useState('Semua Daerah');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Prestasi state
  const [selectedAtletName, setSelectedAtletName] = useState('');
  const [event, setEvent] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [tingkat, setTingkat] = useState('Daerah');
  const [medali, setMedali] = useState('Emas');

  // Form Atlet state
  const [newAtletNama, setNewAtletNama] = useState('');
  const [newAtletDaerah, setNewAtletDaerah] = useState('Banda Aceh');
  const [newAtletCabor, setNewAtletCabor] = useState('');
  
  const [newCaborNama, setNewCaborNama] = useState('');

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showAtletModal, setShowAtletModal] = useState(false);
  const [showCaborModal, setShowCaborModal] = useState(false);

  const [mounted, setMounted] = useState(false);

  // Pagination state — tabel hanya merender satu halaman (PAGE_SIZE rekor)
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Penjaga race condition: respons basi dari request lama diabaikan
  const requestSeq = useRef(0);

  const fetchCabor = () => fetch('/api/cabor').then(res => res.json()).then(data => {
    const arr = Array.isArray(data) ? data : data.data || [];
    setCaborList(arr);
    if (arr.length > 0) setNewAtletCabor(arr[0].nama_cabor);
  }).catch(console.error);

  const fetchAtlet = () => fetch('/api/atlet').then(res => res.json()).then(data => {
    const arr = Array.isArray(data) ? data : data.data || [];
    setAtletList(arr);
    if (arr.length > 0) setSelectedAtletName(arr[0].nama_atlet);
  }).catch(console.error);

  // Filter & pagination server-side: semua filter dikirim sebagai query params,
  // sehingga pencarian berlaku di seluruh dataset (bukan hanya halaman aktif).
  const loadPrestasi = useCallback(async () => {
    const seq = ++requestSeq.current;
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (filterCabor !== 'Semua Cabor') {
      const selCabor = caborList.find(c => c.nama_cabor === filterCabor);
      if (selCabor) params.set('cabor_id', String(selCabor.id));
    }
    if (filterDaerah !== 'Semua Daerah') params.set('kabupaten_kota', filterDaerah);

    setLoading(true);
    try {
      const res = await fetch(`/api/prestasi?${params.toString()}`);
      const data = await res.json();
      const body = data.data ?? data;
      if (seq !== requestSeq.current) return; // respons basi (race) — abaikan

      if (Array.isArray(body)) {
        setPrestasiList(body);
        setTotal(body.length);
      } else {
        const newTotal = body.pagination?.total ?? 0;
        const totalPages = body.pagination?.totalPages ?? 1;
        // Halaman melebihi jumlah halaman (mis. data berkurang dari sesi lain) → lompat ke terakhir
        if (newTotal > 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        setPrestasiList(body.items ?? []);
        setTotal(newTotal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [page, searchQuery, filterCabor, filterDaerah, caborList]);

  // Debounce pencarian (350ms) agar tidak refetch per ketukan tombol
  useEffect(() => {
    const timer = setTimeout(loadPrestasi, searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [loadPrestasi, searchQuery]);

  useEffect(() => {
    setMounted(true);
    fetchCabor();
    fetchAtlet();
  }, []);

  const handleAddPrestasi = async (e: React.FormEvent) => {
    e.preventDefault();
    const atlet = atletList.find(a => a.nama_atlet === selectedAtletName);
    if (!atlet) return alert('Silakan pilih atlet.');
    if (!event) return alert('Nama event harus diisi.');
    if (!tanggal) return alert('Tanggal kejuaraan harus diisi.');

    const payload = {
      atlet_id: atlet.id,
      event_kejuaraan: event,
      tanggal,
      tingkat_lomba: tingkat,
      mendali: medali
    };

    try {
      const res = await fetch('/api/prestasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEvent('');
        setShowInputModal(false);
        setShowSuccessAlert(true);
        setTimeout(() => setShowSuccessAlert(false), 4000);
        loadPrestasi();
      } else {
        alert('Gagal menyimpan prestasi');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  const handleAddCabor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaborNama) return alert('Nama cabor harus diisi.');

    try {
      const res = await fetch('/api/cabor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_cabor: newCaborNama })
      });
      if (res.ok) {
        setShowCaborModal(false);
        setNewCaborNama('');
        fetchCabor();
      } else {
        alert('Gagal menambah cabor');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  const handleAddAtlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAtletNama) return alert('Nama atlet harus diisi.');
    const selCabor = caborList.find(c => c.nama_cabor === newAtletCabor);
    if (!selCabor) return alert('Cabang olahraga invalid.');

    const payload = {
      nama_atlet: newAtletNama,
      kabupaten_kota: newAtletDaerah,
      cabor_id: selCabor.id
    };

    try {
      const res = await fetch('/api/atlet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAtletModal(false);
        setNewAtletNama('');
        await fetchAtlet();
        setSelectedAtletName(newAtletNama);
      } else {
        alert('Gagal menambah atlet');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  const getAtletDetails = (atlet_id: number, atlet?: any) => {
    if (atlet) {
       const apiCabor: any = atlet.cabor;
       const extractedCaborName = apiCabor && typeof apiCabor === 'object' ? apiCabor.nama_cabor : apiCabor;
       const caborName = caborList.find(c => c.id === atlet.cabor_id)?.nama_cabor || extractedCaborName || 'Unknown';
       return { nama: atlet.nama_atlet || 'Unknown', daerah: atlet.kabupaten_kota || 'Unknown', caborName };
    }
    const a = atletList.find(a => a.id === atlet_id);
    if (!a) return { nama: 'Unknown', daerah: 'Unknown', caborName: 'Unknown' };
    const caborName = caborList.find(c => c.id === a.cabor_id)?.nama_cabor || 'Unknown';
    return { nama: a.nama_atlet, daerah: a.kabupaten_kota, caborName };
  };

  const caborOptions = caborList.map(c => c.nama_cabor);
  const atletOptions = atletList.map(a => a.nama_atlet);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Direktori Prestasi Atlet</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manajemen pencapaian atlet regional secara terstruktur dan terukur.
        </p>
      </div>

      {showSuccessAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">Prestasi berhasil disimpan!</span>
          </div>
          <button onClick={() => setShowSuccessAlert(false)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table Section */}
      <Card className="rounded-2xl overflow-hidden py-0 flex flex-col min-h-[780px]">
        <div className="px-6 py-4 border-b border-gray-100 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-gray-900">Database Prestasi Regional</h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {total} rekor
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <button
                onClick={() => setShowCaborModal(true)}
                className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-2 px-4 rounded-xl transition shadow-sm border border-gray-200"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Cabor</span>
              </button>
              <button
                onClick={() => setShowInputModal(true)}
                className="flex items-center space-x-1.5 bg-[#b91c1c] hover:bg-red-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Prestasi</span>
              </button>
            </div>
          </div>

          <div className="flex flex-nowrap items-end gap-2">
            <div className="relative shrink-0">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Cari
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari atlet atau event..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
                />
              </div>
            </div>

            <div className="shrink-0">
              <FormSelect
                label="Cabor"
                value={filterCabor}
                options={['Semua Cabor', ...caborOptions]}
                onSelect={(v) => { setFilterCabor(v); setPage(1); }}
              />
            </div>

            <div className="shrink-0">
              <FormSelect
                label="Daerah"
                value={filterDaerah}
                options={['Semua Daerah', ...MOCK_REGIONS.map(r => r.kabupaten_kota)]}
                onSelect={(v) => { setFilterDaerah(v); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-6">Nama Atlet</th>
                <th className="py-3.5 px-6">Daerah</th>
                <th className="py-3.5 px-6">Cabor</th>
                <th className="py-3.5 px-6">Event</th>
                <th className="py-3.5 px-6">Medali</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {prestasiList.map((item) => {
                const details = getAtletDetails(item.atlet_id, item.atlet);
                let medalBadge = '';
                if (item.mendali === 'Emas') {
                  medalBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                } else if (item.mendali === 'Perak') {
                  medalBadge = 'bg-slate-100 text-slate-800 border-slate-300';
                } else if (item.mendali === 'Perunggu') {
                  medalBadge = 'bg-orange-100 text-orange-800 border-orange-300';
                } else {
                  medalBadge = 'bg-gray-100 text-gray-600 border-gray-200';
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-bold text-gray-900">{details.nama}</td>
                    <td className="py-3.5 px-6 text-gray-600 font-medium">{details.daerah}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-800">{details.caborName}</td>
                    <td className="py-3.5 px-6 text-gray-600">
                      <span>{item.event_kejuaraan}</span>
                      <span className="text-xs text-gray-400 ml-1.5">({formatTanggal(item.tanggal)})</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wide ${medalBadge}`}>
                        {item.mendali}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {prestasiList.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada data atlet/prestasi yang cocok dengan pencarian filter Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
        />
      </Card>

      {/* Input Prestasi Modal */}
      {showInputModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white text-gray-900 border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-[#b91c1c]" />
                <h3 className="font-bold text-base">Input Prestasi Baru</h3>
              </div>
              <button
                onClick={() => setShowInputModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPrestasi} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 flex items-end gap-3">
                  <div className="flex-1">
                    {atletOptions.length > 0 ? (
                      <FormSelect
                        label="Pilih Atlet"
                        value={selectedAtletName}
                        options={atletOptions}
                        onSelect={setSelectedAtletName}
                      />
                    ) : (
                      <div className="text-sm text-gray-500 font-medium pb-2 border-b">
                        Belum ada data atlet. Silakan tambah atlet baru.
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAtletModal(true)}
                    className="flex-shrink-0 mb-[2px] flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3 px-4 rounded-xl transition shadow-sm border border-gray-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Atlet Baru</span>
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Nama Event Kejuaraan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PON XXI, PORA 2022"
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Tanggal Kejuaraan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                  />
                </div>

                <div>
                  <FormSelect
                    label="Tingkat Kompetisi"
                    value={tingkat}
                    options={['Daerah', 'Nasional', 'Internasional']}
                    onSelect={setTingkat}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormSelect
                    label="Jenis Medali"
                    value={medali}
                    options={['Emas', 'Perak', 'Perunggu', 'Tanpa Medali']}
                    onSelect={setMedali}
                  />
                </div>
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowInputModal(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddPrestasi}
                className="flex items-center space-x-2 bg-[#b91c1c] hover:bg-red-800 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Prestasi</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Tambah Cabor Modal */}
      {showCaborModal && mounted && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white text-gray-900 border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#b91c1c]" />
                <h3 className="font-bold text-base">Tambah Cabang Olahraga</h3>
              </div>
              <button
                onClick={() => setShowCaborModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCabor} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Nama Cabang Olahraga <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Panahan"
                  value={newCaborNama}
                  onChange={(e) => setNewCaborNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                />
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCaborModal(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddCabor}
                className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Cabor</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Tambah Atlet Modal */}
      {showAtletModal && mounted && createPortal(
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white text-gray-900 border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#b91c1c]" />
                <h3 className="font-bold text-base">Registrasi Atlet Baru</h3>
              </div>
              <button
                onClick={() => setShowAtletModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAtlet} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama atlet"
                  value={newAtletNama}
                  onChange={(e) => setNewAtletNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                />
              </div>

              <div>
                <FormSelect
                  label="Cabang Olahraga"
                  value={newAtletCabor}
                  options={caborOptions}
                  onSelect={setNewAtletCabor}
                />
              </div>

              <div>
                <FormSelect
                  label="Asal Kabupaten / Kota"
                  value={newAtletDaerah}
                  options={MOCK_REGIONS.map(r => r.kabupaten_kota)}
                  onSelect={setNewAtletDaerah}
                />
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAtletModal(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddAtlet}
                className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Daftarkan Atlet</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

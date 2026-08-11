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
  UserPlus,
  Trash2,
  Pencil
} from 'lucide-react';
import { MOCK_REGIONS } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { FormSelect } from '@/components/ui/form-select';
import Pagination from '@/components/ui/pagination';
import ConfirmDeleteModal from '@/components/ui/confirm-delete-modal';

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

type DeleteEntity = 'prestasi' | 'atlet' | 'cabor';

interface DeleteTarget {
  entity: DeleteEntity;
  id: number;
  name: string;
  phrase: string;
  description: string;
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

  // Edit flow state — menyimpan record yang sedang diedit (null = mode tambah)
  const [editingPrestasi, setEditingPrestasi] = useState<Prestasi | null>(null);
  const [editingAtlet, setEditingAtlet] = useState<Atlet | null>(null);
  const [editingCabor, setEditingCabor] = useState<Cabor | null>(null);

  // Delete flow state (konfirmasi ganda + ketik frasa)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Penjaga race saat mengambil dampak cascade (sama pola dengan requestSeq)
  const deleteSeq = useRef(0);

  const [mounted, setMounted] = useState(false);

  // Pagination state — tabel hanya merender satu halaman (PAGE_SIZE rekor)
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pagination client-side untuk tabel manajemen Atlet & Cabor
  // (list penuh sudah dimuat untuk kebutuhan dropdown/filter, jadi cukup di-slice)
  const [atletPage, setAtletPage] = useState(1);
  const [caborPage, setCaborPage] = useState(1);

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

  const handleSavePrestasi = async (e: React.FormEvent) => {
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
      const res = editingPrestasi
        ? await fetch(`/api/prestasi/${editingPrestasi.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch('/api/prestasi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
      if (res.ok) {
        setEvent('');
        setEditingPrestasi(null);
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

  // Buka modal tambah prestasi (reset form + mode tambah)
  const openAddPrestasiModal = () => {
    setEditingPrestasi(null);
    setEvent('');
    setTanggal('');
    setTingkat('Daerah');
    setMedali('Emas');
    setShowInputModal(true);
  };

  // Buka modal edit prestasi (form diisi data lama)
  const openEditPrestasi = (p: Prestasi) => {
    setEditingPrestasi(p);
    const details = getAtletDetails(p.atlet_id, p.atlet);
    setSelectedAtletName(details.nama);
    setEvent(p.event_kejuaraan);
    setTanggal((p.tanggal || '').slice(0, 10));
    setTingkat(p.tingkat_lomba);
    setMedali(p.mendali);
    setShowInputModal(true);
  };

  const handleSaveCabor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaborNama) return alert('Nama cabor harus diisi.');

    try {
      const res = editingCabor
        ? await fetch(`/api/cabor/${editingCabor.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama_cabor: newCaborNama })
          })
        : await fetch('/api/cabor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama_cabor: newCaborNama })
          });
      if (res.ok) {
        setShowCaborModal(false);
        setNewCaborNama('');
        setEditingCabor(null);
        fetchCabor();
      } else {
        alert('Gagal menyimpan cabor');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  // Buka modal tambah cabor (mode tambah + reset form)
  const openAddCaborModal = () => {
    setEditingCabor(null);
    setNewCaborNama('');
    setShowCaborModal(true);
  };

  // Buka modal edit cabor (form diisi nama lama)
  const openEditCabor = (c: Cabor) => {
    setEditingCabor(c);
    setNewCaborNama(c.nama_cabor);
    setShowCaborModal(true);
  };

  const handleSaveAtlet = async (e: React.FormEvent) => {
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
      const res = editingAtlet
        ? await fetch(`/api/atlet/${editingAtlet.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch('/api/atlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
      if (res.ok) {
        setShowAtletModal(false);
        setNewAtletNama('');
        setEditingAtlet(null);
        await fetchAtlet();
        setSelectedAtletName(newAtletNama);
      } else {
        alert('Gagal menyimpan atlet');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    }
  };

  // Buka modal tambah atlet (mode tambah + reset form)
  const openAddAtletModal = () => {
    setEditingAtlet(null);
    setNewAtletNama('');
    setShowAtletModal(true);
  };

  // Buka modal edit atlet (form diisi data lama)
  const openEditAtlet = (a: Atlet) => {
    setEditingAtlet(a);
    setNewAtletNama(a.nama_atlet);
    setNewAtletDaerah(a.kabupaten_kota);
    const cn = caborList.find(c => c.id === a.cabor_id)?.nama_cabor;
    if (cn) setNewAtletCabor(cn);
    setShowAtletModal(true);
  };

  // Buka modal konfirmasi hapus. Untuk atlet/cabor, ambil dampak cascade
  // dari backend agar akurat (list frontend terpaginasi / tidak lengkap).
  const openDeleteModal = async (target: DeleteTarget) => {
    const seq = ++deleteSeq.current;
    setDeleteImpact([]);
    setDeleteTarget(target);
    try {
      if (target.entity === 'atlet') {
        const res = await fetch(`/api/atlet/${target.id}/dependencies`);
        const data = await res.json();
        if (seq !== deleteSeq.current) return; // klik baris lain — respons basi diabaikan
        const deps = data.data ?? {};
        if (deps.prestasi > 0) setDeleteImpact([`${deps.prestasi} prestasi milik atlet ini`]);
      } else if (target.entity === 'cabor') {
        const res = await fetch(`/api/cabor/${target.id}/dependencies`);
        const data = await res.json();
        if (seq !== deleteSeq.current) return; // klik baris lain — respons basi diabaikan
        const deps = data.data ?? {};
        const parts: string[] = [];
        if (deps.kepengurusan > 0) parts.push(`${deps.kepengurusan} SK kepengurusan`);
        if (deps.atlet > 0) parts.push(`${deps.atlet} atlet`);
        if (deps.prestasi > 0) parts.push(`${deps.prestasi} prestasi`);
        setDeleteImpact(parts);
      }
    } catch (err) {
      console.error('Gagal mengambil dampak cascade:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/${deleteTarget.entity}/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: deleteTarget.phrase })
      });
      if (res.ok) {
        const entity = deleteTarget.entity;
        const nama = deleteTarget.name;
        setDeleteTarget(null);
        setDeleteSuccessMsg(`"${nama}" berhasil dihapus.`);
        setTimeout(() => setDeleteSuccessMsg(null), 4000);
        if (entity === 'prestasi') {
          loadPrestasi();
        } else if (entity === 'atlet') {
          fetchAtlet();
          loadPrestasi(); // prestasi atlet ikut terhapus (cascade)
        } else {
          fetchCabor();
          fetchAtlet();
          loadPrestasi();
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Gagal menghapus data.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus.');
    } finally {
      setDeleteLoading(false);
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

  // Potongan halaman untuk tabel manajemen (client-side).
  // Safe page dihitung langsung (bukan via useEffect) agar tidak ada frame kosong
  // sesaat saat list menyusut (mis. user di halaman 5 lalu data terhapus hingga sisa 2 halaman).
  const atletMaxPage = Math.max(1, Math.ceil(atletList.length / PAGE_SIZE));
  const atletSafePage = Math.min(atletPage, atletMaxPage);
  const atletPageItems = atletList.slice((atletSafePage - 1) * PAGE_SIZE, atletSafePage * PAGE_SIZE);

  const caborMaxPage = Math.max(1, Math.ceil(caborList.length / PAGE_SIZE));
  const caborSafePage = Math.min(caborPage, caborMaxPage);
  const caborPageItems = caborList.slice((caborSafePage - 1) * PAGE_SIZE, caborSafePage * PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Direktori Prestasi Atlet</h1>
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

      {deleteSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{deleteSuccessMsg}</span>
          </div>
          <button onClick={() => setDeleteSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table Section */}
      <Card className="rounded-2xl overflow-hidden py-0 flex flex-col min-h-[780px]">
        <div className="px-6 py-4 border-b border-gray-100 space-y-3 shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-gray-900">Database Prestasi Regional</h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {total} rekor
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <button
                onClick={openAddCaborModal}
                className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-2 px-4 rounded-xl transition shadow-sm border border-gray-200"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Cabor</span>
              </button>
              <button
                onClick={openAddPrestasiModal}
                className="flex items-center space-x-1.5 bg-[#b91c1c] hover:bg-red-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Prestasi</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="relative w-full sm:w-auto sm:min-w-[240px] shrink-0">
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
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
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

        {/* Table Content — scroll horizontal di layar kecil agar kolom tidak remuk */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-6">Nama Atlet</th>
                <th className="py-3.5 px-6">Daerah</th>
                <th className="py-3.5 px-6">Cabor</th>
                <th className="py-3.5 px-6">Event</th>
                <th className="py-3.5 px-6">Medali</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
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
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditPrestasi(item)}
                          title="Edit prestasi"
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal({
                            entity: 'prestasi',
                            id: item.id,
                            name: item.event_kejuaraan,
                            phrase: `hapus prestasi ${item.event_kejuaraan}`,
                            description: `Anda akan menghapus prestasi "${item.event_kejuaraan}" milik ${details.nama} (${formatTanggal(item.tanggal)}).`
                          })}
                          title="Hapus prestasi"
                          className="text-gray-400 hover:text-[#b91c1c] hover:bg-red-50 p-2 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {prestasiList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
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

      {/* Manajemen Data Atlet */}
      <Card className="rounded-2xl overflow-hidden py-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900">Manajemen Data Atlet</h2>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
              {atletList.length} atlet
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Hapus data atlet. Menghapus atlet akan menghapus seluruh prestasinya secara permanen.
          </p>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left border-collapse">
          <thead className="bg-slate-50">
            <tr className="border-b border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider">
              <th className="py-2.5 px-6">Nama</th>
              <th className="py-2.5 px-6">Daerah</th>
              <th className="py-2.5 px-6">Cabor</th>
              <th className="py-2.5 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {atletPageItems.map((a) => {
              const caborName = caborList.find(c => c.id === a.cabor_id)?.nama_cabor || 'Unknown';
              return (
                <tr key={a.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-6 font-bold text-gray-900">{a.nama_atlet}</td>
                  <td className="py-3 px-6 text-gray-600 font-medium">{a.kabupaten_kota}</td>
                  <td className="py-3 px-6 font-semibold text-gray-800">{caborName}</td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditAtlet(a)}
                        title="Edit atlet"
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal({
                          entity: 'atlet',
                          id: a.id,
                          name: a.nama_atlet,
                          phrase: `hapus atlet ${a.nama_atlet}`,
                          description: `Anda akan menghapus atlet "${a.nama_atlet}" (${a.kabupaten_kota}, ${caborName}) beserta seluruh prestasinya.`
                        })}
                        title="Hapus atlet (cascade ke prestasi)"
                        className="text-gray-400 hover:text-[#b91c1c] hover:bg-red-50 p-2 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {atletPageItems.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                  Belum ada data atlet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <Pagination
          page={atletSafePage}
          totalPages={atletMaxPage}
          total={atletList.length}
          pageSize={PAGE_SIZE}
          noun="atlet"
          onPageChange={setAtletPage}
        />
      </Card>

      {/* Manajemen Data Cabor */}
      <Card className="rounded-2xl overflow-hidden py-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-gray-900">Manajemen Data Cabor</h2>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
              {caborList.length} cabor
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Hapus data cabor. Menghapus cabor akan menghapus seluruh atlet, prestasi, dan SK terkait secara permanen.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[340px] text-left border-collapse">
            <thead className="bg-slate-50">
              <tr className="border-b border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-2.5 px-6">Nama Cabor</th>
              <th className="py-2.5 px-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {caborPageItems.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-6 font-bold text-gray-900">{c.nama_cabor}</td>
                <td className="py-3 px-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditCabor(c)}
                      title="Edit cabor"
                      className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal({
                        entity: 'cabor',
                        id: c.id,
                        name: c.nama_cabor,
                        phrase: `hapus cabor ${c.nama_cabor}`,
                        description: `Anda akan menghapus cabor "${c.nama_cabor}". Seluruh atlet, prestasi, dan SK yang terkait akan ikut terhapus permanen.`
                      })}
                      title="Hapus cabor (cascade ke atlet, prestasi & SK)"
                      className="text-gray-400 hover:text-[#b91c1c] hover:bg-red-50 p-2 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {caborPageItems.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center py-8 text-gray-400 text-sm">
                  Belum ada data cabor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <Pagination
          page={caborSafePage}
          totalPages={caborMaxPage}
          total={caborList.length}
          pageSize={PAGE_SIZE}
          noun="cabor"
          onPageChange={setCaborPage}
        />
      </Card>

      {/* Input Prestasi Modal */}
      {showInputModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white text-gray-900 border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-[#b91c1c]" />
                <h3 className="font-bold text-base">{editingPrestasi ? 'Edit Prestasi' : 'Input Prestasi Baru'}</h3>
              </div>
              <button
                onClick={() => { setShowInputModal(false); setEditingPrestasi(null); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrestasi} className="p-6 space-y-6 overflow-y-auto">
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
                    onClick={openAddAtletModal}
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
                onClick={() => { setShowInputModal(false); setEditingPrestasi(null); }}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePrestasi}
                className="flex items-center space-x-2 bg-[#b91c1c] hover:bg-red-800 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{editingPrestasi ? 'Simpan Perubahan' : 'Simpan Prestasi'}</span>
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
                <h3 className="font-bold text-base">{editingCabor ? 'Edit Cabang Olahraga' : 'Tambah Cabang Olahraga'}</h3>
              </div>
              <button
                onClick={() => { setShowCaborModal(false); setEditingCabor(null); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCabor} className="p-6 space-y-5">
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
                onClick={() => { setShowCaborModal(false); setEditingCabor(null); }}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCabor}
                className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{editingCabor ? 'Simpan Perubahan' : 'Simpan Cabor'}</span>
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
                <h3 className="font-bold text-base">{editingAtlet ? 'Edit Data Atlet' : 'Registrasi Atlet Baru'}</h3>
              </div>
              <button
                onClick={() => { setShowAtletModal(false); setEditingAtlet(null); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAtlet} className="p-6 space-y-5">
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
                onClick={() => { setShowAtletModal(false); setEditingAtlet(null); }}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAtlet}
                className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{editingAtlet ? 'Simpan Perubahan' : 'Daftarkan Atlet'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Delete Modal (konfirmasi ganda + ketik frasa) */}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title={deleteTarget
          ? `Hapus ${deleteTarget.entity === 'prestasi' ? 'Prestasi' : deleteTarget.entity === 'atlet' ? 'Atlet' : 'Cabor'}`
          : ''}
        description={deleteTarget?.description ?? ''}
        impact={deleteImpact}
        confirmPhrase={deleteTarget?.phrase ?? ''}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

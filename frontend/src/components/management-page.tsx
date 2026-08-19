'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  Save,
  Search,
  Download,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Pencil,
  Landmark,
  Building2,
  History
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FormSelect } from '@/components/ui/form-select';
import Pagination from '@/components/ui/pagination';
import ConfirmDeleteModal from '@/components/ui/confirm-delete-modal';
import { MOCK_REGIONS } from '@/data/mockData';

export interface SKRecord {
  id: number;
  cabor_id?: number;
  cabor?: string; // in case api returns it directly
  pemprov?: string; // nama organisasi pengurus provinsi (input manual)
  kabupaten_kota?: string;
  nomor_sk: string;
  tanggal_sk: string;
  tanggal_berakhir?: string;
  ketua_umum: string;
  sekretaris: string;
  status_kepengurusan: string;
  file_path_sk: string;
}

// Jenis halaman kepengurusan — dipakai untuk memilih endpoint & kolom entitas
type Section = 'pemprov' | 'kabupaten' | 'histori';
// Jenis kartu CRUD (histori read-only tidak pakai kartu ini)
type ManageKind = 'pemprov' | 'kabupaten';

const PAGE_SIZE = 20;
const REGION_OPTIONS = MOCK_REGIONS.map(r => r.kabupaten_kota);

// Konfigurasi per jenis: endpoint list, kata benda, kolom entitas
const API_BY_KIND: Record<ManageKind, string> = {
  pemprov: '/api/kepengurusan',
  kabupaten: '/api/kepengurusan-kabupaten'
};

// ---------------------------------------------------------------
// Kartu CRUD (Pemprov / Kabupaten) — tambah, edit, hapus, upload PDF
// ---------------------------------------------------------------
function SKManagementCard({ kind }: { kind: ManageKind }) {
  const [skList, setSkList] = useState<SKRecord[]>([]);

  // Form state
  const [entity, setEntity] = useState(''); // nama cabor (pemprov) atau kabupaten (kabupaten)
  const [nomorSk, setNomorSk] = useState('');
  const [tanggalSk, setTanggalSk] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalBerakhir, setTanggalBerakhir] = useState('');
  const [ketuaUmum, setKetuaUmum] = useState('');
  const [sekretaris, setSekretaris] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Search & alert state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);

  // Edit flow state — record SK yang sedang diedit (null = mode tambah)
  const [editingSK, setEditingSK] = useState<SKRecord | null>(null);
  const [successIsEdit, setSuccessIsEdit] = useState(false);

  // Delete flow state (konfirmasi ganda + ketik frasa)
  const [deleteTarget, setDeleteTarget] = useState<SKRecord | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Penjaga race condition
  const requestSeq = useRef(0);

  const apiBase = API_BY_KIND[kind];

  // Search server-side + pagination (pencarian berlaku di seluruh dataset)
  const loadKepengurusan = useCallback(async () => {
    const seq = ++requestSeq.current;
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    // Halaman utama hanya menampilkan pengurus AKTIF; yang Berakhir pindah ke Histori
    params.set('status_kepengurusan', 'Aktif');
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}?${params.toString()}`);
      const data = await res.json();
      const body = data.data ?? data;
      if (seq !== requestSeq.current) return; // respons basi (race) — abaikan

      if (Array.isArray(body)) {
        setSkList(body);
        setTotal(body.length);
      } else {
        const newTotal = body.pagination?.total ?? 0;
        const totalPages = body.pagination?.totalPages ?? 1;
        if (newTotal > 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        setSkList(body.items ?? []);
        setTotal(newTotal);
      }
    } catch (err) {
      console.error("Error fetching kepengurusan:", err);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [page, searchQuery, apiBase]);

  // Debounce pencarian (350ms)
  useEffect(() => {
    const timer = setTimeout(loadKepengurusan, searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [loadKepengurusan, searchQuery]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveSK = async (e: React.FormEvent) => {
    e.preventDefault();
    const entityField = kind === 'pemprov' ? 'Pemprov' : 'Kabupaten / Kota';
    if (!nomorSk || !ketuaUmum || !sekretaris || !entity) {
      alert(`Mohon lengkapi ${entityField}, Nomor SK, Ketua Umum, dan Sekretaris.`);
      return;
    }

    try {
      // 1) Upload berkas PDF baru jika dipilih (mode edit: opsional)
      let filePath = editingSK?.file_path_sk || '';
      if (selectedFile) {
        const uploadForm = new FormData();
        uploadForm.append('file', selectedFile);
        const uploadRes = await fetch('/api/kepengurusan/upload', {
          method: 'POST',
          body: uploadForm
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.data?.path) {
          alert(uploadData.message || 'Gagal mengunggah berkas PDF.');
          return;
        }
        filePath = uploadData.data.path;
      } else if (!editingSK) {
        alert('Berkas PDF SK wajib diunggah.');
        return;
      }

      // 2) Simpan/perbarui data SK beserta path file di storage
      const payload: any = {
        nomor_sk: nomorSk,
        tanggal_sk: tanggalSk,
        tanggal_berakhir: tanggalBerakhir || undefined,
        ketua_umum: ketuaUmum,
        sekretaris: sekretaris,
        status_kepengurusan: editingSK?.status_kepengurusan || 'Aktif',
        file_path_sk: filePath
      };
      if (kind === 'pemprov') {
        payload.pemprov = entity;
      } else {
        payload.kabupaten_kota = entity;
      }

      const res = editingSK
        ? await fetch(`${apiBase}/${editingSK.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : await fetch(apiBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
      if (res.ok) {
        const wasEdit = !!editingSK;
        setNomorSk('');
        setKetuaUmum('');
        setSekretaris('');
        setTanggalBerakhir('');
        setEntity('');
        setSelectedFile(null);
        setEditingSK(null);
        setSuccessIsEdit(wasEdit);
        setShowInputModal(false);
        setShowSuccessAlert(true);
        setTimeout(() => setShowSuccessAlert(false), 4500);
        loadKepengurusan();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Gagal menyimpan SK');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi');
    }
  };

  // Buka modal tambah SK (mode tambah + reset form)
  const openAddSKModal = () => {
    setEditingSK(null);
    setSuccessIsEdit(false);
    setEntity('');
    setNomorSk('');
    setTanggalSk(new Date().toISOString().split('T')[0]);
    setTanggalBerakhir('');
    setKetuaUmum('');
    setSekretaris('');
    setSelectedFile(null);
    setShowInputModal(true);
  };

  // Buka modal edit SK (form diisi data lama)
  const openEditSK = (sk: SKRecord) => {
    setEditingSK(sk);
    if (kind === 'pemprov') {
      const apiCabor: any = sk.cabor;
      const extractedCabor = apiCabor && typeof apiCabor === 'object' ? apiCabor.nama_cabor : apiCabor;
      setEntity(sk.pemprov || extractedCabor || '');
    } else {
      setEntity(sk.kabupaten_kota || '');
    }
    setNomorSk(sk.nomor_sk || '');
    setTanggalSk((sk.tanggal_sk || new Date().toISOString().split('T')[0]).slice(0, 10));
    setTanggalBerakhir((sk.tanggal_berakhir || '').slice(0, 10));
    setKetuaUmum(sk.ketua_umum || '');
    setSekretaris(sk.sekretaris || '');
    setSelectedFile(null);
    setShowInputModal(true);
  };

  const openDeleteModal = (sk: SKRecord) => {
    setDeleteImpact(sk.file_path_sk ? ['Berkas PDF di storage akan ikut dihapus'] : []);
    setDeleteTarget(sk);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${apiBase}/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: `hapus sk ${deleteTarget.nomor_sk}` })
      });
      if (res.ok) {
        const nomor = deleteTarget.nomor_sk;
        setDeleteTarget(null);
        setDeleteSuccessMsg(`Arsip SK "${nomor}" berhasil dihapus.`);
        setTimeout(() => setDeleteSuccessMsg(null), 4500);
        loadKepengurusan();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Gagal menghapus SK.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadSignedUrl = (sk: SKRecord) => {
    if (!sk.file_path_sk) {
      alert('SK ini belum memiliki berkas dokumen.');
      return;
    }
    window.open(`${apiBase}/${sk.id}/download`, '_blank');
  };

  // Nama entitas untuk baris tabel (pemprov untuk pemprov, kabupaten untuk kabupaten)
  const entityNameOf = (sk: SKRecord) => {
    if (kind === 'kabupaten') return sk.kabupaten_kota || 'N/A';
    const apiCabor: any = sk.cabor;
    const extracted = apiCabor && typeof apiCabor === 'object' ? apiCabor.nama_cabor : apiCabor;
    return sk.pemprov || extracted || 'N/A';
  };

  const entityLabel = kind === 'pemprov' ? 'Pemprov' : 'Kabupaten / Kota';
  const cardTitle = kind === 'pemprov' ? 'Kepengurusan Pemprov' : 'Kepengurusan Kabupaten';

  return (
    <>
      {showSuccessAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-sm">
              {successIsEdit ? (
                <span className="font-bold">Perubahan SK Berhasil Disimpan!</span>
              ) : (
                <>
                  <span className="font-bold">SK Baru Berhasil Diunggah!</span> Sistem otomatis memutasi status periode lama menjadi <span className="underline">Berakhir</span> dan mengaktifkan SK terbaru.
                </>
              )}
            </div>
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
              {kind === 'pemprov' ? (
                <Landmark className="w-5 h-5 text-[#b91c1c]" />
              ) : (
                <Building2 className="w-5 h-5 text-[#b91c1c]" />
              )}
              <h2 className="text-lg font-bold text-gray-900">{cardTitle}</h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {total} arsip
              </span>
            </div>
            <button
              onClick={openAddSKModal}
              className="flex items-center space-x-1.5 bg-[#b91c1c] hover:bg-red-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah SK</span>
            </button>
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
                  placeholder={kind === 'pemprov' ? 'Cari arsip...' : 'Cari wilayah atau arsip...'}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-6">{entityLabel}</th>
                <th className="py-3.5 px-6">No. SK</th>
                <th className="py-3.5 px-6">Tanggal Penetapan</th>
                <th className="py-3.5 px-6">Tanggal Berakhir</th>
                <th className="py-3.5 px-6">Ketua Umum</th>
                <th className="py-3.5 px-6">Sekretaris</th>
                <th className="py-3.5 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {skList.map((sk) => {
                return (
                <tr key={sk.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-bold text-gray-900">{entityNameOf(sk)}</td>
                    <td className="py-3.5 px-6 font-mono text-xs font-semibold text-gray-700">{sk.nomor_sk}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{(sk.tanggal_sk || '').slice(0, 10)}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{(sk.tanggal_berakhir || '').slice(0, 10)}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{sk.ketua_umum}</td>
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{sk.sekretaris || 'N/A'}</td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditSK(sk)}
                          title="Edit SK"
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadSignedUrl(sk)}
                          disabled={!sk.file_path_sk}
                          title={sk.file_path_sk ? 'Unduh via Secure Signed URL (5 menit)' : 'SK ini belum memiliki berkas dokumen'}
                          className={`text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                            sk.file_path_sk
                              ? 'text-gray-700 hover:text-[#b91c1c] hover:bg-red-50 bg-slate-100 border-gray-200'
                              : 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(sk)}
                          title="Hapus SK (permanen)"
                          className="text-gray-400 hover:text-[#b91c1c] hover:bg-red-50 p-2 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {skList.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada arsip SK yang cocok dengan pencarian Anda.
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
          noun="arsip"
          onPageChange={setPage}
        />
      </Card>

      {/* Input SK Modal */}
      {showInputModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white text-gray-900 border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">
                  {editingSK
                    ? `Edit SK ${kind === 'pemprov' ? 'Kepengurusan Pemprov' : 'Kepengurusan Kabupaten'}`
                    : `Registrasi SK ${kind === 'pemprov' ? 'Kepengurusan Pemprov' : 'Kepengurusan Kabupaten'} Baru`}
                </h3>
              </div>
              <button
                onClick={() => { setShowInputModal(false); setEditingSK(null); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id={`form-sk-${kind}`} onSubmit={handleSaveSK} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  {kind === 'pemprov' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        Pemprov <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Pengprov PSSI Aceh"
                        value={entity}
                        onChange={(e) => setEntity(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                      />
                    </div>
                  ) : (
                    <FormSelect
                      label="Kabupaten / Kota"
                      required
                      searchable
                      placeholder="Pilih wilayah..."
                      value={entity}
                      options={REGION_OPTIONS}
                      onSelect={setEntity}
                    />
                  )}
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Tanggal Berakhir <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={tanggalBerakhir}
                      onChange={(e) => setTanggalBerakhir(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Dipakai untuk peringatan kedaluwarsa SK (Early Warning System).</p>
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Sekretaris <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={sekretaris}
                    onChange={(e) => setSekretaris(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Berkas Asli PDF SK {editingSK ? <span className="text-amber-600">(opsional — kosongkan untuk mempertahankan berkas saat ini)</span> : <span className="text-red-500">*</span>}
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
                  ) : editingSK && editingSK.file_path_sk ? (
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Berkas saat ini tersimpan —{' '}
                        <span className="text-[#b91c1c] font-bold">klik untuk mengganti</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {editingSK.file_path_sk.split('/').pop()} (File PDF via Secure Signed URL, Max 5MB)
                      </div>
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
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex flex-wrap justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setShowInputModal(false); setEditingSK(null); }}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                form={`form-sk-${kind}`}
                className="flex items-center space-x-2 bg-[#b91c1c] hover:bg-red-800 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{editingSK ? 'Simpan Perubahan' : 'Simpan & Otomatisasi Status'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Delete Modal (konfirmasi ganda + ketik frasa) */}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title={`Hapus SK ${kind === 'pemprov' ? 'Kepengurusan Pemprov' : 'Kepengurusan Kabupaten'}`}
        description={deleteTarget
          ? `Anda akan menghapus arsip SK "${deleteTarget.nomor_sk}" (Ketua Umum: ${deleteTarget.ketua_umum}).`
          : ''}
        impact={deleteImpact}
        confirmPhrase={deleteTarget ? `hapus sk ${deleteTarget.nomor_sk}` : ''}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

// ---------------------------------------------------------------
// Kartu Histori (read-only) — arsip SK Berakhir, pemprov & kabupaten
// ---------------------------------------------------------------
function SKHistoriCard({ kind }: { kind: ManageKind }) {
  const [skList, setSkList] = useState<SKRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestSeq = useRef(0);

  const apiBase = API_BY_KIND[kind];

  const loadHistori = useCallback(async () => {
    const seq = ++requestSeq.current;
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    params.set('status_kepengurusan', 'Berakhir');
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}?${params.toString()}`);
      const data = await res.json();
      const body = data.data ?? data;
      if (seq !== requestSeq.current) return;

      if (Array.isArray(body)) {
        setSkList(body);
        setTotal(body.length);
      } else {
        const newTotal = body.pagination?.total ?? 0;
        const totalPages = body.pagination?.totalPages ?? 1;
        if (newTotal > 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        setSkList(body.items ?? []);
        setTotal(newTotal);
      }
    } catch (err) {
      console.error("Error fetching histori:", err);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [page, searchQuery, apiBase]);

  useEffect(() => {
    const timer = setTimeout(loadHistori, searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [loadHistori, searchQuery]);

  const entityNameOf = (sk: SKRecord) => {
    if (kind === 'kabupaten') return sk.kabupaten_kota || 'N/A';
    const apiCabor: any = sk.cabor;
    const extracted = apiCabor && typeof apiCabor === 'object' ? apiCabor.nama_cabor : apiCabor;
    return sk.pemprov || extracted || 'N/A';
  };

  const entityLabel = kind === 'pemprov' ? 'Pemprov' : 'Kabupaten / Kota';
  const cardTitle = kind === 'pemprov' ? 'Histori Kepengurusan Pemprov' : 'Histori Kepengurusan Kabupaten';

  return (
    <Card className="rounded-2xl overflow-hidden py-0 flex flex-col min-h-[520px]">
      <div className="px-6 py-4 border-b border-gray-100 space-y-3 shrink-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            {kind === 'pemprov' ? (
              <Landmark className="w-5 h-5 text-[#b91c1c]" />
            ) : (
              <Building2 className="w-5 h-5 text-[#b91c1c]" />
            )}
            <h2 className="text-lg font-bold text-gray-900">{cardTitle}</h2>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
              {total} arsip
            </span>
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
                placeholder="Cari arsip histori..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider">
              <th className="py-3.5 px-6">{entityLabel}</th>
              <th className="py-3.5 px-6">No. SK</th>
              <th className="py-3.5 px-6">Tanggal Penetapan</th>
              <th className="py-3.5 px-6">Tanggal Berakhir</th>
              <th className="py-3.5 px-6">Ketua Umum</th>
              <th className="py-3.5 px-6">Sekretaris</th>
              <th className="py-3.5 px-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {skList.map((sk) => (
              <tr key={sk.id} className="hover:bg-slate-50/60 transition">
                <td className="py-3.5 px-6 font-bold text-gray-900">{entityNameOf(sk)}</td>
                <td className="py-3.5 px-6 font-mono text-xs font-semibold text-gray-700">{sk.nomor_sk}</td>
                <td className="py-3.5 px-6 font-semibold text-gray-900">{(sk.tanggal_sk || '').slice(0, 10)}</td>
                <td className="py-3.5 px-6 font-semibold text-gray-900">{(sk.tanggal_berakhir || '').slice(0, 10)}</td>
                <td className="py-3.5 px-6 font-semibold text-gray-900">{sk.ketua_umum}</td>
                <td className="py-3.5 px-6 font-semibold text-gray-900">{sk.sekretaris || 'N/A'}</td>
                <td className="py-3.5 px-6 text-right">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => {
                        if (!sk.file_path_sk) {
                          alert('SK ini belum memiliki berkas dokumen.');
                          return;
                        }
                        window.open(`${apiBase}/${sk.id}/download`, '_blank');
                      }}
                      disabled={!sk.file_path_sk}
                      title={sk.file_path_sk ? 'Unduh via Secure Signed URL (5 menit)' : 'SK ini belum memiliki berkas dokumen'}
                      className={`text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                        sk.file_path_sk
                          ? 'text-gray-700 hover:text-[#b91c1c] hover:bg-red-50 bg-slate-100 border-gray-200'
                          : 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {skList.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  Belum ada arsip histori yang cocok dengan pencarian Anda.
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
        noun="arsip"
        onPageChange={setPage}
      />
    </Card>
  );
}

// ---------------------------------------------------------------
// Halaman utama — memilih kartu berdasarkan section
// ---------------------------------------------------------------
export default function ManagementPage({ section = 'pemprov' }: { section?: Section }) {
  const isHistori = section === 'histori';
  const manageKind: ManageKind = section === 'kabupaten' ? 'kabupaten' : 'pemprov';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Kepengurusan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola kepengurusan KONI Provinsi (pemprov) dan kabupaten/kota se-Aceh, beserta arsip histori Surat Keputusan secara terpusat.
        </p>
      </div>

      {isHistori ? (
        <>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#b91c1c]">
            <History className="w-4 h-4" />
            <span>Arsip Histori Kepengurusan (status Berakhir)</span>
          </div>
          <SKHistoriCard kind="pemprov" />
          <SKHistoriCard kind="kabupaten" />
        </>
      ) : (
        <SKManagementCard kind={manageKind} />
      )}
    </div>
  );
}

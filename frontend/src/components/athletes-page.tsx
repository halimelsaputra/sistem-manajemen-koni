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
  Pencil,
  Loader2,
  Check,
  MapPin
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

interface CabangCabor {
  id: number;
  cabor_id: number;
  nama_cabang: string;
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
  cabang_cabor_id?: number | null;
  cabang_cabor?: { nama_cabang: string } | null;
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

// Opsi penanda "belum pilih" pada dropdown cabang (cabor yang punya cabang → cabang WAJIB diisi)
const CABANG_PLACEHOLDER = '— Pilih Cabang —';

// Format tanggal DB (YYYY-MM-DD) → tampilan Indonesia (mis. 15 Jan 2024)
const formatTanggal = (t?: string): string => {
  if (!t) return '';
  const d = new Date(`${t}T00:00:00`);
  if (isNaN(d.getTime())) return t;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

type AthletesSection = 'prestasi' | 'atlet' | 'cabor';

export default function AthletesPage({ section = 'prestasi' }: { section?: AthletesSection }) {
  const [prestasiList, setPrestasiList] = useState<Prestasi[]>([]);
  const [atletList, setAtletList] = useState<Atlet[]>([]);
  const [caborList, setCaborList] = useState<Cabor[]>([]);
  const [cabangList, setCabangList] = useState<CabangCabor[]>([]);

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
  const [newCabangNama, setNewCabangNama] = useState('');
  // Cabang cabor (sub-cabang, mis. Renang → "Renang 200 meter")
  const [selectedCabang, setSelectedCabang] = useState('Tanpa Cabang');
  // Daftar sementara cabang saat menambah cabor baru (belum punya id karena cabor belum dibuat)
  const [tempCabangNames, setTempCabangNames] = useState<string[]>([]);
  // Edit nama cabang yang sedang berlangsung (null = tidak ada yang diedit)
  const [editingCabangId, setEditingCabangId] = useState<number | string | null>(null);
  const [editingCabangNama, setEditingCabangNama] = useState('');

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showAtletModal, setShowAtletModal] = useState(false);
  const [showCaborModal, setShowCaborModal] = useState(false);

  // Loading state tombol simpan — mencegah double-submit & memberi umpan balik
  const [caborSaving, setCaborSaving] = useState(false);
  const [prestasiSaving, setPrestasiSaving] = useState(false);
  const [atletSaving, setAtletSaving] = useState(false);

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

  // Filter tabel manajemen (client-side)
  const [atletSearch, setAtletSearch] = useState('');
  const [atletFilterCabor, setAtletFilterCabor] = useState('Semua Cabor');
  const [atletFilterDaerah, setAtletFilterDaerah] = useState('Semua Daerah');
  const [caborSearch, setCaborSearch] = useState('');

  // Peran & wilayah pengguna yang login — menentukan pembatasan akses
  const [userRole, setUserRole] = useState<'superadmin' | 'admin_wilayah' | null>(null);
  const [userRegion, setUserRegion] = useState<string | null>(null);

  // Penjaga race condition: respons basi dari request lama diabaikan
  const requestSeq = useRef(0);

  const fetchCabor = () => fetch('/api/cabor').then(res => res.json()).then(data => {
    const arr = Array.isArray(data) ? data : data.data || [];
    // Urutkan sesuai abjad (nama cabor) — berlaku untuk tabel & semua dropdown cabor
    const sorted = [...arr].sort((a, b) => (a.nama_cabor || '').localeCompare(b.nama_cabor || '', 'id'));
    setCaborList(sorted);
    if (sorted.length > 0) setNewAtletCabor(sorted[0].nama_cabor);
  }).catch(console.error);

  const fetchAtlet = () => fetch('/api/atlet').then(res => res.json()).then(data => {
    const arr = Array.isArray(data) ? data : data.data || [];
    // Urutkan sesuai abjad (nama atlet) — berlaku untuk tabel manajemen & semua dropdown atlet
    const sorted = [...arr].sort((a, b) => (a.nama_atlet || '').localeCompare(b.nama_atlet || '', 'id'));
    setAtletList(sorted);
    if (sorted.length > 0) setSelectedAtletName(sorted[0].nama_atlet);
  }).catch(console.error);

  const fetchCabang = () => fetch('/api/cabang-cabor').then(res => res.json()).then(data => {
    const arr = Array.isArray(data) ? data : data.data || [];
    setCabangList(arr);
  }).catch(console.error);

  // Filter & pagination server-side: semua filter dikirim sebagai query params,
  // sehingga pencarian berlaku di seluruh dataset (bukan hanya halaman aktif).
  const loadPrestasi = useCallback(async () => {
    // Halaman Atlet/Cabor tidak menampilkan tabel prestasi → lewati fetch
    if (section !== 'prestasi') return;
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
  }, [page, searchQuery, filterCabor, filterDaerah, caborList, section]);

  // Debounce pencarian (350ms) agar tidak refetch per ketukan tombol
  useEffect(() => {
    const timer = setTimeout(loadPrestasi, searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [loadPrestasi, searchQuery]);

  useEffect(() => {
    setMounted(true);
    fetchCabor();
    fetchAtlet();
    fetchCabang();
    // Muat peran pengguna — menentukan batasan wilayah & hak akses
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(d => {
        if (d?.data) {
          setUserRole(d.data.role);
          setUserRegion(d.data.region ?? null);
        }
      })
      .catch(console.error);
  }, []);

  const isSuperAdmin = userRole === 'superadmin';
  const isRegionalAdmin = userRole === 'admin_wilayah';

  // Admin wilayah: kunci filter & form ke wilayahnya sendiri.
  // Pola resmi React — sesuaikan state saat render (bukan di dalam effect)
  // agar tidak memicu cascading render.
  if (isRegionalAdmin && userRegion) {
    if (filterDaerah !== userRegion) setFilterDaerah(userRegion);
    if (atletFilterDaerah !== userRegion) setAtletFilterDaerah(userRegion);
    if (newAtletDaerah !== userRegion) setNewAtletDaerah(userRegion);
  }

  const handleSavePrestasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prestasiSaving) return; // cegah double-submit
    const atlet = atletList.find(a => a.nama_atlet === selectedAtletName);
    if (!atlet) return alert('Silakan pilih atlet.');
    if (!event) return alert('Nama event harus diisi.');
    if (!tanggal) return alert('Tanggal kejuaraan harus diisi.');

    // Cabor atlet punya cabang → wajib pilih salah satu cabang
    const atletCaborHasCabang = cabangList.some(c => c.cabor_id === atlet.cabor_id);
    if (atletCaborHasCabang && (!selectedCabang || selectedCabang === 'Tanpa Cabang' || selectedCabang === CABANG_PLACEHOLDER)) {
      return alert('Cabor ini memiliki cabang — silakan pilih cabang cabor.');
    }

    const payload = {
      atlet_id: atlet.id,
      event_kejuaraan: event,
      tanggal,
      tingkat_lomba: tingkat,
      mendali: medali,
      cabang_cabor_id: resolveCabangId()
    };

    setPrestasiSaving(true);
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
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Gagal menyimpan prestasi');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    } finally {
      setPrestasiSaving(false);
    }
  };

  // Buka modal tambah prestasi (reset form + mode tambah)
  const openAddPrestasiModal = () => {
    setEditingPrestasi(null);
    setEvent('');
    setTanggal('');
    setTingkat('Daerah');
    setMedali('Emas');
    // Atlet default sudah terpilih — sinkronkan kewajiban cabang
    syncCabangAfterAtlet(selectedAtletName);
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
    if (p.cabang_cabor?.nama_cabang) {
      setSelectedCabang(p.cabang_cabor.nama_cabang);
    } else {
      syncCabangAfterAtlet(details.nama);
    }
    setShowInputModal(true);
  };

  // Sinkronkan pilihan cabang setelah atlet (atau cabor) berubah:
  // cabor bercabang → wajib pilih cabang (placeholder); tanpa cabang → "Tanpa Cabang"
  const syncCabangAfterAtlet = (atletNama: string) => {
    const a = atletList.find(x => x.nama_atlet === atletNama);
    const has = a ? cabangList.some(c => c.cabor_id === a.cabor_id) : false;
    setSelectedCabang(has ? CABANG_PLACEHOLDER : 'Tanpa Cabang');
  };

  // Cari id cabang dari nama yang dipilih (mengikuti cabor atlet terpilih)
  const resolveCabangId = (): number | null => {
    if (!selectedCabang || selectedCabang === 'Tanpa Cabang' || selectedCabang === CABANG_PLACEHOLDER) return null;
    const atletObj = atletList.find(a => a.nama_atlet === selectedAtletName);
    if (!atletObj) return null;
    const cab = cabangList.find(c => c.nama_cabang === selectedCabang && c.cabor_id === atletObj.cabor_id);
    return cab?.id ?? null;
  };

  const handleSaveCabor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (caborSaving) return; // cegah double-submit
    if (!newCaborNama) return alert('Nama cabor harus diisi.');
    const namaCabor = newCaborNama.trim();
    const caborDup = caborList.find(c => c.nama_cabor.toLowerCase() === namaCabor.toLowerCase() && c.id !== editingCabor?.id);
    if (caborDup) return alert(`Cabor "${namaCabor}" sudah terdaftar.`);

    // Jaring pengaman: cabang yang masih tertulis di input ikut disimpan
    // (berlaku mode tambah & edit) — mencegah cabang hilang walau user lupa
    // klik "Tambah". Nama yang sudah ada (duplikat) tidak disertakan.
    const pendingNama = newCabangNama.trim();
    const isPendingDup = editingCabor
      ? cabangList.some(c => c.cabor_id === editingCabor.id && c.nama_cabang.toLowerCase() === pendingNama.toLowerCase())
      : tempCabangNames.some(n => n.toLowerCase() === pendingNama.toLowerCase());
    const cabangToSave = pendingNama && !isPendingDup
      ? [...tempCabangNames, pendingNama]
      : tempCabangNames;

    setCaborSaving(true);
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
        // Mode tambah: simpan cabang-cabang sementara ke cabor yang baru dibuat
        let caborId = editingCabor?.id;
        if (!editingCabor) {
          const created = await res.json().catch(() => ({}));
          caborId = created?.data?.id ?? created?.id;
        }
        if (caborId) {
          for (const nama of cabangToSave) {
            if (!nama.trim()) continue;
            try {
              await fetch(`/api/cabor/${caborId}/cabang`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama_cabang: nama })
              });
            } catch (err) {
              console.error(err);
            }
          }
        }
        setTempCabangNames([]);
        setShowCaborModal(false);
        setNewCaborNama('');
        setNewCabangNama('');
        setEditingCabor(null);
        fetchCabor();
        fetchCabang();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Gagal menyimpan cabor');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    } finally {
      setCaborSaving(false);
    }
  };

  // Buka modal tambah cabor (mode tambah + reset form)
  const openAddCaborModal = () => {
    setEditingCabor(null);
    setNewCaborNama('');
    setNewCabangNama('');
    setTempCabangNames([]);
    cancelEditCabang();
    setShowCaborModal(true);
  };

  // Buka modal edit cabor (form diisi nama lama)
  const openEditCabor = (c: Cabor) => {
    setEditingCabor(c);
    setNewCaborNama(c.nama_cabor);
    setNewCabangNama('');
    setTempCabangNames([]);
    cancelEditCabang();
    setShowCaborModal(true);
  };

  // Tambah cabang ke daftar modal cabor (langsung simpan saat edit, tampung dulu saat tambah)
  const addCabangToCabor = async () => {
    const nama = newCabangNama.trim();
    if (!nama) return alert('Nama cabang harus diisi.');
    if (editingCabor) {
      const cabDup = cabangList.find(c => c.cabor_id === editingCabor.id && c.nama_cabang.toLowerCase() === nama.toLowerCase());
      if (cabDup) return alert(`Cabang "${nama}" sudah ada pada cabor ini.`);
      try {
        const res = await fetch(`/api/cabor/${editingCabor.id}/cabang`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_cabang: nama })
        });
        if (res.ok) {
          setNewCabangNama('');
          fetchCabang();
        } else {
          alert('Gagal menambah cabang');
        }
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan');
      }
    } else {
      const tmpDup = tempCabangNames.find(n => n.toLowerCase() === nama.toLowerCase());
      if (tmpDup) return alert(`Cabang "${nama}" sudah ditambahkan.`);
      setTempCabangNames(prev => [...prev, nama]);
      setNewCabangNama('');
    }
  };

  // Mulai edit nama cabang (mode edit: id DB; mode tambah: id temp-N)
  const startEditCabang = (cab: { id: number | string; nama_cabang: string }) => {
    setEditingCabangId(cab.id);
    setEditingCabangNama(cab.nama_cabang);
  };

  const cancelEditCabang = () => {
    setEditingCabangId(null);
    setEditingCabangNama('');
  };

  // Simpan perubahan nama cabang
  const saveEditCabang = async (cab: { id: number | string; nama_cabang: string }) => {
    const nama = editingCabangNama.trim();
    if (!nama) return alert('Nama cabang harus diisi.');

    if (editingCabor && typeof cab.id === 'number') {
      const cabDup = cabangList.find(c => c.cabor_id === editingCabor.id && c.nama_cabang.toLowerCase() === nama.toLowerCase() && c.id !== cab.id);
      if (cabDup) return alert(`Cabang "${nama}" sudah ada pada cabor ini.`);
      try {
        const res = await fetch(`/api/cabor/${editingCabor.id}/cabang/${cab.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama_cabang: nama })
        });
        if (res.ok) {
          // Jika cabang ini sedang terpilih di form prestasi, ikut perbarui nama terpilihnya
          if (selectedCabang === cab.nama_cabang) setSelectedCabang(nama);
          cancelEditCabang();
          fetchCabang();
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.message || 'Gagal mengubah cabang');
        }
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan');
      }
    } else {
      // Mode tambah: cukup ganti nama di daftar sementara
      setTempCabangNames(prev => prev.map(n => n === cab.nama_cabang ? nama : n));
      cancelEditCabang();
    }
  };

  // Hapus cabang dari daftar (edit: langsung hapus; tambah: hapus dari daftar sementara)
  const removeCabang = async (cab: { id: number | string; nama_cabang: string }) => {
    if (editingCabor && typeof cab.id === 'number') {
      try {
        const res = await fetch(`/api/cabor/${editingCabor.id}/cabang/${cab.id}`, { method: 'DELETE' });
        if (res.ok) {
          if (selectedCabang === cab.nama_cabang) setSelectedCabang('Tanpa Cabang');
          fetchCabang();
          loadPrestasi(); // prestasi yang mereferensikan cabang ini di-set null oleh DB
        } else {
          alert('Gagal menghapus cabang');
        }
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan');
      }
    } else {
      setTempCabangNames(prev => prev.filter(n => n !== cab.nama_cabang));
    }
  };

  const handleSaveAtlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (atletSaving) return; // cegah double-submit
    if (!newAtletNama) return alert('Nama atlet harus diisi.');
    const selCabor = caborList.find(c => c.nama_cabor === newAtletCabor);
    if (!selCabor) return alert('Cabang olahraga invalid.');
    const namaAtlet = newAtletNama.trim();
    // Duplikat = nama + cabor + daerah semuanya sama (beda daerah → boleh)
    const atletDup = atletList.find(a =>
      a.nama_atlet.toLowerCase() === namaAtlet.toLowerCase() &&
      a.cabor_id === selCabor.id &&
      a.kabupaten_kota.toLowerCase() === newAtletDaerah.trim().toLowerCase() &&
      a.id !== editingAtlet?.id
    );
    if (atletDup) return alert(`Atlet "${namaAtlet}" sudah terdaftar pada cabor dan daerah yang sama.`);

    const payload = {
      nama_atlet: newAtletNama,
      kabupaten_kota: newAtletDaerah,
      cabor_id: selCabor.id
    };

    setAtletSaving(true);
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
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Gagal menyimpan atlet');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
    } finally {
      setAtletSaving(false);
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
          fetchCabang();
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

  // Atlet terpilih di form prestasi → untuk memfilter cabang cabor milik cabornya
  const selAtletObj = atletList.find(a => a.nama_atlet === selectedAtletName);
  const cabangOptions = selAtletObj
    ? cabangList.filter(c => c.cabor_id === selAtletObj.cabor_id).map(c => c.nama_cabang)
    : [];

  // Nama cabor atlet terpilih & apakah cabor tersebut punya cabang
  const selCaborNama = selAtletObj
    ? caborList.find(c => c.id === selAtletObj.cabor_id)?.nama_cabor || ''
    : '';
  const caborHasCabang = selAtletObj
    ? cabangList.some(c => c.cabor_id === selAtletObj.cabor_id)
    : false;

  // Filter client-side tabel manajemen (search + dropdown)
  const filteredAtletList = atletList.filter(a => {
    const q = atletSearch.trim().toLowerCase();
    if (q && !a.nama_atlet.toLowerCase().includes(q)) return false;
    if (atletFilterCabor !== 'Semua Cabor') {
      const c = caborList.find(x => x.nama_cabor === atletFilterCabor);
      if (!c || c.id !== a.cabor_id) return false;
    }
    if (atletFilterDaerah !== 'Semua Daerah' && a.kabupaten_kota !== atletFilterDaerah) return false;
    return true;
  });

  // Potongan halaman untuk tabel manajemen (client-side).
  // Safe page dihitung langsung (bukan via useEffect) agar tidak ada frame kosong
  // sesaat saat list menyusut (mis. user di halaman 5 lalu data terhapus hingga sisa 2 halaman).
  const atletMaxPage = Math.max(1, Math.ceil(filteredAtletList.length / PAGE_SIZE));
  const atletSafePage = Math.min(atletPage, atletMaxPage);
  const atletPageItems = filteredAtletList.slice((atletSafePage - 1) * PAGE_SIZE, atletSafePage * PAGE_SIZE);

  // Cabor diurutkan abjad saat fetch; filter search client-side (nama cabor)
  const filteredCaborList = caborList.filter(c => {
    const q = caborSearch.trim().toLowerCase();
    return !q || c.nama_cabor.toLowerCase().includes(q);
  });
  const caborMaxPage = Math.max(1, Math.ceil(filteredCaborList.length / PAGE_SIZE));
  const caborSafePage = Math.min(caborPage, caborMaxPage);
  const caborPageItems = filteredCaborList.slice((caborSafePage - 1) * PAGE_SIZE, caborSafePage * PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Direktori Prestasi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manajemen pencapaian atlet, data atlet, dan cabang olahraga secara terpusat.
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

      {/* Manajemen Prestasi */}
      {section === 'prestasi' && (
      <Card className="rounded-2xl overflow-hidden py-0 flex flex-col min-h-[780px]">
        <div className="px-6 py-4 border-b border-gray-100 space-y-3 shrink-0">
          <div className="flex flex-col gap-3 items-start sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-gray-900">Database Prestasi Regional</h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {total} rekor
              </span>
            </div>
            <button
              onClick={openAddPrestasiModal}
              className="flex items-center space-x-1.5 bg-[#b91c1c] hover:bg-red-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Prestasi</span>
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
              {isRegionalAdmin ? (
                <>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Daerah</label>
                  <div className="px-3.5 py-2.5 bg-slate-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#b91c1c]" />
                    {userRegion}
                  </div>
                </>
              ) : (
                <FormSelect
                  label="Daerah"
                  value={filterDaerah}
                  options={['Semua Daerah', ...MOCK_REGIONS.map(r => r.kabupaten_kota)]}
                  onSelect={(v) => { setFilterDaerah(v); setPage(1); }}
                />
              )}
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
                <th className="py-3.5 px-6">Cabang</th>
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
                      {item.cabang_cabor?.nama_cabang || <span className="text-gray-300">-</span>}
                    </td>
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
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
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
      )}

      {/* Manajemen Data Atlet */}
      {section === 'atlet' && (
      <Card className="rounded-2xl overflow-hidden py-0">
        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col gap-3 items-start sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-gray-900">Manajemen Data Atlet</h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {atletList.length} atlet
              </span>
            </div>
            <button
              onClick={openAddAtletModal}
              className="flex items-center space-x-1.5 bg-[#b91c1c] hover:bg-red-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Atlet</span>
            </button>
          </div>

          {/* Filter tabel atlet */}
          <div className="flex flex-wrap items-end gap-2 mt-3">
            <div className="relative w-full sm:w-auto sm:min-w-[220px]">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Cari Atlet
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama atlet..."
                  value={atletSearch}
                  onChange={(e) => { setAtletSearch(e.target.value); setAtletPage(1); }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
                />
              </div>
            </div>
            <div className="shrink-0">
              <FormSelect
                label="Cabor"
                value={atletFilterCabor}
                options={['Semua Cabor', ...caborOptions]}
                onSelect={(v) => { setAtletFilterCabor(v); setAtletPage(1); }}
              />
            </div>
            <div className="shrink-0">
              {isRegionalAdmin ? (
                <>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Daerah</label>
                  <div className="px-3.5 py-2.5 bg-slate-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#b91c1c]" />
                    {userRegion}
                  </div>
                </>
              ) : (
                <FormSelect
                  label="Daerah"
                  value={atletFilterDaerah}
                  options={['Semua Daerah', ...MOCK_REGIONS.map(r => r.kabupaten_kota)]}
                  onSelect={(v) => { setAtletFilterDaerah(v); setAtletPage(1); }}
                />
              )}
            </div>
          </div>
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
                  {atletList.length === 0 ? 'Belum ada data atlet.' : 'Tidak ada data atlet yang cocok dengan filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <Pagination
          page={atletSafePage}
          totalPages={atletMaxPage}
          total={filteredAtletList.length}
          pageSize={PAGE_SIZE}
          noun="atlet"
          onPageChange={setAtletPage}
        />
      </Card>
      )}

      {/* Manajemen Data Cabor */}
      {section === 'cabor' && (
      <Card className="rounded-2xl overflow-hidden py-0">
        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col gap-3 items-start sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-gray-900">Manajemen Data Cabor</h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {caborList.length} cabor
              </span>
            </div>
            {isSuperAdmin && (
              <button
                onClick={openAddCaborModal}
                className="flex items-center space-x-1.5 bg-[#b91c1c] hover:bg-red-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Cabor</span>
              </button>
            )}
          </div>

          {/* Search cabor — lebar tetap di kiri, tidak melebar penuh */}
          <div className="relative w-full sm:w-56">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Cari Cabor
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama cabor..."
                value={caborSearch}
                onChange={(e) => { setCaborSearch(e.target.value); setCaborPage(1); }}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition"
              />
            </div>
          </div>
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
                <td className="py-3 px-6 font-bold text-gray-900">
                  {c.nama_cabor}
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-[#b91c1c] px-2 py-0.5 rounded-full">
                    {cabangList.filter(cb => cb.cabor_id === c.id).length} cabang
                  </span>
                </td>
                <td className="py-3 px-6 text-right">
                  {isSuperAdmin ? (
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
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">Baca saja</span>
                  )}
                </td>
              </tr>
            ))}
            {caborPageItems.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center py-8 text-gray-400 text-sm">
                  {caborList.length === 0 ? 'Belum ada data cabor.' : 'Tidak ada data cabor yang cocok dengan pencarian.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <Pagination
          page={caborSafePage}
          totalPages={caborMaxPage}
          total={filteredCaborList.length}
          pageSize={PAGE_SIZE}
          noun="cabor"
          onPageChange={setCaborPage}
        />
      </Card>
      )}

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
                disabled={prestasiSaving}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrestasi} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  {atletOptions.length > 0 ? (
                    <FormSelect
                      label="Pilih Atlet"
                      value={selectedAtletName}
                      options={atletOptions}
                      onSelect={(v) => { setSelectedAtletName(v); syncCabangAfterAtlet(v); }}
                    />
                  ) : (
                    <div className="text-sm text-gray-500 font-medium pb-2 border-b">
                      Belum ada data atlet. Silakan tambah atlet baru.
                    </div>
                  )}
                </div>

                {selAtletObj && (
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Dropdown Cabor — menampilkan cabor dari atlet yang dipilih */}
                      <div>
                        <FormSelect
                          label="Cabor"
                          value={selCaborNama}
                          options={selCaborNama ? [selCaborNama] : []}
                          onSelect={() => {}}
                        />
                      </div>
                      {/* Dropdown Cabang Cabor — hanya muncul jika cabor punya cabang */}
                      {caborHasCabang ? (
                        <div>
                          <FormSelect
                            label="Cabang Cabor"
                            required
                            value={selectedCabang}
                            options={[CABANG_PLACEHOLDER, ...cabangOptions]}
                            onSelect={setSelectedCabang}
                          />
                        </div>
                      ) : (
                        <div className="flex items-end text-xs text-gray-400 font-medium pb-2.5">
                          Cabor ini belum memiliki cabang.
                        </div>
                      )}
                    </div>

                  </div>
                )}

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
                disabled={prestasiSaving}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePrestasi}
                disabled={prestasiSaving}
                className="flex items-center space-x-2 bg-[#b91c1c] hover:bg-red-800 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prestasiSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{prestasiSaving ? 'Menyimpan...' : editingPrestasi ? 'Simpan Perubahan' : 'Simpan Prestasi'}</span>
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
                disabled={caborSaving}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition disabled:opacity-40"
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

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Cabang Cabor <span className="text-gray-400 font-medium normal-case">(opsional — bisa lebih dari satu)</span>
                </label>

                <div className="space-y-2 mb-3">
                  {(editingCabor
                    ? cabangList.filter(c => c.cabor_id === editingCabor.id)
                    : tempCabangNames.map((n, i) => ({ id: `temp-${i}`, cabor_id: 0, nama_cabang: n }))
                  ).map((cab) => (
                    <div key={cab.id} className="flex items-center justify-between bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-2.5">
                      {editingCabangId === cab.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingCabangNama}
                            onChange={(e) => setEditingCabangNama(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveEditCabang(cab);
                              }
                            }}
                            autoFocus
                            className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 outline-none focus:border-[#b91c1c] transition"
                          />
                          <button
                            type="button"
                            onClick={() => saveEditCabang(cab)}
                            title="Simpan cabang"
                            className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditCabang}
                            title="Batal"
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-gray-800">{cab.nama_cabang}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditCabang(cab)}
                              title="Edit nama cabang"
                              className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCabang(cab)}
                              title="Hapus cabang"
                              className="text-gray-400 hover:text-[#b91c1c] hover:bg-red-50 p-1.5 rounded-lg transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {(editingCabor
                    ? cabangList.filter(c => c.cabor_id === editingCabor.id).length
                    : tempCabangNames.length
                  ) === 0 && (
                    <p className="text-xs text-gray-400">
                      {editingCabor ? 'Belum ada cabang untuk cabor ini.' : 'Belum ada cabang ditambahkan.'}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Renang 200 meter"
                    value={newCabangNama}
                    onChange={(e) => setNewCabangNama(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // tambah cabang, jangan submit cabor
                        addCabangToCabor();
                      }
                    }}
                    disabled={caborSaving}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={addCabangToCabor}
                    disabled={caborSaving}
                    className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-2.5 px-4 rounded-xl transition border border-gray-200 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah
                  </button>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setShowCaborModal(false); setEditingCabor(null); }}
                disabled={caborSaving}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCabor}
                disabled={caborSaving}
                className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {caborSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{caborSaving ? 'Menyimpan...' : editingCabor ? 'Simpan Perubahan' : 'Simpan Cabor'}</span>
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
                disabled={atletSaving}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition disabled:opacity-40"
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
                {isRegionalAdmin ? (
                  <>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Asal Kabupaten / Kota</label>
                    <div className="px-3.5 py-2.5 bg-slate-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#b91c1c]" />
                      {userRegion}
                    </div>
                  </>
                ) : (
                  <FormSelect
                    label="Asal Kabupaten / Kota"
                    value={newAtletDaerah}
                    options={MOCK_REGIONS.map(r => r.kabupaten_kota)}
                    onSelect={setNewAtletDaerah}
                  />
                )}
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setShowAtletModal(false); setEditingAtlet(null); }}
                disabled={atletSaving}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAtlet}
                disabled={atletSaving}
                className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {atletSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{atletSaving ? 'Menyimpan...' : editingAtlet ? 'Simpan Perubahan' : 'Daftarkan Atlet'}</span>
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

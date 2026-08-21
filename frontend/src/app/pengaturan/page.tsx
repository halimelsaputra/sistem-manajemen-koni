'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  UserCog,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  Save,
  ShieldCheck,
  MapPin,
  KeyRound,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import ConfirmDeleteModal from '@/components/ui/confirm-delete-modal';
import { REGION_COORDINATES } from '@/data/mapData';

interface AdminUser {
  id: number;
  username: string;
  role: string;
  kabupaten_kota: string | null;
  created_at?: string;
  updated_at?: string;
}

// Daftar 23 wilayah administratif Aceh (sumber sama dengan peta dashboard)
const REGION_OPTIONS = REGION_COORDINATES.map((r) => r.kabupaten_kota).sort((a, b) =>
  a.localeCompare(b, 'id')
);

export default function PengaturanAdminPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Tambah admin
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);

  // Edit admin
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Hapus admin
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin');
      if (res.status === 403) {
        // Non-superadmin tidak diizinkan — biarkan middleware/redirect menangani
        return;
      }
      const data = await res.json();
      setAdmins(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Gagal memuat daftar admin:', err);
      setMessage({ type: 'error', text: 'Gagal memuat daftar admin.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4500);
  };

  // ---------- Tambah admin ----------
  const openAddModal = (region?: string) => {
    setNewUsername('');
    setNewPassword('');
    setNewRegion(region || '');
    setShowAddModal(true);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return alert('Username wajib diisi.');
    if (newPassword.length < 6) return alert('Kata sandi minimal 6 karakter.');
    if (!newRegion) return alert('Wilayah wajib dipilih.');

    setSavingAdd(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          kabupaten_kota: newRegion,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowAddModal(false);
        showMsg('success', data.message || 'Admin berhasil ditambahkan.');
        loadAdmins();
      } else {
        alert(data.message || 'Gagal menambahkan admin.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan pada server.');
    } finally {
      setSavingAdd(false);
    }
  };

  // ---------- Edit admin ----------
  const openEditModal = (admin: AdminUser) => {
    setEditing(admin);
    setEditUsername(admin.username);
    setEditPassword('');
    setEditRegion(admin.kabupaten_kota || '');
    setShowAddModal(false);
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editUsername.trim()) return alert('Username wajib diisi.');
    if (editPassword && editPassword.length < 6) return alert('Kata sandi minimal 6 karakter.');
    if (!editRegion) return alert('Wilayah wajib dipilih.');

    setSavingEdit(true);
    try {
      const payload: Record<string, string> = {
        username: editUsername.trim(),
        kabupaten_kota: editRegion,
      };
      if (editPassword) payload.password = editPassword;

      const res = await fetch(`/api/admin/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEditing(null);
        showMsg('success', data.message || 'Admin berhasil diperbarui.');
        loadAdmins();
      } else {
        alert(data.message || 'Gagal memperbarui admin.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan pada server.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------- Hapus admin ----------
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: `hapus admin ${deleteTarget.username}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDeleteTarget(null);
        showMsg('success', data.message || 'Admin berhasil dihapus.');
        loadAdmins();
      } else {
        alert(data.message || 'Gagal menghapus admin.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan pada server.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Wilayah → admin (satu wilayah = satu admin)
  const adminByRegion = new Map<string, AdminUser>();
  admins.forEach((a) => {
    if (a.kabupaten_kota) adminByRegion.set(a.kabupaten_kota, a);
  });

  // Wilayah yang sudah terpakai (dipakai di modal tambah → di-disable di dropdown)
  const takenRegions = new Set(admins.map((a) => a.kabupaten_kota).filter(Boolean) as string[]);

  // Filter kartu berdasarkan pencarian (wilayah atau username)
  const filteredRegions = REGION_OPTIONS.filter((region) => {
    const admin = adminByRegion.get(region);
    return (
      region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin?.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Pengaturan Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola akun admin per wilayah — lihat, tambahkan, ubah username &amp; kata sandi, dan hapus akun secara terpusat.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-xl border shadow-sm animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            {message.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Daftar Admin — 1 kartu per wilayah */}
      <Card className="rounded-2xl overflow-hidden py-0 flex flex-col min-h-[560px]">
        <div className="px-6 py-4 border-b border-gray-100 space-y-3 shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-[#b91c1c] flex items-center justify-center">
                <UserCog className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Admin per Wilayah</h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {admins.length} dari {REGION_OPTIONS.length} wilayah
              </span>
            </div>
            <Button
              onClick={() => openAddModal()}
              className="w-full sm:w-auto hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Admin</span>
            </Button>
          </div>

          {/* Search — sisi kiri saja */}
          <div className="relative w-full sm:w-auto sm:min-w-[240px] shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari wilayah atau username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-[#b91c1c] transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-[1.01] focus:shadow-lg focus:shadow-black/10 focus:scale-[1.01]"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Memuat...
            </div>
          ) : filteredRegions.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              Tidak ada wilayah yang cocok dengan pencarian Anda.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRegions.map((region) => {
                const admin = adminByRegion.get(region);
                return (
                  <div
                    key={region}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col"
                  >
                    {/* Header kartu — wilayah + aksi */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-[#b91c1c] flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{region}</h3>
                          <span className="text-[11px] font-semibold text-gray-400">
                            {admin ? 'Admin Wilayah' : 'Belum ada admin'}
                          </span>
                        </div>
                      </div>
                      {admin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditModal(admin)}
                            title="Edit admin"
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-105"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(admin)}
                            title="Hapus admin (permanen)"
                            className="text-gray-400 hover:text-[#b91c1c] hover:bg-red-50 p-1.5 rounded-lg transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-105"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {admin ? (
                      <div className="space-y-3 mt-auto">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#b91c1c] text-white flex items-center justify-center font-black text-xs shrink-0">
                            {(admin.username || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Username</div>
                            <div className="text-sm font-bold text-gray-900 truncate">{admin.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-gray-400 flex items-center justify-center shrink-0">
                            <KeyRound className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kata Sandi</div>
                            <div className="text-sm font-medium text-gray-700 tracking-widest">••••••••</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <button
                          onClick={() => openAddModal(region)}
                          className="w-full flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-red-50 hover:text-[#b91c1c] text-gray-700 font-bold text-xs py-2.5 px-4 rounded-xl transition border border-gray-200 hover:border-red-200"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambah Admin</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Modal Tambah Admin */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white text-gray-900 border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-[#b91c1c] flex items-center justify-center">
                  <UserCog className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Tambah Admin Wilayah</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-105"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: admin.banda-aceh"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-[1.01] focus:shadow-lg focus:shadow-black/10 focus:scale-[1.01]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Kata Sandi <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-[1.01] focus:shadow-lg focus:shadow-black/10 focus:scale-[1.01]"
                />
              </div>

              <div>
                <FormSelect
                  label="Wilayah"
                  value={newRegion}
                  options={REGION_OPTIONS}
                  disabledOptions={new Set(
                    REGION_OPTIONS.filter((r) => takenRegions.has(r))
                  )}
                  placeholder="Pilih wilayah..."
                  onSelect={setNewRegion}
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Satu wilayah hanya dapat dikelola oleh satu admin.
                </p>
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                className="hover:shadow-lg hover:shadow-black/10 hover:scale-105"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={savingAdd}
                className="hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
              >
                {savingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{savingAdd ? 'Menyimpan...' : 'Simpan Admin'}</span>
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Edit Admin */}
      {editing && createPortal(
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white text-gray-900 border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-[#b91c1c] flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Edit Admin — {editing.kabupaten_kota || editing.username}</h3>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-105"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAdmin} className="p-6 space-y-5 overflow-y-auto">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#b91c1c] text-white flex items-center justify-center font-black shrink-0">
                  {(editUsername || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{editUsername}</div>
                  <div className="text-xs font-semibold text-gray-500">Admin Wilayah</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: admin.banda-aceh"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-[1.01] focus:shadow-lg focus:shadow-black/10 focus:scale-[1.01]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Kata Sandi Baru <span className="text-amber-600">(kosongkan jika tidak diubah)</span>
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-[1.01] focus:shadow-lg focus:shadow-black/10 focus:scale-[1.01]"
                />
              </div>

              <div>
                <FormSelect
                  label="Wilayah"
                  value={editRegion}
                  options={REGION_OPTIONS}
                  disabledOptions={new Set(
                    REGION_OPTIONS.filter((r) => takenRegions.has(r) && r !== editing.kabupaten_kota)
                  )}
                  placeholder="Pilih wilayah..."
                  onSelect={setEditRegion}
                />
              </div>
            </form>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(null)}
                className="hover:shadow-lg hover:shadow-black/10 hover:scale-105"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className="hover:shadow-lg hover:shadow-primary/30 hover:scale-105"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Hapus Admin */}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title="Hapus Akun Admin"
        description={deleteTarget
          ? `Anda akan menghapus akun admin "${deleteTarget.username}" (wilayah ${deleteTarget.kabupaten_kota || '-'}). Admin tersebut akan langsung kehilangan akses ke sistem.`
          : ''}
        confirmPhrase={deleteTarget ? `hapus admin ${deleteTarget.username}` : ''}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Info tambahan */}
      <div className="flex items-start gap-3 text-sm text-gray-500 bg-white border border-gray-100 rounded-2xl p-4">
        <ShieldCheck className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
        <p>
          Halaman ini khusus <span className="font-bold text-gray-900">Super Admin</span>. Setiap wilayah dikelola oleh
          satu admin — username &amp; kata sandinya dapat diubah dari sini kapan saja. Kata sandi tidak pernah
          ditampilkan (tersimpan ter-hash), ganti lewat menu edit.
        </p>
      </div>
    </div>
  );
}

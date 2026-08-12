'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PengaturanPage() {
  const [user, setUser] = useState<{ username: string; role: string; region: string | null } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          window.location.href = '/login';
          return null;
        }
        const data = await res.json();
        return data?.data ?? null;
      })
      .then(setUser)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Kata sandi berhasil diubah.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal mengubah kata sandi.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Terjadi kesalahan pada server.' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Memuat...
      </div>
    );
  }

  const isSuper = user.role === 'superadmin';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Pengaturan Akun</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola kata sandi akun Anda.
        </p>
      </div>

      <Card className="max-w-lg p-6">
        {isSuper ? (
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <ShieldCheck className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
            <p>
              Akun <span className="font-bold text-gray-900">{user.username}</span> adalah <span className="font-bold">Super Admin</span>.
              Kata sandinya dikelola melalui konfigurasi server (variabel lingkungan <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">ADMIN_PASSWORD</code>),
              bukan melalui menu ini.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#b91c1c] text-white flex items-center justify-center font-black shrink-0">
                {(user.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{user.username}</div>
                <div className="text-xs font-semibold text-gray-500">Admin · {user.region || 'Wilayah'}</div>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-sm font-semibold border flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : null}
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Kata Sandi Saat Ini <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full bg-[#b91c1c] hover:bg-red-800 text-white font-bold py-3 px-4 rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Kata Sandi'}</span>
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan pada server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center relative"
      style={{
        backgroundImage: 'url(/img/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay to ensure readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <Card className="relative z-10 w-full max-w-md p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-white/20">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-md overflow-hidden">
            <Image
              src="/img/koni-logo.png"
              alt="KONI Aceh"
              width={50}
              height={50}
              className="object-cover"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center">SI-KONI Aceh</h1>
          <p className="text-sm text-gray-500 font-medium text-center mt-1">Sistem Informasi Pusat Data Terpadu</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition"
                placeholder="Masukkan kata sandi"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center bg-[#b91c1c] hover:bg-red-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? 'Memproses...' : 'Masuk ke Sistem'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400 font-medium">
          &copy; {new Date().getFullYear()} KONI Provinsi Aceh. All rights reserved.
        </div>
      </Card>
    </div>
  );
}

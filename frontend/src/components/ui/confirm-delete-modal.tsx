'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, ArrowRight, Trash2, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  open: boolean;
  /** Judul di header modal, mis. "Hapus Cabor Basket" */
  title: string;
  /** Penjelasan singkat apa yang akan dihapus */
  description: string;
  /** Daftar dampak cascade (opsional), mis. ["3 atlet", "5 prestasi", "2 SK"] */
  impact?: string[];
  /** Teks yang HARUS diketik user di tahap 2, mis. "hapus cabor basket" (match case-insensitive) */
  confirmPhrase: string;
  /** Sedang memproses penghapusan */
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modal konfirmasi penghapusan permanen dengan pengaman ganda:
 * 1. Konfirmasi awal (deskripsi + dampak cascade) → "Lanjutkan"
 * 2. Konfirmasi final — user wajib mengetik frasa persis (mis. "hapus cabor basket")
 *    sebelum tombol "Hapus Permanen" aktif.
 */
export default function ConfirmDeleteModal({
  open,
  title,
  description,
  impact = [],
  confirmPhrase,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState('');
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset state internal setiap kali modal dibuka (pola React: adjust state during render,
  // bukan setState di dalam effect — memenuhi react-hooks/set-state-in-effect).
  // Guard mounted tidak diperlukan: `open` selalu false saat SSR, jadi createPortal
  // hanya dieksekusi di browser ketika modal benar-benar dibuka.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStep(1);
      setTyped('');
    }
  }

  if (!open) return null;

  const phraseMatch = typed.trim().toLowerCase() === confirmPhrase.toLowerCase();

  const handleStep2KeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phraseMatch && !loading) {
      e.preventDefault();
      onConfirm();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-[#b91c1c] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 shrink-0">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>

              {impact.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="text-xs font-extrabold text-amber-800 uppercase tracking-wider mb-2">
                    Data berikut akan ikut terhapus permanen
                  </div>
                  <ul className="space-y-1.5">
                    {impact.map((item, i) => (
                      <li key={i} className="flex items-center space-x-2 text-sm font-semibold text-amber-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-gray-400 leading-relaxed">
                Tindakan ini <span className="font-bold text-red-600">tidak dapat dibatalkan</span>. Lanjutkan hanya
                jika Anda yakin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Konfirmasi terakhir: ketik teks berikut untuk menghapus secara permanen.
              </p>
              <div className="bg-gray-900 text-emerald-400 font-mono text-sm font-semibold rounded-xl px-4 py-3 text-center select-all">
                {confirmPhrase}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Ketik frasa di atas
                </label>
                <input
                  type="text"
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={handleStep2KeyDown}
                  placeholder={confirmPhrase}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:bg-white focus:border-[#b91c1c] transition disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep(1)}
            disabled={loading}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition disabled:opacity-40"
          >
            {step === 1 ? 'Batal' : 'Kembali'}
          </button>

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center space-x-2 bg-[#b91c1c] hover:bg-red-800 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md"
            >
              <span>Lanjutkan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={!phraseMatch || loading}
              className={`flex items-center space-x-2 font-bold py-2.5 px-6 rounded-xl transition shadow-md ${
                phraseMatch && !loading
                  ? 'bg-[#b91c1c] hover:bg-red-800 text-white'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Permanen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  loading?: boolean;
  /** Kata untuk label hasil, misalnya "arsip" — default "hasil". */
  noun?: string;
  onPageChange: (page: number) => void;
}

/**
 * Kontrol pagination bersama untuk tabel data (pola footer standar SI-KONI).
 * Menampilkan rentang "Menampilkan X-Y dari Z hasil" + tombol navigasi halaman.
 */
export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  loading,
  noun = 'hasil',
  onPageChange,
}: PaginationProps) {
  // Clamp rentang tampilan agar tidak pernah terbalik (mis. "41-25 dari 25")
  const from = total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  // Jendela nomor halaman: semua jika <= 7, selainnya tampilkan 1 ... (page-1..page+1) ... last
  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
  }

  const btnBase = 'px-2.5 py-1 rounded font-bold transition disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="px-6 py-3 border-t border-gray-100 bg-slate-50 text-xs text-gray-500 flex justify-between items-center shrink-0">
      <span className="flex items-center gap-2">
        Menampilkan {from}-{to} dari {total} {noun}
        {loading && (
          <span className="w-3 h-3 border-2 border-[#b91c1c] border-t-transparent rounded-full animate-spin" />
        )}
      </span>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading || total === 0}
          aria-label="Halaman sebelumnya"
          className={`${btnBase} bg-white border border-gray-200 text-gray-500 hover:text-gray-800`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={loading}
              className={`${btnBase} ${
                p === page
                  ? 'bg-[#b91c1c] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading || total === 0}
          aria-label="Halaman berikutnya"
          className={`${btnBase} bg-white border border-gray-200 text-gray-500 hover:text-gray-800`}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

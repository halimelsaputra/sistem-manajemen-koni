'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface FormSelectProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  /** Tampilkan bintang merah — menandai field wajib */
  required?: boolean;
  /** Tampilkan kotak pencarian di dalam dropdown untuk menyaring opsi */
  searchable?: boolean;
  /** Teks abu-abu saat belum ada nilai terpilih, mis. "Pilih wilayah..." */
  placeholder?: string;
  /** Opsi yang tidak dapat dipilih (tetap terlihat, ditandai disabled) */
  disabledOptions?: Set<string>;
}

export function FormSelect({ label, value, options, onSelect, required = false, searchable = false, placeholder, disabledOptions }: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset pencarian setiap kali dropdown dibuka/ditutup
  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const filteredOptions = searchable
    ? options.filter((o) => o.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {/* Trigger — form input style */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:bg-white focus:border-[#b91c1c] transition-all duration-300 ease-out cursor-pointer flex items-center justify-between ${
          isOpen
            ? 'shadow-lg shadow-black/10 scale-[1.01]'
            : 'hover:shadow-lg hover:shadow-black/10 hover:scale-[1.01]'
        }`}
      >
        <span className={value ? "truncate" : "truncate text-gray-400"}>
          {value || placeholder || ''}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-[400ms] ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Panel — grid slide animation */}
      <div
        className={`absolute z-50 w-full grid transition-all duration-[400ms] ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className={`overflow-hidden transition-opacity duration-[400ms] ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-white border border-gray-200 shadow-md rounded-b-xl mt-1">
            {searchable && (
              <div className="p-2 pb-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Cari..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#b91c1c] transition-all duration-300 ease-out hover:shadow-lg hover:shadow-black/10 hover:scale-[1.01] focus:shadow-lg focus:shadow-black/10 focus:scale-[1.01]"
                  />
                </div>
              </div>
            )}
            <div className="p-2 max-h-[200px] overflow-y-auto scrollbar-thin">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400 font-medium">Tidak ada hasil.</div>
              ) : (
                filteredOptions.map((option) => {
                  const disabled = disabledOptions?.has(option) ?? false;
                  return (
                    <button
                      key={option}
                      type="button" // penting: tanpa ini tombol opsi menjadi submit di dalam <form>
                      disabled={disabled}
                      onClick={() => {
                        onSelect(option);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                        disabled
                          ? 'text-gray-300 cursor-not-allowed line-through'
                          : value === option
                            ? 'bg-red-50 text-[#dc2626] font-bold'
                            : 'text-gray-700 hover:bg-red-50 hover:text-[#dc2626]'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

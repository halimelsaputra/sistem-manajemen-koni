'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownFilterProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}

export function DropdownFilter({ label, value, options, onSelect }: DropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div ref={ref} className="relative w-full sm:w-auto sm:min-w-[220px]">
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-2xl border p-3 cursor-pointer transition-all duration-[400ms] ${
          isOpen
            ? 'bg-[#dc2626] border-red-700 text-white'
            : 'bg-white border-gray-200 text-gray-900 shadow-sm hover:border-gray-300'
        }`}
      >
        <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1 opacity-70">
          {label}
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold truncate ${isOpen ? 'text-white' : 'text-[#dc2626]'}`}>
            {value}
          </span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform duration-[400ms] ${
              isOpen ? 'rotate-180 text-white' : 'text-gray-400'
            }`}
          />
        </div>
      </div>

      {/* Panel — grid slide animation */}
      <div
        className={`absolute z-50 w-full grid transition-all duration-[400ms] ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className={`-mt-2 overflow-hidden transition-opacity duration-[400ms] ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-white border border-t-0 border-gray-200 shadow-md rounded-b-2xl">
            <div className="p-2 max-h-[200px] overflow-y-auto scrollbar-thin">
              {options.map((option) => (
                <button
                  key={option}
                  type="button" // penting: tanpa ini tombol opsi menjadi submit di dalam <form>
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                    value === option
                      ? 'bg-red-50 text-[#dc2626] font-bold'
                      : 'text-gray-700 hover:bg-red-50 hover:text-[#dc2626]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

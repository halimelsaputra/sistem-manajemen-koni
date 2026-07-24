'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface FormSelectProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}

export function FormSelect({ label, value, options, onSelect }: FormSelectProps) {
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
    <div ref={ref} className="relative w-full">
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
        {label}
      </label>
      {/* Trigger — form input style */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:bg-white focus:border-[#b91c1c] transition cursor-pointer flex items-center justify-between"
      >
        <span className="truncate">{value}</span>
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
            <div className="p-2 max-h-[200px] overflow-y-auto scrollbar-thin">
              {options.map((option) => (
                <button
                  key={option}
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

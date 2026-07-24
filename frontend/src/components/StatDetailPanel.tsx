'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';

interface StatDetailItem {
  label: string;
  sublabel?: string;
  highlight?: string;
}

interface StatDetailPanelProps {
  title: string;
  value: number;
  items: StatDetailItem[];
  onClose: () => void;
}

export default function StatDetailPanel({ title, value, items, onClose }: StatDetailPanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const panel = (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl w-[85vw] max-w-[1200px] h-[80vh] animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
            <p className="text-sm text-gray-500">{value} data ditemukan</p>
          </div>
        </div>

        {/* Content — scrollable list */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-8 text-right">{index + 1}.</span>
                <span className="text-sm text-gray-700">{item.label}</span>
                {item.sublabel && (
                  <span className="text-xs text-gray-400">{item.sublabel}</span>
                )}
              </div>
              {item.highlight && (
                <span className="text-sm font-bold text-[#dc2626]">{item.highlight}</span>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-10">
              Tidak ada data
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(panel, document.body);
}

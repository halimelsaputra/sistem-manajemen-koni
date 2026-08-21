'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ExpandableCardProps {
  title: string;
  children: React.ReactNode;
}

export function ExpandableCard({ title, children }: ExpandableCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="hidden lg:block absolute left-3 right-3 bottom-3 flex flex-col-reverse sm:block sm:left-auto sm:right-4 sm:top-4 sm:bottom-auto sm:w-[240px] xl:w-[260px] z-20 animate-slide-in-up sm:animate-slide-in-right">
      {/* Card header — fixed size */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-[1] w-full rounded-2xl border p-4 cursor-pointer transition-all duration-[400ms] ${
          isOpen
            ? 'bg-[#dc2626] border-red-700 text-white'
            : 'bg-white border-gray-200 text-gray-900 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider">{title}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-[400ms] ${
              isOpen ? 'rotate-180 text-white' : 'text-gray-500'
            }`}
          />
        </div>
      </div>

      {/* Panel expandable — grid slide animation */}
      <div
        className={`relative z-0 grid transition-all duration-[400ms] ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className={`mt-0 sm:-mt-4 overflow-hidden transition-opacity duration-[400ms] ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-white border border-b-0 sm:border-t-0 border-gray-200 shadow-md rounded-t-2xl sm:rounded-b-2xl">
            <div className="scroll-fade-wrapper expanded">
                <div className="p-4 pt-5 max-h-[40vh] sm:max-h-[520px] overflow-y-auto scrollbar-thin">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

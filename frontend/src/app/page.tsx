'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  AlertTriangle, 
  ChevronRight, 
  TrendingUp
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import DashboardStatCard from '@/components/DashboardStatCard';
import { Card } from '@/components/ui/card';
import { ExpandableCard } from '@/components/ui/expandable-card';
import { DropdownFilter } from '@/components/ui/dropdown-filter';
import StatDetailPanel from '@/components/StatDetailPanel';
import {
  MOCK_REGIONS,
  MOCK_KEPENGURUSAN,
  MOCK_PRESTASI,
  MOCK_DASHBOARD_LINE_TREND,
  MOCK_CABOR_OPTIONS,
  RegionMedal,
} from '@/data/mockData';

const AcehMap = dynamic(() => import('@/components/AcehMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] rounded-xl bg-gray-100 animate-pulse flex flex-col items-center justify-center gap-2 text-gray-500 font-medium">
      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      <span>Memuat Peta Geografis Aceh...</span>
    </div>
  )
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const [selectedCabor, setSelectedCabor] = useState('Semua Cabang Olahraga');
  const [selectedRegion, setSelectedRegion] = useState('Semua Kabupaten/Kota');
  const [appliedSelectedCabor, setAppliedSelectedCabor] = useState('Semua Cabang Olahraga');
  const [appliedSelectedRegion, setAppliedSelectedRegion] = useState('Semua Kabupaten/Kota');
  const [activeRegion, setActiveRegion] = useState<RegionMedal | null>(MOCK_REGIONS[0]);
  const [activeStatCard, setActiveStatCard] = useState<string | null>(null);

  const handleSelectRegion = (region: RegionMedal) => {
    setActiveRegion(prev => prev?.id === region.id ? null : region);
  };

  const filteredPrestasi = useMemo(() => {
    return MOCK_PRESTASI.filter((item) => {
      const matchCabor = appliedSelectedCabor === 'Semua Cabang Olahraga' || item.cabor === appliedSelectedCabor;
      const matchRegion = appliedSelectedRegion === 'Semua Kabupaten/Kota' || item.kabupaten_kota === appliedSelectedRegion;

      return matchCabor && matchRegion;
    });
  }, [appliedSelectedCabor, appliedSelectedRegion]);

  const filteredRegions = useMemo(() => {
    return MOCK_REGIONS.filter(r => {
      const matchRegion = appliedSelectedRegion === 'Semua Kabupaten/Kota' || r.kabupaten_kota === appliedSelectedRegion;
      return matchRegion;
    });
  }, [appliedSelectedRegion]);

  const caborOptions = useMemo(() => {
    return ['Semua Cabang Olahraga', ...MOCK_CABOR_OPTIONS];
  }, []);

  const totalAtlet = useMemo(() => new Set(filteredPrestasi.map((item) => item.nama_atlet)).size, [filteredPrestasi]);
  const totalCabor = useMemo(() => new Set(filteredPrestasi.map((item) => item.cabor)).size, [filteredPrestasi]);
  const totalEvent = useMemo(() => new Set(filteredPrestasi.map((item) => item.event)).size, [filteredPrestasi]);
  const totalEmas = useMemo(
    () => filteredRegions.reduce((acc, region) => acc + region.total_emas, 0),
    [filteredRegions]
  );
  const expiringSK = useMemo(() => MOCK_KEPENGURUSAN.filter(k => k.days_to_expire && k.days_to_expire <= 90), []);

  const handleApplyFilter = () => {
    setAppliedSelectedCabor(selectedCabor);
    setAppliedSelectedRegion(selectedRegion);
  };

  const statCards = [
    {
      id: 'atlet',
      value: totalAtlet,
      title: 'Total Atlet Terdaftar',
      increase: 'Hasil filter aktif',
      delay: '0ms',
      variant: 'default' as const,
    },
    {
      id: 'cabor',
      value: totalCabor,
      title: 'Total Cabang Olahraga Aktif',
      increase: 'Hasil filter aktif',
      delay: '100ms',
      variant: 'default' as const,
    },
    {
      id: 'event',
      value: totalEvent,
      title: 'Total Event Kejuaraan',
      increase: 'Hasil filter aktif',
      delay: '200ms',
      variant: 'default' as const,
    },
    {
      id: 'emas',
      value: totalEmas,
      title: 'Total Medali Emas Regional',
      increase: 'Dari wilayah terfilter',
      delay: '300ms',
      variant: 'default' as const,
    },
  ];

  const statDetailData = useMemo(() => ({
    atlet: [...new Set(filteredPrestasi.map(i => i.nama_atlet))].map(name => ({ label: name })),
    cabor: [...new Set(filteredPrestasi.map(i => i.cabor))].map(name => ({ label: name })),
    event: [...new Set(filteredPrestasi.map(i => i.event))].map(name => ({ label: name })),
    emas: filteredRegions.map(r => ({ label: r.kabupaten_kota, highlight: `${r.total_emas} emas` })),
  }), [filteredPrestasi, filteredRegions]);

  // Line chart — Tren Performa Medali Tahunan (matching design red line)
  const lineChartData = {
    labels: MOCK_DASHBOARD_LINE_TREND.labels,
    datasets: [
      {
        label: 'Medali Emas',
        data: MOCK_DASHBOARD_LINE_TREND.medal_emas,
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.06)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#dc2626',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.04)' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ringkasan aktivitas dan statistik sistem.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <DropdownFilter
          label="Cabang Olahraga"
          value={selectedCabor}
          options={caborOptions}
          onSelect={setSelectedCabor}
        />
        <DropdownFilter
          label="Kabupaten/Kota"
          value={selectedRegion}
          options={['Semua Kabupaten/Kota', ...MOCK_REGIONS.map(r => r.kabupaten_kota)]}
          onSelect={setSelectedRegion}
        />
        <button
          type="button"
          onClick={handleApplyFilter}
          className="py-3 px-6 bg-[#dc2626] hover:bg-red-700 text-white font-bold text-sm rounded-2xl transition shadow-md"
        >
          Terapkan Filter
        </button>
      </div>

      {/* 4 KPI Cards — 2x2 grid matching design 113914.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <DashboardStatCard
            key={card.id}
            value={card.value}
            title={card.title}
            increase={card.increase}
            delay={card.delay}
            variant={card.variant}
            isActive={activeStatCard === card.id}
            onClick={() => setActiveStatCard(prev => prev === card.id ? null : card.id)}
          />
        ))}
      </div>

      {/* Detail Modal — full screen overlay */}
      {activeStatCard && (
        <StatDetailPanel
          title={statCards.find(c => c.id === activeStatCard)?.title ?? ''}
          value={Number(statCards.find(c => c.id === activeStatCard)?.value ?? 0)}
          items={statDetailData[activeStatCard as keyof typeof statDetailData]}
          onClose={() => setActiveStatCard(null)}
        />
      )}

      {/* Peta — Map as main content, cards floating on sides */}
      <Card className="relative overflow-hidden h-[650px] lg:h-[720px] animate-slide-in-up">
        {/* Map — full width/height */}
        <div className="absolute inset-0">
          <AcehMap 
            regions={filteredRegions} 
            activeRegion={activeRegion} 
            onSelectRegion={(region) => handleSelectRegion(region)} 
          />
        </div>

        {/* Floating card — Wilayah Terpilih (left) */}
        <Card className={`absolute left-4 top-20 w-[240px] xl:w-[260px] p-4 bg-white/95 backdrop-blur-sm shadow-md z-20 transition-all duration-300 ease-in-out ${
          activeRegion
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
        }`}>
          <div key={activeRegion?.id} className={`animate-fade-in transition-opacity duration-200 ${activeRegion ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
              <div>
                <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Wilayah Terpilih</div>
                <div className="text-lg font-black text-gray-900 leading-tight">{activeRegion?.kabupaten_kota}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-red-50 border border-red-200 text-[#dc2626] flex items-center justify-center font-bold text-xs">
                #{activeRegion?.id}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <div>
                <div className="text-xs font-bold text-gray-500">Emas</div>
                <div className="text-lg font-black text-[#dc2626]">{activeRegion?.total_emas}</div>
              </div>
              <div className="border-l border-gray-200">
                <div className="text-xs font-bold text-gray-500">Perak</div>
                <div className="text-lg font-black text-gray-700">{activeRegion?.total_perak}</div>
              </div>
              <div className="border-l border-gray-200">
                <div className="text-xs font-bold text-gray-500">Perunggu</div>
                <div className="text-lg font-black text-amber-600">{activeRegion?.total_perunggu}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Floating card — Daftar 23 Wilayah (right) */}
        <ExpandableCard title="Daftar 23 Wilayah">
          <div className="grid grid-cols-1 gap-2">
            {filteredRegions.map((region) => {
              const isSelected = activeRegion?.id === region.id;
              return (
                <button
                  key={region.id}
                  onClick={() => handleSelectRegion(region)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-red-50 text-gray-900 border-red-300 shadow-sm ring-1 ring-red-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-extrabold truncate mb-1">{region.kabupaten_kota}</div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-sm font-black">{region.total_emas}</span>
                      <span className={`text-[9px] uppercase font-bold ${isSelected ? 'text-[#dc2626]' : 'text-gray-400'}`}>Emas</span>
                    </div>
                    <div
                      className="w-full h-1 rounded-full mt-1.5"
                      style={{ backgroundColor: isSelected ? '#dc2626' : region.color_density_code }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </ExpandableCard>
      </Card>

      {/* Tren Performa Medali Tahunan — Line chart matching design */}
      <Card className="p-5">
        <h2 className="text-base font-bold text-gray-900 mb-4">Tren Performa Medali Tahunan</h2>
        <div className="h-[220px] w-full">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </Card>

      {/* EWS — Early Warning System SK Kedaluwarsa (matching right panel in 113956.png) */}
      <Card className="p-5">
        <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-gray-100">
          <AlertTriangle className="w-5 h-5 text-[#dc2626] shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-gray-900">Early Warning System (SK Kedaluwarsa)</h3>
            <p className="text-[11px] text-gray-500">SK akan kedaluwarsa &le; 3 bulan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {expiringSK.map((item) => {
            const isUrgent = (item.days_to_expire ?? 99) <= 14;
            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border-l-4 ${
                  isUrgent
                    ? 'bg-red-50 border-red-600'
                    : 'bg-amber-50 border-amber-500'
                }`}
              >
                <div className="font-bold text-xs text-[#dc2626]">{item.cabor}</div>
                <div className="text-[11px] text-gray-600 mt-0.5">Kedaluwarsa dalam {item.days_to_expire} hari.</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Nomor SK: {item.nomor_sk}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <a
            href="/management"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#dc2626] hover:underline border border-[#dc2626] px-4 py-2 rounded-lg hover:bg-red-50 transition"
          >
            Lihat Semua Peringatan
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </Card>
    </div>
  );
}

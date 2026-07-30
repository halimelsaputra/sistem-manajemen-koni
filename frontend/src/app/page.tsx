'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  AlertTriangle, 
  ChevronRight 
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
import StatDetailPanel from '@/components/StatDetailPanel';
import { MOCK_REGIONS, RegionMedal, MOCK_DASHBOARD_LINE_TREND } from '@/data/mockData';

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

interface DashboardData {
  totalAtlet: number;
  totalCabor: number;
  totalPrestasi: number;
  totalKepengurusan: number;
  medalsByRegion: { kabupaten_kota: string; total_emas: number; total_perak: number; total_perunggu: number }[];
}

interface ExpiringSK {
  id: number;
  cabor: string;
  nomor_sk: string;
  days_to_expire: number;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionMedal | null>(null);
  const [activeStatCard, setActiveStatCard] = useState<string | null>(null);
  const [expiringSK, setExpiringSK] = useState<ExpiringSK[]>([]);

  useEffect(() => {
    // Fetch Dashboard stats
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setDashboardData(data.data || data);
      })
      .catch(console.error);

    // Fetch Kepengurusan to calculate EWS
    fetch('/api/kepengurusan')
      .then(res => res.json())
      .then(async (data) => {
        const arr = Array.isArray(data) ? data : data.data || [];
        
        // Also need cabor to map cabor_id to cabor string
        const caborRes = await fetch('/api/cabor');
        const caborData = await caborRes.json();
        const caborList = Array.isArray(caborData) ? caborData : caborData.data || [];

        const today = new Date();
        const expiring: ExpiringSK[] = [];

        arr.forEach((sk: any) => {
          if (sk.status_kepengurusan === 'Aktif') {
            const masaBakti = sk.masa_bakti || '';
            const endYearStr = masaBakti.split('-')[1];
            if (endYearStr) {
              const endYear = parseInt(endYearStr);
              const endDate = new Date(endYear, 11, 31); // Dec 31 of end year
              const diffTime = endDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 90 && diffDays >= 0) {
                 const caborObj = caborList.find((c: any) => c.id === sk.cabor_id);
                 expiring.push({
                    id: sk.id,
                    cabor: caborObj ? caborObj.nama_cabor : 'Unknown Cabor',
                    nomor_sk: sk.nomor_sk,
                    days_to_expire: diffDays
                 });
              }
            }
          }
        });

        // sort by days_to_expire asc
        expiring.sort((a, b) => a.days_to_expire - b.days_to_expire);
        setExpiringSK(expiring);
      })
      .catch(console.error);
  }, []);

  const handleSelectRegion = (region: RegionMedal) => {
    setActiveRegion(prev => prev?.id === region.id ? null : region);
  };

  // Map API medalsByRegion to MOCK_REGIONS structure for rendering
  const mappedRegions = useMemo(() => {
    return MOCK_REGIONS.map(mockR => {
      // Jika dashboardData belum ada atau medalsByRegion tidak ada/kosong, set ke 0
      const apiR = dashboardData?.medalsByRegion?.find(r => r.kabupaten_kota === mockR.kabupaten_kota);
      if (apiR) {
        return {
          ...mockR,
          total_emas: apiR.total_emas || 0,
          total_perak: apiR.total_perak || 0,
          total_perunggu: apiR.total_perunggu || 0
        };
      }
      return { ...mockR, total_emas: 0, total_perak: 0, total_perunggu: 0 };
    }).sort((a, b) => b.total_emas - a.total_emas);
  }, [dashboardData]);

  // If activeRegion is set but not updated with API data, update it
  useEffect(() => {
    if (activeRegion && dashboardData) {
      const updated = mappedRegions.find(r => r.id === activeRegion.id);
      if (updated && (updated.total_emas !== activeRegion.total_emas || updated.total_perak !== activeRegion.total_perak)) {
         setActiveRegion(updated);
      }
    } else if (!activeRegion && dashboardData) {
      setActiveRegion(mappedRegions[0]);
    }
  }, [dashboardData, mappedRegions, activeRegion]);


  const totalEmas = useMemo(() => mappedRegions.reduce((acc, region) => acc + region.total_emas, 0), [mappedRegions]);

  const statCards = [
    {
      id: 'atlet',
      value: dashboardData?.totalAtlet || 0,
      title: 'Total Atlet Terdaftar',
      increase: 'Live Data',
      delay: '0ms',
      variant: 'default' as const,
    },
    {
      id: 'cabor',
      value: dashboardData?.totalCabor || 0,
      title: 'Total Cabang Olahraga',
      increase: 'Live Data',
      delay: '100ms',
      variant: 'default' as const,
    },
    {
      id: 'prestasi',
      value: dashboardData?.totalPrestasi || 0,
      title: 'Total Prestasi',
      increase: 'Live Data',
      delay: '200ms',
      variant: 'default' as const,
    },
    {
      id: 'emas',
      value: totalEmas,
      title: 'Total Medali Emas Regional',
      increase: 'Live Data',
      delay: '300ms',
      variant: 'default' as const,
    },
  ];

  const statDetailData = {
    atlet: [], 
    cabor: [],
    prestasi: [],
    emas: mappedRegions.map(r => ({ label: r.kabupaten_kota, highlight: `${r.total_emas} emas` })),
  };

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

      {/* 4 KPI Cards */}
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
            onClick={() => {
               if (card.id === 'emas') setActiveStatCard(prev => prev === card.id ? null : card.id);
            }}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {activeStatCard && (
        <StatDetailPanel
          title={statCards.find(c => c.id === activeStatCard)?.title ?? ''}
          value={Number(statCards.find(c => c.id === activeStatCard)?.value ?? 0)}
          items={statDetailData[activeStatCard as keyof typeof statDetailData]}
          onClose={() => setActiveStatCard(null)}
        />
      )}

      {/* Peta */}
      <Card className="relative overflow-hidden h-[650px] lg:h-[720px] animate-slide-in-up">
        <div className="absolute inset-0">
          <AcehMap 
            regions={mappedRegions} 
            activeRegion={activeRegion} 
            onSelectRegion={(region) => handleSelectRegion(region)} 
          />
        </div>

        {/* Floating card — Wilayah Terpilih */}
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

        {/* Floating card — Daftar 23 Wilayah */}
        <ExpandableCard title="Daftar 23 Wilayah">
          <div className="grid grid-cols-1 gap-2">
            {mappedRegions.map((region) => {
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

      {/* Tren Performa Medali Tahunan */}
      <Card className="p-5">
        <h2 className="text-base font-bold text-gray-900 mb-4">Tren Performa Medali Tahunan</h2>
        <div className="h-[220px] w-full">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </Card>

      {/* EWS */}
      <Card className="p-5">
        <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-gray-100">
          <AlertTriangle className="w-5 h-5 text-[#dc2626] shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-gray-900">Early Warning System (SK Kedaluwarsa)</h3>
            <p className="text-[11px] text-gray-500">SK akan kedaluwarsa &le; 3 bulan</p>
          </div>
        </div>

        {expiringSK.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringSK.map((item) => {
              const isUrgent = item.days_to_expire <= 14;
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
        ) : (
          <div className="text-sm text-gray-500 py-4 text-center">Tidak ada SK kepengurusan yang akan kedaluwarsa dalam 3 bulan.</div>
        )}

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

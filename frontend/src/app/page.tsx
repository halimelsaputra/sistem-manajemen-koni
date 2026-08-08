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
import { MOCK_REGIONS, RegionMedal } from '@/data/mockData';

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
  skWarnings: { id: number; cabor: string; nomor_sk: string; tanggal_sk: string; masa_bakti: string; expiry_date: string; days_remaining: number; is_expired: boolean }[];
}

interface ExpiringSK {
  id: number;
  cabor: string;
  nomor_sk: string;
  days_remaining: number;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionMedal | null>(null);
  const [expiringSK, setExpiringSK] = useState<ExpiringSK[]>([]);
  const [prestasiList, setPrestasiList] = useState<any[]>([]);

  const [timeFilter, setTimeFilter] = useState<'1BLN' | '3BLN' | '1TH' | '3TH' | 'Maks'>('Maks');

  useEffect(() => {
    // Fetch Dashboard stats (skWarnings dihitung server-side untuk Early Warning System)
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        const d = data.data || data;
        setDashboardData(d);

        // EWS: pakai skWarnings dari /api/dashboard (single source of truth)
        const skWarnings: any[] = Array.isArray(d.skWarnings) ? d.skWarnings : [];
        const expiring: ExpiringSK[] = skWarnings
          .filter((w: any) => !w.is_expired && w.days_remaining >= 0 && w.days_remaining <= 90)
          .map((w: any) => ({
            id: w.id,
            cabor: w.cabor || 'Unknown Cabor',
            nomor_sk: w.nomor_sk,
            days_remaining: w.days_remaining,
          }))
          .sort((a, b) => a.days_remaining - b.days_remaining);

        setExpiringSK(expiring);
      })
      .catch(console.error);

    // Fetch Prestasi untuk menghitung Tren Medali Tahunan
    fetch('/api/prestasi')
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : data.data || [];
        setPrestasiList(arr);
      })
      .catch(console.error);

  }, []);

  const trendData = useMemo(() => {
    const emasPrestasi = prestasiList.filter((p: any) => p.mendali === 'Emas');
    const today = new Date();
    const currYear = today.getFullYear();
    const currMonth = today.getMonth(); // 0-11

    // Tanggal event prestasi (kolom `tanggal`), fallback ke created_at / awal tahun berjalan
    const eventDate = (p: any): Date => {
       if (p.tanggal) {
          const d = new Date(p.tanggal);
          if (!isNaN(d.getTime())) return d;
       }
       if (p.created_at) {
          const d = new Date(p.created_at);
          if (!isNaN(d.getTime())) return d;
       }
       return new Date(currYear, 0, 1);
    };

    if (timeFilter === '1BLN') {
       // Tampilkan 4 minggu terakhir
       const labels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
       const counts = [0, 0, 0, 0];
       
       emasPrestasi.forEach((p: any) => {
          const d = eventDate(p);
          if (d.getFullYear() === currYear && d.getMonth() === currMonth) {
             const week = Math.min(Math.floor(d.getDate() / 8), 3);
             counts[week]++;
          }
       });
       return { labels, data: counts };
    } 
    else if (timeFilter === '3BLN') {
       // Tampilkan 3 bulan terakhir
       const labels = [];
       const counts = [0, 0, 0];
       for (let i = 2; i >= 0; i--) {
          const d = new Date(currYear, currMonth - i, 1);
          labels.push(d.toLocaleString('id-ID', { month: 'short' }));
       }
       emasPrestasi.forEach((p: any) => {
          const d = eventDate(p);
          const monthDiff = (currYear - d.getFullYear()) * 12 + (currMonth - d.getMonth());
          if (monthDiff >= 0 && monthDiff < 3) counts[2 - monthDiff]++;
       });
       return { labels, data: counts };
    }
    else if (timeFilter === '1TH') {
       // Tampilkan 12 bulan di tahun ini
       const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
       const counts = Array(12).fill(0);
       emasPrestasi.forEach((p: any) => {
          const d = eventDate(p);
          if (d.getFullYear() === currYear) counts[d.getMonth()]++;
       });
       return { labels, data: counts };
    }
    else if (timeFilter === '3TH') {
       // Tampilkan 3 tahun terakhir
       const labels = [String(currYear - 2), String(currYear - 1), String(currYear)];
       const counts = [0, 0, 0];
       emasPrestasi.forEach((p: any) => {
          const y = eventDate(p).getFullYear();
          if (y === currYear - 2) counts[0]++;
          else if (y === currYear - 1) counts[1]++;
          else if (y === currYear) counts[2]++;
       });
       return { labels, data: counts };
    }
    else {
       // Maks: Tampilkan semua tahun yang ada
       const yearCounts: Record<string, number> = {};
       emasPrestasi.forEach((p: any) => {
          const y = String(eventDate(p).getFullYear());
          yearCounts[y] = (yearCounts[y] || 0) + 1;
       });
       let years = Object.keys(yearCounts).sort();
       
       if (years.length > 0) {
           const minYear = parseInt(years[0]);
           const maxYear = parseInt(years[years.length - 1]);
           const continuousYears = [];
           for (let i = minYear; i <= maxYear; i++) continuousYears.push(i.toString());
           years = continuousYears;
       }
       if (years.length === 0) years = [String(currYear - 1), String(currYear)]; // minimal 2 titik agar grafik garis tergambar
       if (years.length === 1) years = [String(parseInt(years[0]) - 1), years[0]];

       return {
          labels: years,
          data: years.map(y => yearCounts[y] || 0)
       };
    }
  }, [prestasiList, timeFilter]);

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
    }
  }, [dashboardData, mappedRegions, activeRegion]);


  const totalEmas = useMemo(() => mappedRegions.reduce((acc, region) => acc + region.total_emas, 0), [mappedRegions]);

  const statCards = [
    {
      id: 'atlet',
      value: dashboardData?.totalAtlet || 0,
      title: 'Total Atlet Terdaftar',
      delay: '0ms',
      variant: 'default' as const,
    },
    {
      id: 'cabor',
      value: dashboardData?.totalCabor || 0,
      title: 'Total Cabang Olahraga',
      delay: '100ms',
      variant: 'default' as const,
    },
    {
      id: 'prestasi',
      value: dashboardData?.totalPrestasi || 0,
      title: 'Total Prestasi',
      delay: '200ms',
      variant: 'default' as const,
    },
    {
      id: 'emas',
      value: totalEmas,
      title: 'Total Medali Emas Regional',
      delay: '300ms',
      variant: 'default' as const,
    },
  ];

  const lineChartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Medali Emas',
        data: trendData.data,
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
            delay={card.delay}
            variant={card.variant}
          />
        ))}
      </div>

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Tren Performa Medali Tahunan</h2>
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
            {['1BLN', '3BLN', '1TH', '3TH', 'Maks'].map(filter => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter as any)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${timeFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
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
              const isUrgent = item.days_remaining <= 14;
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
                  <div className="text-[11px] text-gray-600 mt-0.5">Kedaluwarsa dalam {item.days_remaining} hari.</div>
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

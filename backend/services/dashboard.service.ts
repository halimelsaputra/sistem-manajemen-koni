import { DashboardRepository } from "@/repositories/dashboard.repository";

export const DashboardService = {
    /**
     * Mengambil seluruh data statistik untuk halaman dashboard.
     * Menggabungkan data dari berbagai tabel dan menghitung agregasi tren serta peringatan SK.
     */
    async getSummary() {
        // Jalankan seluruh query database secara paralel untuk efisiensi
        const [totalAtlet, totalCabor, totalPrestasi, totalKepengurusan, medalsByRegion, prestasiDates, activeKepengurusan] = await Promise.all([
            DashboardRepository.countAtlet(),
            DashboardRepository.countCabor(),
            DashboardRepository.countPrestasi(),
            DashboardRepository.countKepengurusan(),
            DashboardRepository.getMedalsByRegion(),
            DashboardRepository.getPrestasiDates(),
            DashboardRepository.getActiveKepengurusan()
        ]);

        // 1. Hitung Tren Performa Medali Tahunan (Bulanan)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const monthlyMedalTrends = monthNames.map(m => ({ month: m, total: 0 }));

        prestasiDates.forEach((p: any) => {
            if (p.created_at) {
                const date = new Date(p.created_at);
                const monthIndex = date.getMonth();
                if (monthIndex >= 0 && monthIndex < 12) {
                    monthlyMedalTrends[monthIndex].total += 1;
                }
            }
        });

        // 2. Hitung Peringatan SK Kedaluwarsa (Early Warning System)
        const skWarnings: any[] = [];
        const now = new Date();

        activeKepengurusan.forEach((kep: any) => {
            if (kep.tanggal_sk && kep.masa_bakti) {
                // Ekstrak tahun berakhir dari masa bakti (contoh: "2020-2024" -> 2024)
                const years = kep.masa_bakti.split("-");
                const endYearStr = years[years.length - 1].trim();
                const endYear = parseInt(endYearStr);

                if (!isNaN(endYear)) {
                    const docDate = new Date(kep.tanggal_sk);
                    // Tanggal kadaluarsa: tanggal & bulan SK pada tahun akhir masa bakti
                    const expiryDate = new Date(endYear, docDate.getMonth(), docDate.getDate());

                    // Hitung selisih waktu
                    const diffTime = expiryDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Peringatan jika sudah kedaluwarsa atau akan kedaluwarsa dalam 3 bulan (90 hari)
                    if (diffDays <= 90) {
                        skWarnings.push({
                            id: kep.id,
                            cabor: kep.cabor?.nama_cabor || "Tidak Diketahui",
                            nomor_sk: kep.nomor_sk,
                            tanggal_sk: kep.tanggal_sk,
                            masa_bakti: kep.masa_bakti,
                            expiry_date: expiryDate.toISOString().split("T")[0],
                            days_remaining: diffDays,
                            is_expired: diffDays < 0
                        });
                    }
                }
            }
        });

        return {
            totalAtlet,
            totalCabor,
            totalPrestasi,
            totalKepengurusan,
            medalsByRegion,
            monthlyMedalTrends,
            skWarnings
        };
    }
};

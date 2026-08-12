import { DashboardRepository } from "@/repositories/dashboard.repository";

export const DashboardService = {
    /**
     * Mengambil seluruh data statistik untuk halaman dashboard.
     * Menggabungkan data dari berbagai tabel dan menghitung agregasi tren serta peringatan SK.
     *
     * @param opts.region — jika diisi, seluruh statistik dibatasi ke kabupaten/kota tersebut
     *                      (dipakai untuk admin wilayah: hanya melihat wilayahnya sendiri).
     * @param opts.includeKepengurusan — statistik SK/kepengurusan (provinsi) hanya dihitung
     *                                   untuk super admin.
     */
    async getSummary(opts?: { region?: string; includeKepengurusan?: boolean }) {
        const region = opts?.region;
        const includeKepengurusan = opts?.includeKepengurusan !== false;

        // Jalankan seluruh query database secara paralel untuk efisiensi
        const [totalAtlet, totalCabor, totalPrestasi, medalsByRegion] = await Promise.all([
            DashboardRepository.countAtlet(region),
            DashboardRepository.countCabor(),
            DashboardRepository.countPrestasi(region),
            DashboardRepository.getMedalsByRegion(region)
        ]);

        let totalKepengurusan = 0;
        let skWarnings: any[] = [];

        if (includeKepengurusan) {
            const [kepCount, activeKepengurusan] = await Promise.all([
                DashboardRepository.countKepengurusan(),
                DashboardRepository.getActiveKepengurusan()
            ]);
            totalKepengurusan = kepCount;
            skWarnings = computeSkWarnings(activeKepengurusan);
        }

        return {
            totalAtlet,
            totalCabor,
            totalPrestasi,
            totalKepengurusan,
            medalsByRegion,
            skWarnings
        };
    }
};

/** Hitung Peringatan SK Kedaluwarsa (Early Warning System). */
function computeSkWarnings(activeKepengurusan: any[]): any[] {
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

    return skWarnings;
}

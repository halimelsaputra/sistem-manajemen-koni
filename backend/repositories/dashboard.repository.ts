import { supabase } from "@/lib/supabase";

export const DashboardRepository = {
    /**
     * Mengambil jumlah total data atlet.
     * @param region Opsional — batasi per kabupaten/kota (untuk admin wilayah).
     */
    async countAtlet(region?: string) {
        let query = supabase.from("atlet").select("*", { count: "exact", head: true });
        if (region) query = query.eq("kabupaten_kota", region);

        const { count, error } = await query;

        if (error) {
            console.error("Gagal menghitung total atlet:", error.message);
            throw error;
        }
        return count ?? 0;
    },

    /**
     * Mengambil jumlah total data cabang olahraga.
     */
    async countCabor() {
        const { count, error } = await supabase
            .from("cabor")
            .select("*", { count: "exact", head: true });

        if (error) {
            console.error("Gagal menghitung total cabor:", error.message);
            throw error;
        }
        return count ?? 0;
    },

    /**
     * Mengambil jumlah total data prestasi.
     * @param region Opsional — batasi prestasi atlet di kabupaten/kota tertentu.
     */
    async countPrestasi(region?: string) {
        let query = supabase.from("prestasi").select("*", { count: "exact", head: true });
        if (region) query = query.eq("atlet.kabupaten_kota", region);

        const { count, error } = await query;

        if (error) {
            console.error("Gagal menghitung total prestasi:", error.message);
            throw error;
        }
        return count ?? 0;
    },

    /**
     * Mengambil jumlah total data kepengurusan.
     */
    async countKepengurusan() {
        const { count, error } = await supabase
            .from("kepengurusan")
            .select("*", { count: "exact", head: true });

        if (error) {
            console.error("Gagal menghitung total kepengurusan:", error.message);
            throw error;
        }
        return count ?? 0;
    },

    /**
     * Mengambil data perolehan medali per wilayah dari tabel prestasi dan atlet (dynamic calculation).
     * @param region Opsional — jika diisi, hanya menghitung untuk wilayah tersebut.
     */
    async getMedalsByRegion(region?: string) {
        let query = supabase.from("prestasi").select("mendali, atlet(kabupaten_kota)");
        if (region) query = query.eq("atlet.kabupaten_kota", region);

        const { data, error } = await query;

        if (error) {
            console.error("Gagal mengambil data medali per wilayah:", error.message);
            throw error;
        }
        
        const regions: Record<string, { total_emas: number; total_perak: number; total_perunggu: number }> = {};

        (data || []).forEach((row: any) => {
            // Handle if atlet is object or array (Supabase might return array for joins depending on relation, but usually object for many-to-one)
            const atletData = Array.isArray(row.atlet) ? row.atlet[0] : row.atlet;
            const regionName = atletData?.kabupaten_kota;
            
            if (regionName) {
                if (!regions[regionName]) {
                    regions[regionName] = { total_emas: 0, total_perak: 0, total_perunggu: 0 };
                }
                
                if (row.mendali === 'Emas') regions[regionName].total_emas += 1;
                else if (row.mendali === 'Perak') regions[regionName].total_perak += 1;
                else if (row.mendali === 'Perunggu') regions[regionName].total_perunggu += 1;
            }
        });

        return Object.keys(regions).map(key => ({
            kabupaten_kota: key,
            total_emas: regions[key].total_emas,
            total_perak: regions[key].total_perak,
            total_perunggu: regions[key].total_perunggu
        }));
    },

    /**
     * Mengambil data kepengurusan aktif beserta nama cabor untuk kalkulasi peringatan SK kedaluwarsa.
     */
    async getActiveKepengurusan() {
        const { data, error } = await supabase
            .from("kepengurusan")
            .select("id, nomor_sk, tanggal_sk, masa_bakti, status_kepengurusan, cabor(nama_cabor)")
            .eq("status_kepengurusan", "Aktif");

        if (error) {
            console.error("Gagal mengambil data kepengurusan aktif:", error.message);
            throw error;
        }
        return data ?? [];
    }
};

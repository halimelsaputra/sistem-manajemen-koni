import { supabase } from "@/lib/supabase";

export const DashboardRepository = {
    /**
     * Mengambil jumlah total data atlet.
     */
    async countAtlet() {
        const { count, error } = await supabase
            .from("atlet")
            .select("*", { count: "exact", head: true });

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
     */
    async countPrestasi() {
        const { count, error } = await supabase
            .from("prestasi")
            .select("*", { count: "exact", head: true });

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
     * Mengambil data perolehan medali per wilayah dari Materialized View.
     */
    async getMedalsByRegion() {
        const { data, error } = await supabase
            .from("mv_medals_by_region")
            .select("*");

        if (error) {
            console.error("Gagal mengambil data medali per wilayah:", error.message);
            throw error;
        }
        return data ?? [];
    },

    /**
     * Mengambil tanggal pembuatan seluruh data prestasi untuk kalkulasi tren bulanan.
     */
    async getPrestasiDates() {
        const { data, error } = await supabase
            .from("prestasi")
            .select("created_at");

        if (error) {
            console.error("Gagal mengambil tanggal prestasi:", error.message);
            throw error;
        }
        return data ?? [];
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

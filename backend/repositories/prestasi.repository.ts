import { supabase } from "@/lib/supabase";

export const PrestasiRepository = {
    /**
     * Mengambil semua data prestasi beserta relasi data atlet dan cabang olahraganya dengan filter opsional.
     * @param filters Objek filter { atlet_id, tingkat_lomba, mendali, tanggal, search }
     */
    async findAll(filters?: { atlet_id?: string; tingkat_lomba?: string; mendali?: string; tanggal?: string; search?: string }) {
        let query = supabase
            .from("prestasi")
            .select("*, atlet(nama_atlet, kabupaten_kota, cabor(nama_cabor))");

        if (filters?.atlet_id) {
            query = query.eq("atlet_id", filters.atlet_id);
        }
        if (filters?.tingkat_lomba) {
            query = query.eq("tingkat_lomba", filters.tingkat_lomba);
        }
        if (filters?.mendali) {
            query = query.eq("mendali", filters.mendali);
        }
        if (filters?.tanggal) {
            query = query.eq("tanggal", filters.tanggal);
        }
        if (filters?.search) {
            query = query.ilike("event_kejuaraan", `%${filters.search}%`);
        }

        const { data, error } = await query;
        
        if (error) {
            console.error("Gagal mengambil data prestasi dari database:", error.message);
            throw error;
        }
        return data;
    },

    /**
     * Mencari data prestasi tertentu berdasarkan ID beserta relasi data atletnya.
     * @param id ID Prestasi
     */
    async findById(id: string) {
        const { data, error } = await supabase
            .from("prestasi")
            .select("*, atlet(nama_atlet, kabupaten_kota, cabor(nama_cabor))")
            .eq("id", id)
            .single();

        if (error) {
            console.error(`Gagal menemukan prestasi dengan ID ${id}:`, error.message);
            throw error;
        }
        return data;
    },

    /**
     * Membuat data prestasi baru.
     * @param data Payload data prestasi { atlet_id, event_kejuaraan, tanggal, tingkat_lomba, mendali }
     */
    async create(data: {
        atlet_id: number;
        event_kejuaraan: string;
        tanggal: string;
        tingkat_lomba: "Daerah" | "Nasional" | "Internasional";
        mendali: "Emas" | "Perak" | "Perunggu" | "Tanpa Medali";
    }) {
        const { data: newPrestasi, error } = await supabase
            .from("prestasi")
            .insert([data])
            .select("*, atlet(nama_atlet, kabupaten_kota, cabor(nama_cabor))")
            .single();

        if (error) {
            console.error("Gagal menambahkan data prestasi baru:", error.message);
            throw error;
        }
        return newPrestasi;
    },

    /**
     * Memperbarui data prestasi berdasarkan ID.
     * @param id ID Prestasi
     * @param data Payload update
     */
    async update(
        id: string,
        data: Partial<{
            atlet_id: number;
            event_kejuaraan: string;
            tanggal: string;
            tingkat_lomba: "Daerah" | "Nasional" | "Internasional";
            mendali: "Emas" | "Perak" | "Perunggu" | "Tanpa Medali";
        }>
    ) {
        const { data: updatedPrestasi, error } = await supabase
            .from("prestasi")
            .update(data)
            .eq("id", id)
            .select("*, atlet(nama_atlet, kabupaten_kota, cabor(nama_cabor))")
            .single();

        if (error) {
            console.error(`Gagal memperbarui data prestasi dengan ID ${id}:`, error.message);
            throw error;
        }
        return updatedPrestasi;
    },

    /**
     * Menghapus data prestasi berdasarkan ID.
     * @param id ID Prestasi
     */
    async delete(id: string) {
        const { error } = await supabase
            .from("prestasi")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(`Gagal menghapus prestasi dengan ID ${id}:`, error.message);
            throw error;
        }
        return true;
    }
};

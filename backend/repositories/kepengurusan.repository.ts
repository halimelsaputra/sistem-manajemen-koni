import { supabase } from "@/lib/supabase";

export const KepengurusanRepository = {
    /**
     * Mengambil semua data kepengurusan beserta nama cabang olahraga (cabor) dengan filter opsional.
     * @param filters Objek filter { cabor_id, status_kepengurusan, search }
     */
    async findAll(filters?: { cabor_id?: string; status_kepengurusan?: string; search?: string }) {
        let query = supabase
            .from("kepengurusan")
            .select("*, cabor(nama_cabor)");

        if (filters?.cabor_id) {
            query = query.eq("cabor_id", filters.cabor_id);
        }
        if (filters?.status_kepengurusan) {
            query = query.eq("status_kepengurusan", filters.status_kepengurusan);
        }
        if (filters?.search) {
            // Pencarian sebagian pada ketua_umum, ketua_harian, sekretaris, atau nomor_sk
            query = query.or(
                `ketua_umum.ilike.%${filters.search}%,` +
                `ketua_harian.ilike.%${filters.search}%,` +
                `sekretaris.ilike.%${filters.search}%,` +
                `nomor_sk.ilike.%${filters.search}%`
            );
        }

        const { data, error } = await query;
        
        if (error) {
            console.error("Gagal mengambil data kepengurusan dari database:", error.message);
            throw error;
        }
        return data;
    },

    /**
     * Mencari data kepengurusan tertentu berdasarkan ID beserta nama cabang olahraga.
     * @param id ID Kepengurusan
     */
    async findById(id: string) {
        const { data, error } = await supabase
            .from("kepengurusan")
            .select("*, cabor(nama_cabor)")
            .eq("id", id)
            .single();

        if (error) {
            console.error(`Gagal menemukan kepengurusan dengan ID ${id}:`, error.message);
            throw error;
        }
        return data;
    },

    /**
     * Membuat data kepengurusan baru.
     * @param data Payload data kepengurusan
     */
    async create(data: {
        cabor_id: number;
        masa_bakti: string;
        nomor_sk: string;
        tanggal_sk: string;
        ketua_umum: string;
        ketua_harian?: string;
        sekretaris: string;
        file_path_sk?: string;
        status_kepengurusan?: "Aktif" | "Berakhir";
    }) {
        const { data: newKepengurusan, error } = await supabase
            .from("kepengurusan")
            .insert([data])
            .select("*, cabor(nama_cabor)")
            .single();

        if (error) {
            console.error("Gagal menambahkan data kepengurusan baru:", error.message);
            throw error;
        }
        return newKepengurusan;
    },

    /**
     * Memperbarui data kepengurusan berdasarkan ID.
     * @param id ID Kepengurusan
     * @param data Payload update
     */
    async update(
        id: string,
        data: Partial<{
            cabor_id: number;
            masa_bakti: string;
            nomor_sk: string;
            tanggal_sk: string;
            ketua_umum: string;
            ketua_harian: string;
            sekretaris: string;
            file_path_sk: string;
            status_kepengurusan: "Aktif" | "Berakhir";
        }>
    ) {
        const { data: updatedKepengurusan, error } = await supabase
            .from("kepengurusan")
            .update(data)
            .eq("id", id)
            .select("*, cabor(nama_cabor)")
            .single();

        if (error) {
            console.error(`Gagal memperbarui data kepengurusan dengan ID ${id}:`, error.message);
            throw error;
        }
        return updatedKepengurusan;
    },

    /**
     * Menghapus data kepengurusan berdasarkan ID.
     * @param id ID Kepengurusan
     */
    async delete(id: string) {
        const { error } = await supabase
            .from("kepengurusan")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(`Gagal menghapus kepengurusan dengan ID ${id}:`, error.message);
            throw error;
        }
        return true;
    }
};

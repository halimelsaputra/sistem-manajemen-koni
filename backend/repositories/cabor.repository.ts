import { supabase } from "@/lib/supabase";

export const CaborRepository = {
    /**
     * Mengambil semua data cabang olahraga (cabor) dengan filter opsional.
     * @param filters Objek filter { search }
     */
    async findAll(filters?: { search?: string }) {
        let query = supabase
            .from("cabor")
            .select("*");

        if (filters?.search) {
            query = query.ilike("nama_cabor", `%${filters.search}%`);
        }

        const { data, error } = await query;
        
        if (error) {
            console.error("Gagal mengambil data cabor dari database:", error.message);
            throw error;
        }
        return data;
    },

    /**
     * Mencari data cabor tertentu berdasarkan ID.
     * @param id ID Cabor
     */
    async findById(id: string) {
        const { data, error } = await supabase
            .from("cabor")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error(`Gagal menemukan cabor dengan ID ${id}:`, error.message);
            throw error;
        }
        return data;
    },

    /**
     * Membuat data cabor baru.
     * @param data Payload data cabor { nama_cabor }
     */
    async create(data: { nama_cabor: string }) {
        const { data: newCabor, error } = await supabase
            .from("cabor")
            .insert([data])
            .select()
            .single();

        if (error) {
            console.error("Gagal menambahkan data cabor baru:", error.message);
            throw error;
        }
        return newCabor;
    },

    /**
     * Mengupdate data cabor berdasarkan ID.
     * @param id ID Cabor
     * @param data Payload update { nama_cabor }
     */
    async update(id: string, data: { nama_cabor: string }) {
        const { data: updatedCabor, error } = await supabase
            .from("cabor")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error(`Gagal memperbarui data cabor dengan ID ${id}:`, error.message);
            throw error;
        }
        return updatedCabor;
    },

    /**
     * Menghapus cabor berdasarkan ID.
     * @param id ID Cabor
     */
    async delete(id: string) {
        const { error } = await supabase
            .from("cabor")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(`Gagal menghapus cabor dengan ID ${id}:`, error.message);
            throw error;
        }
        return true;
    }
};

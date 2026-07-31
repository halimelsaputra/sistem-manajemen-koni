import { supabase } from "@/lib/supabase";

export const AtletRepository = {
    /**
     * Mengambil semua data atlet beserta nama cabang olahraga (cabor) yang diikuti, dengan filter opsional.
     * @param filters Objek filter { search, kabupaten_kota, cabor_id }
     */
    async findAll(filters?: { search?: string; kabupaten_kota?: string; cabor_id?: string }) {
        let query = supabase
            .from("atlet")
            .select("*, cabor(nama_cabor)");

        if (filters?.cabor_id) {
            query = query.eq("cabor_id", filters.cabor_id);
        }
        if (filters?.kabupaten_kota) {
            query = query.eq("kabupaten_kota", filters.kabupaten_kota);
        }
        if (filters?.search) {
            query = query.ilike("nama_atlet", `%${filters.search}%`);
        }

        const { data, error } = await query;
        
        if (error) {
            console.error("Gagal mengambil data atlet dari database:", error.message);
            throw error;
        }
        return data;
    },

    /**
     * Mencari data atlet tertentu berdasarkan ID beserta nama cabang olahraganya.
     * @param id ID Atlet yang dicari
     */
    async findByid(id: string) {
        const { data, error } = await supabase
            .from("atlet")
            .select("*, cabor(nama_cabor)")
            .eq("id", id)
            .single();

        if (error) {
            console.error(`Gagal menemukan atlet dengan ID ${id}:`, error.message);
            throw error;
        }
        return data;
    },

    /**
     * Membuat data atlet baru di database.
     * @param data Payload data atlet { nama_atlet, kabupaten_kota, cabor_id }
     */
    async create(data: { nama_atlet: string; kabupaten_kota: string; cabor_id: number }) {
        const { data: newAtlet, error } = await supabase
            .from("atlet")
            .insert([data])
            .select("*, cabor(nama_cabor)")
            .single();

        if (error) {
            console.error("Gagal menambahkan data atlet baru:", error.message);
            throw error;
        }
        return newAtlet;
    },

    /**
     * Mengupdate data atlet yang sudah ada berdasarkan ID.
     * @param id ID Atlet yang akan diupdate
     * @param data Payload data atlet yang diupdate
     */
    async update(id: string, data: Partial<{ nama_atlet: string; kabupaten_kota: string; cabor_id: number }>) {
        const { data: updatedAtlet, error } = await supabase
            .from("atlet")
            .update(data)
            .eq("id", id)
            .select("*, cabor(nama_cabor)")
            .single();

        if (error) {
            console.error(`Gagal memperbarui data atlet dengan ID ${id}:`, error.message);
            throw error;
        }
        return updatedAtlet;
    },

    /**
     * Menghapus data atlet berdasarkan ID.
     * @param id ID Atlet yang akan dihapus
     */
    async delete(id: string) {
        const { error } = await supabase
            .from("atlet")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(`Gagal menghapus atlet dengan ID ${id}:`, error.message);
            throw error;
        }
        return true;
    }
};
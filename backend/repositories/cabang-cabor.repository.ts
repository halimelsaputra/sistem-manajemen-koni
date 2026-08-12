import { supabase } from "@/lib/supabase";

export const CabangCaborRepository = {
    /**
     * Mengambil semua data cabang cabor, opsional difilter per cabor.
     * @param caborId Opsional — hanya cabang milik cabor ini
     */
    async findAll(caborId?: string) {
        let query = supabase.from("cabang_cabor").select("*");

        if (caborId) {
            query = query.eq("cabor_id", caborId);
        }

        const { data, error } = await query.order("nama_cabang", { ascending: true });

        if (error) {
            console.error("Gagal mengambil data cabang cabor dari database:", error.message);
            throw error;
        }
        return data;
    },

    /**
     * Mencari cabang cabor tertentu berdasarkan ID.
     * @param id ID Cabang Cabor
     */
    async findById(id: string) {
        // maybeSingle: kembalikan null (bukan error) jika ID tidak ditemukan,
        // agar route bisa membedakan 404 vs error server.
        const { data, error } = await supabase
            .from("cabang_cabor")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (error) {
            console.error(`Gagal menemukan cabang cabor dengan ID ${id}:`, error.message);
            throw error;
        }
        return data;
    },

    /**
     * Membuat cabang cabor baru milik sebuah cabor.
     * @param caborId ID cabor induk
     * @param namaCabang Nama cabang (mis. "Renang 200 meter")
     */
    async create(caborId: number, namaCabang: string) {
        const { data: newCabang, error } = await supabase
            .from("cabang_cabor")
            .insert([{ cabor_id: caborId, nama_cabang: namaCabang }])
            .select()
            .single();

        if (error) {
            console.error("Gagal menambahkan cabang cabor baru:", error.message);
            throw error;
        }
        return newCabang;
    },

    /**
     * Memperbarui nama cabang cabor berdasarkan ID.
     * @param id ID Cabang Cabor
     * @param namaCabang Nama cabang baru
     * @returns null jika ID tidak ditemukan, selain itu data cabang yang diperbarui
     */
    async update(id: string, namaCabang: string) {
        const { data: updated, error } = await supabase
            .from("cabang_cabor")
            .update({ nama_cabang: namaCabang, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .maybeSingle();

        if (error) {
            console.error(`Gagal memperbarui cabang cabor dengan ID ${id}:`, error.message);
            throw error;
        }
        return updated; // null jika ID tidak ditemukan
    },

    /**
     * Menghapus cabang cabor berdasarkan ID.
     * Prestasi yang mereferensikannya otomatis di-set null (FK on delete set null).
     * @param id ID Cabang Cabor
     * @returns null jika ID tidak ditemukan, selain itu { deleted }
     */
    async delete(id: string) {
        const { data: deleted, error } = await supabase
            .from("cabang_cabor")
            .delete()
            .eq("id", id)
            .select("id");

        if (error) {
            console.error(`Gagal menghapus cabang cabor dengan ID ${id}:`, error.message);
            throw error;
        }

        if (!deleted || deleted.length === 0) return null; // ID tidak ditemukan

        return { deleted: true };
    }
};

import { supabase } from "@/lib/supabase";
import type { Pagination } from "@/lib/pagination";

export const KepengurusanRepository = {
    /**
     * Mengambil data kepengurusan beserta nama cabang olahraga (cabor) dengan filter opsional.
     * Saat `pagination` diberikan, mengembalikan { items, total }.
     * @param filters Objek filter { cabor_id, status_kepengurusan, search }
     * @param pagination Opsional { page, pageSize } — jika diisi, hasil dipotong per halaman.
     */
    async findAll(
        filters?: { cabor_id?: string; status_kepengurusan?: string; search?: string },
        pagination?: Pagination
    ) {
        // cabor!inner: join inner agar filter pencarian nama cabor deterministik.
        // Aman karena cabor_id adalah FK NOT NULL — tidak ada baris kepengurusan tanpa cabor.
        const selectStr = "*, cabor!inner(nama_cabor)";
        let query = pagination
            ? supabase.from("kepengurusan").select(selectStr, { count: "exact" })
            : supabase.from("kepengurusan").select(selectStr);

        if (filters?.cabor_id) {
            query = query.eq("cabor_id", filters.cabor_id);
        }
        if (filters?.status_kepengurusan) {
            query = query.eq("status_kepengurusan", filters.status_kepengurusan);
        }
        if (filters?.search) {
            // Pencarian sebagian pada nama cabor, ketua_umum, ketua_harian, sekretaris, atau nomor_sk.
            // Koma dihilangkan agar tidak memecah sintaks or() PostgREST.
            const s = filters.search.replace(/,/g, " ");
            query = query.or(
                `cabor.nama_cabor.ilike.%${s}%,` +
                `ketua_umum.ilike.%${s}%,` +
                `ketua_harian.ilike.%${s}%,` +
                `sekretaris.ilike.%${s}%,` +
                `nomor_sk.ilike.%${s}%`
            );
        }

        // ORDER BY eksplisit agar urutan halaman stabil antar request
        query = query.order("id", { ascending: true });

        if (pagination) {
            const from = (pagination.page - 1) * pagination.pageSize;
            query = query.range(from, from + pagination.pageSize - 1);
        }

        const { data, count, error } = await query;

        if (error) {
            console.error("Gagal mengambil data kepengurusan dari database:", error.message);
            throw error;
        }

        if (pagination) {
            return { items: data ?? [], total: count ?? 0 };
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

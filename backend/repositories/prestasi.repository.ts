import { supabase } from "@/lib/supabase";
import type { Pagination } from "@/lib/pagination";

export const PrestasiRepository = {
    /**
     * Mengambil data prestasi beserta relasi data atlet dan cabang olahraganya dengan filter opsional.
     * Saat `pagination` diberikan, mengembalikan { items, total }.
     * @param filters Objek filter { atlet_id, tingkat_lomba, mendali, tanggal, cabor_id, kabupaten_kota, search }
     * @param pagination Opsional { page, pageSize } — jika diisi, hasil dipotong per halaman.
     */
    async findAll(
        filters?: {
            atlet_id?: string;
            tingkat_lomba?: string;
            mendali?: string;
            tanggal?: string;
            cabor_id?: string;
            kabupaten_kota?: string;
            search?: string;
        },
        pagination?: Pagination
    ) {
        // atlet!inner: join inner agar filter pada kolom relasi (cabor_id, kabupaten_kota) deterministik.
        // Aman karena atlet_id adalah FK NOT NULL — tidak ada baris prestasi tanpa atlet.
        const selectStr = "*, atlet!inner(nama_atlet, kabupaten_kota, cabor(nama_cabor))";
        let query = pagination
            ? supabase.from("prestasi").select(selectStr, { count: "exact" })
            : supabase.from("prestasi").select(selectStr);

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
        if (filters?.cabor_id) {
            query = query.eq("atlet.cabor_id", filters.cabor_id);
        }
        if (filters?.kabupaten_kota) {
            query = query.eq("atlet.kabupaten_kota", filters.kabupaten_kota);
        }
        if (filters?.search) {
            // Cari nama event ATAU nama atlet (cross-table OR).
            // Koma dihilangkan agar tidak memecah sintaks or() PostgREST.
            const s = filters.search.replace(/,/g, " ");
            query = query.or(
                `event_kejuaraan.ilike.%${s}%,atlet.nama_atlet.ilike.%${s}%`
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
            console.error("Gagal mengambil data prestasi dari database:", error.message);
            throw error;
        }

        if (pagination) {
            return { items: data ?? [], total: count ?? 0 };
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

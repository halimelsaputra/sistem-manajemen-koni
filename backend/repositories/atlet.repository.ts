import { supabase } from "@/lib/supabase";
import type { Pagination } from "@/lib/pagination";

export const AtletRepository = {
    /**
     * Mengambil data atlet beserta nama cabang olahraga (cabor) yang diikuti, dengan filter opsional.
     * Saat `pagination` diberikan, mengembalikan { items, total }.
     * @param filters Objek filter { search, kabupaten_kota, cabor_id }
     * @param pagination Opsional { page, pageSize } — jika diisi, hasil dipotong per halaman.
     */
    async findAll(
        filters?: { search?: string; kabupaten_kota?: string; cabor_id?: string },
        pagination?: Pagination
    ) {
        const selectStr = "*, cabor(nama_cabor)";
        let query = pagination
            ? supabase.from("atlet").select(selectStr, { count: "exact" })
            : supabase.from("atlet").select(selectStr);

        if (filters?.cabor_id) {
            query = query.eq("cabor_id", filters.cabor_id);
        }
        if (filters?.kabupaten_kota) {
            query = query.eq("kabupaten_kota", filters.kabupaten_kota);
        }
        if (filters?.search) {
            query = query.ilike("nama_atlet", `%${filters.search}%`);
        }

        // ORDER BY eksplisit agar urutan halaman stabil antar request
        query = query.order("id", { ascending: true });

        if (pagination) {
            const from = (pagination.page - 1) * pagination.pageSize;
            query = query.range(from, from + pagination.pageSize - 1);
        }

        const { data, count, error } = await query;

        if (error) {
            console.error("Gagal mengambil data atlet dari database:", error.message);
            throw error;
        }

        if (pagination) {
            return { items: data ?? [], total: count ?? 0 };
        }
        return data;
    },

    /**
     * Mencari data atlet tertentu berdasarkan ID beserta nama cabang olahraganya.
     * @param id ID Atlet yang dicari
     */
    async findByid(id: string) {
        // maybeSingle: kembalikan null (bukan error) jika ID tidak ditemukan,
        // agar route bisa membedakan 404 vs error server.
        const { data, error } = await supabase
            .from("atlet")
            .select("*, cabor(nama_cabor)")
            .eq("id", id)
            .maybeSingle();

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
     * Menghitung jumlah prestasi yang dimiliki seorang atlet.
     * Dipakai untuk menampilkan dampak cascade sebelum konfirmasi hapus.
     * @param atletId ID Atlet
     */
    async countPrestasi(atletId: string) {
        const { count, error } = await supabase
            .from("prestasi")
            .select("id", { count: "exact", head: true })
            .eq("atlet_id", atletId);

        if (error) {
            console.error(`Gagal menghitung prestasi atlet ${atletId}:`, error.message);
            throw error;
        }
        return count ?? 0;
    },

    /**
     * Menghapus atlet beserta seluruh prestasi miliknya (cascade di level service).
     * Urutan penting: prestasi harus dihapus DULU karena FK prestasi.atlet_id RESTRICT.
     * @param id ID Atlet yang akan dihapus
     * @returns null jika ID tidak ditemukan, selain itu { deleted, cascade }
     */
    async delete(id: string) {
        // 1) Ambil & hapus seluruh prestasi milik atlet ini
        const { data: prestasiRows, error: prestasiErr } = await supabase
            .from("prestasi")
            .select("id")
            .eq("atlet_id", id);

        if (prestasiErr) {
            console.error(`Gagal mengambil prestasi atlet ${id}:`, prestasiErr.message);
            throw prestasiErr;
        }

        const prestasiIds = (prestasiRows ?? []).map((p: { id: number }) => p.id);
        if (prestasiIds.length > 0) {
            const { error: delPrestasiErr } = await supabase
                .from("prestasi")
                .delete()
                .in("id", prestasiIds);

            if (delPrestasiErr) {
                console.error(`Gagal menghapus prestasi atlet ${id}:`, delPrestasiErr.message);
                throw delPrestasiErr;
            }
        }

        // 2) Hapus atlet itu sendiri
        const { data: deleted, error } = await supabase
            .from("atlet")
            .delete()
            .eq("id", id)
            .select("id");

        if (error) {
            console.error(`Gagal menghapus atlet dengan ID ${id}:`, error.message);
            throw error;
        }

        if (!deleted || deleted.length === 0) return null; // ID tidak ditemukan

        return { deleted: true, cascade: { prestasi: prestasiIds.length } };
    }
};
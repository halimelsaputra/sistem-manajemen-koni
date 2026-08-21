import { supabase } from "@/lib/supabase";
import type { Pagination } from "@/lib/pagination";
import { removeStorageFile } from "@/lib/storage";

export const KepengurusanRepository = {
    /**
     * Mengambil data kepengurusan beserta nama pemprov (atau cabor untuk data lama)
     * dengan filter opsional. Saat `pagination` diberikan, mengembalikan { items, total }.
     * @param filters Objek filter { pemprov, status_kepengurusan, search }
     * @param pagination Opsional { page, pageSize } — jika diisi, hasil dipotong per halaman.
     */
    async findAll(
        filters?: { pemprov?: string; status_kepengurusan?: string; search?: string },
        pagination?: Pagination
    ) {
        // Auto-mutasi: SK yang tanggal_berakhir-nya sudah lewat otomatis jadi 'Berakhir'
        // (hilang dari tabel SK aktif, muncul di histori) setiap list diambil.
        const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD waktu lokal
        await supabase
            .from("kepengurusan")
            .update({ status_kepengurusan: "Berakhir", updated_at: new Date().toISOString() })
            .eq("status_kepengurusan", "Aktif")
            .lt("tanggal_berakhir", today);

        // cabor(nama_cabor): left join — data lama memakai cabor_id, data baru memakai pemprov.
        const selectStr = "*, cabor(nama_cabor)";
        let query = pagination
            ? supabase.from("kepengurusan").select(selectStr, { count: "exact" })
            : supabase.from("kepengurusan").select(selectStr);

        if (filters?.pemprov) {
            query = query.eq("pemprov", filters.pemprov);
        }
        if (filters?.status_kepengurusan) {
            query = query.eq("status_kepengurusan", filters.status_kepengurusan);
        }
        if (filters?.search) {
            // Pencarian sebagian pada nama pemprov, ketua_umum, sekretaris, atau nomor_sk.
            // Semua kolom lokal — PostgREST or() aman dipakai langsung.
            // Koma dihilangkan agar tidak memecah sintaks or() PostgREST.
            const s = filters.search.replace(/,/g, " ");
            const conditions = [
                `pemprov.ilike.%${s}%`,
                `ketua_umum.ilike.%${s}%`,
                `sekretaris.ilike.%${s}%`,
                `nomor_sk.ilike.%${s}%`,
            ];
            query = query.or(conditions.join(","));
        }

        // ORDER BY tanggal_sk (terbaru dulu) lalu id sebagai tie-breaker,
        // agar urutan halaman stabil antar request dan tampilan selalu terbaru di atas
        query = query.order("tanggal_sk", { ascending: false }).order("id", { ascending: false });

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
        // maybeSingle: kembalikan null (bukan error) jika ID tidak ditemukan,
        // agar route bisa membedakan 404 vs error server.
        const { data, error } = await supabase
            .from("kepengurusan")
            .select("*, cabor(nama_cabor)")
            .eq("id", id)
            .maybeSingle();

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
        pemprov?: string;
        cabor_id?: number;
        nomor_sk: string;
        tanggal_sk: string;
        tanggal_berakhir?: string;
        ketua_umum: string;
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
            pemprov: string;
            cabor_id: number;
            nomor_sk: string;
            tanggal_sk: string;
            tanggal_berakhir: string;
            ketua_umum: string;
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
     * Menghapus data kepengurusan berdasarkan ID, termasuk berkas PDF-nya di storage.
     * @param id ID Kepengurusan
     * @returns null jika ID tidak ditemukan, selain itu { deleted }
     */
    async delete(id: string) {
        // Ambil path file dulu (sebelum baris dihapus) agar bisa dibersihkan dari storage
        const { data: existing, error: findErr } = await supabase
            .from("kepengurusan")
            .select("file_path_sk")
            .eq("id", id)
            .maybeSingle();

        if (findErr) {
            console.error(`Gagal mengambil kepengurusan dengan ID ${id}:`, findErr.message);
            throw findErr;
        }

        const { data: deleted, error } = await supabase
            .from("kepengurusan")
            .delete()
            .eq("id", id)
            .select("id");

        if (error) {
            console.error(`Gagal menghapus kepengurusan dengan ID ${id}:`, error.message);
            throw error;
        }

        if (!deleted || deleted.length === 0) return null; // ID tidak ditemukan

        // Best-effort: hapus berkas PDF dari storage (kegagalan tidak menggagalkan hapus data)
        await removeStorageFile(existing?.file_path_sk);

        return { deleted: true };
    },

    /**
     * Mematikan (status → "Berakhir") seluruh kepengurusan AKTIF lain
     * pada pemprov yang sama, kecuali ID yang dikecualikan.
     * Dipakai saat SK baru dibuat agar hanya SK terbaru yang berstatus Aktif.
     * @param pemprov Nama pemprov target
     * @param excludeId ID kepengurusan baru yang TIDAK ikut dimatikan
     */
    async deactivateOthers(pemprov: string, excludeId: number) {
        const { error } = await supabase
            .from("kepengurusan")
            .update({ status_kepengurusan: "Berakhir" })
            .eq("pemprov", pemprov)
            .eq("status_kepengurusan", "Aktif")
            .neq("id", excludeId);

        if (error) {
            console.error(`Gagal mematikan kepengurusan lama pemprov ${pemprov}:`, error.message);
            throw error;
        }
        return true;
    }
};

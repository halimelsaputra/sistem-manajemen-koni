import { supabase } from "@/lib/supabase";
import type { Pagination } from "@/lib/pagination";
import { removeStorageFile } from "@/lib/storage";

/**
 * Repository data kepengurusan kabupaten/kota (KONI Kabupaten/Kota se-Aceh).
 * Struktur mengikuti pola kepengurusan per cabor (provinsi), tetapi level
 * wilayah: satu pengurus aktif per kabupaten/kota.
 */
export const KepengurusanKabupatenRepository = {
    /**
     * Mengambil data kepengurusan kabupaten dengan filter opsional.
     * @param filters Objek filter { kabupaten_kota, status_kepengurusan, search }
     * @param pagination Opsional { page, pageSize } — jika diisi, hasil { items, total }.
     */
    async findAll(
        filters?: { kabupaten_kota?: string; status_kepengurusan?: string; search?: string },
        pagination?: Pagination
    ) {
        const selectStr = "*";
        let query = pagination
            ? supabase.from("kepengurusan_kabupaten").select(selectStr, { count: "exact" })
            : supabase.from("kepengurusan_kabupaten").select(selectStr);

        if (filters?.kabupaten_kota) {
            query = query.eq("kabupaten_kota", filters.kabupaten_kota);
        }
        if (filters?.status_kepengurusan) {
            query = query.eq("status_kepengurusan", filters.status_kepengurusan);
        }
        if (filters?.search) {
            const s = filters.search.replace(/,/g, " ");
            query = query.or(
                `kabupaten_kota.ilike.%${s}%,ketua_umum.ilike.%${s}%,sekretaris.ilike.%${s}%,nomor_sk.ilike.%${s}%`
            );
        }

        // Urutkan: status Aktif lebih dulu, lalu tanggal terbaru, lalu id terbaru
        // agar tampilan selalu konsisten antar request.
        query = query
            .order("tanggal_sk", { ascending: false })
            .order("id", { ascending: false });

        if (pagination) {
            const from = (pagination.page - 1) * pagination.pageSize;
            query = query.range(from, from + pagination.pageSize - 1);
        }

        const { data, count, error } = await query;

        if (error) {
            console.error("Gagal mengambil data kepengurusan kabupaten dari database:", error.message);
            throw error;
        }

        if (pagination) {
            return { items: data ?? [], total: count ?? 0 };
        }
        return data;
    },

    /**
     * Mencari data kepengurusan kabupaten berdasarkan ID.
     * @param id ID Kepengurusan Kabupaten
     */
    async findById(id: string) {
        const { data, error } = await supabase
            .from("kepengurusan_kabupaten")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (error) {
            console.error(`Gagal menemukan kepengurusan kabupaten dengan ID ${id}:`, error.message);
            throw error;
        }
        return data;
    },

    /**
     * Membuat data kepengurusan kabupaten baru.
     * @param data Payload data kepengurusan kabupaten
     */
    async create(data: {
        kabupaten_kota: string;
        nomor_sk: string;
        tanggal_sk: string;
        tanggal_berakhir?: string;
        ketua_umum: string;
        sekretaris: string;
        file_path_sk?: string;
        status_kepengurusan?: "Aktif" | "Berakhir";
    }) {
        const { data: newKepengurusan, error } = await supabase
            .from("kepengurusan_kabupaten")
            .insert([data])
            .select("*")
            .single();

        if (error) {
            console.error("Gagal menambahkan data kepengurusan kabupaten baru:", error.message);
            throw error;
        }
        return newKepengurusan;
    },

    /**
     * Memperbarui data kepengurusan kabupaten berdasarkan ID.
     * @param id ID Kepengurusan Kabupaten
     * @param data Payload update
     */
    async update(
        id: string,
        data: Partial<{
            kabupaten_kota: string;
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
            .from("kepengurusan_kabupaten")
            .update(data)
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            console.error(`Gagal memperbarui kepengurusan kabupaten dengan ID ${id}:`, error.message);
            throw error;
        }
        return updatedKepengurusan;
    },

    /**
     * Menghapus data kepengurusan kabupaten berdasarkan ID, termasuk berkas PDF-nya di storage.
     * @param id ID Kepengurusan Kabupaten
     * @returns null jika ID tidak ditemukan, selain itu { deleted }
     */
    async delete(id: string) {
        // Ambil path file dulu (sebelum baris dihapus) agar bisa dibersihkan dari storage
        const { data: existing, error: findErr } = await supabase
            .from("kepengurusan_kabupaten")
            .select("file_path_sk")
            .eq("id", id)
            .maybeSingle();

        if (findErr) {
            console.error(`Gagal mengambil kepengurusan kabupaten dengan ID ${id}:`, findErr.message);
            throw findErr;
        }

        const { data: deleted, error } = await supabase
            .from("kepengurusan_kabupaten")
            .delete()
            .eq("id", id)
            .select("id");

        if (error) {
            console.error(`Gagal menghapus kepengurusan kabupaten dengan ID ${id}:`, error.message);
            throw error;
        }

        if (!deleted || deleted.length === 0) return null; // ID tidak ditemukan

        // Best-effort: hapus berkas PDF dari storage (kegagalan tidak menggagalkan hapus data)
        await removeStorageFile(existing?.file_path_sk);

        return { deleted: true };
    },

    /**
     * Mematikan (status → "Berakhir") seluruh kepengurusan AKTIF lain
     * pada kabupaten/kota yang sama, kecuali ID yang dikecualikan.
     * Dipakai saat SK baru dibuat agar hanya pengurus terbaru yang berstatus Aktif.
     * @param kabupatenKota Nama kabupaten/kota target
     * @param excludeId ID kepengurusan baru yang TIDAK ikut dimatikan
     */
    async deactivateOthers(kabupatenKota: string, excludeId: number) {
        const { error } = await supabase
            .from("kepengurusan_kabupaten")
            .update({ status_kepengurusan: "Berakhir" })
            .eq("kabupaten_kota", kabupatenKota)
            .eq("status_kepengurusan", "Aktif")
            .neq("id", excludeId);

        if (error) {
            console.error(`Gagal mematikan kepengurusan lama kabupaten ${kabupatenKota}:`, error.message);
            throw error;
        }
        return true;
    }
};

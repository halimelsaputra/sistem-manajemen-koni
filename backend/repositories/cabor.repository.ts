import { supabase } from "@/lib/supabase";
import { removeStorageFile } from "@/lib/storage";

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
        // maybeSingle: kembalikan null (bukan error) jika ID tidak ditemukan,
        // agar route bisa membedakan 404 vs error server.
        const { data, error } = await supabase
            .from("cabor")
            .select("*")
            .eq("id", id)
            .maybeSingle();

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
     * Menghitung jumlah data yang bergantung pada sebuah cabor.
     * Dipakai untuk menampilkan dampak cascade sebelum konfirmasi hapus.
     * @param caborId ID Cabor
     */
    async countDependencies(caborId: string) {
        // prestasi dihitung lewat join atlet (atlet!inner) agar deterministik
        const [atletRes, prestasiRes, kepengurusanRes, cabangRes] = await Promise.all([
            supabase
                .from("atlet")
                .select("id", { count: "exact", head: true })
                .eq("cabor_id", caborId),
            supabase
                .from("prestasi")
                .select("id, atlet!inner(cabor_id)", { count: "exact", head: true })
                .eq("atlet.cabor_id", caborId),
            supabase
                .from("kepengurusan")
                .select("id", { count: "exact", head: true })
                .eq("cabor_id", caborId),
            supabase
                .from("cabang_cabor")
                .select("id", { count: "exact", head: true })
                .eq("cabor_id", caborId),
        ]);

        for (const res of [atletRes, prestasiRes, kepengurusanRes, cabangRes]) {
            if (res.error) {
                console.error("Gagal menghitung dependensi cabor:", res.error.message);
                throw res.error;
            }
        }

        return {
            atlet: atletRes.count ?? 0,
            prestasi: prestasiRes.count ?? 0,
            kepengurusan: kepengurusanRes.count ?? 0,
            cabang: cabangRes.count ?? 0,
        };
    },

    /**
     * Menghapus cabor beserta seluruh data yang bergantung padanya (cascade):
     * kepengurusan (SK) + file PDF-nya di storage, atlet, dan prestasi para atlet.
     * Urutan penting agar tidak melanggar FK RESTRICT.
     * @param id ID Cabor yang akan dihapus
     * @returns null jika ID tidak ditemukan, selain itu { deleted, cascade }
     */
    async delete(id: string) {
        // 1) Kepengurusan (SK) terkait + bersihkan file PDF di storage
        const { data: kepRows, error: kepErr } = await supabase
            .from("kepengurusan")
            .select("id, file_path_sk")
            .eq("cabor_id", id);

        if (kepErr) {
            console.error(`Gagal mengambil kepengurusan cabor ${id}:`, kepErr.message);
            throw kepErr;
        }

        const kepIds = (kepRows ?? []).map((r: { id: number }) => r.id);
        if (kepIds.length > 0) {
            const { error: delKepErr } = await supabase
                .from("kepengurusan")
                .delete()
                .in("id", kepIds);
            if (delKepErr) {
                console.error(`Gagal menghapus kepengurusan cabor ${id}:`, delKepErr.message);
                throw delKepErr;
            }
            for (const r of kepRows ?? []) {
                await removeStorageFile(r.file_path_sk);
            }
        }

        // 2) Atlet terkait + prestasi mereka (cascade)
        const { data: atletRows, error: atletErr } = await supabase
            .from("atlet")
            .select("id")
            .eq("cabor_id", id);

        if (atletErr) {
            console.error(`Gagal mengambil atlet cabor ${id}:`, atletErr.message);
            throw atletErr;
        }

        const atletIds = (atletRows ?? []).map((r: { id: number }) => r.id);
        let prestasiCount = 0;
        if (atletIds.length > 0) {
            const { data: prestRows, error: prestErr } = await supabase
                .from("prestasi")
                .select("id")
                .in("atlet_id", atletIds);
            if (prestErr) {
                console.error(`Gagal mengambil prestasi cabor ${id}:`, prestErr.message);
                throw prestErr;
            }

            const prestIds = (prestRows ?? []).map((p: { id: number }) => p.id);
            prestasiCount = prestIds.length;
            if (prestIds.length > 0) {
                const { error: delPrestErr } = await supabase
                    .from("prestasi")
                    .delete()
                    .in("id", prestIds);
                if (delPrestErr) {
                    console.error(`Gagal menghapus prestasi cabor ${id}:`, delPrestErr.message);
                    throw delPrestErr;
                }
            }

            const { error: delAtletErr } = await supabase
                .from("atlet")
                .delete()
                .in("id", atletIds);
            if (delAtletErr) {
                console.error(`Gagal menghapus atlet cabor ${id}:`, delAtletErr.message);
                throw delAtletErr;
            }
        }

        // 3) Hitung cabang cabor yang akan ikut terhapus (FK on delete cascade)
        const { count: cabangCount, error: cabangCountErr } = await supabase
            .from("cabang_cabor")
            .select("id", { count: "exact", head: true })
            .eq("cabor_id", id);
        if (cabangCountErr) {
            console.error(`Gagal menghitung cabang cabor ${id}:`, cabangCountErr.message);
            throw cabangCountErr;
        }

        // 4) Cabor itu sendiri (cabang_cabor ikut terhapus otomatis via FK cascade;
        //    prestasi yang mereferensi cabang di-set null via FK on delete set null)
        const { data: deleted, error } = await supabase
            .from("cabor")
            .delete()
            .eq("id", id)
            .select("id");

        if (error) {
            console.error(`Gagal menghapus cabor dengan ID ${id}:`, error.message);
            throw error;
        }

        if (!deleted || deleted.length === 0) return null; // ID tidak ditemukan

        return {
            deleted: true,
            cascade: {
                atlet: atletIds.length,
                prestasi: prestasiCount,
                kepengurusan: kepIds.length,
                cabang: cabangCount ?? 0,
            },
        };
    }
};

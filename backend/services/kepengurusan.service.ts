import { KepengurusanRepository } from "@/repositories/kepengurusan.repository";
import { ValidationError } from "@/lib/errors";
import type { Pagination } from "@/lib/pagination";

export const KepengurusanService = {
    /**
     * Mendapatkan data kepengurusan dengan filter opsional dan pagination opsional.
     * @param filters Objek filter { cabor_id, status_kepengurusan, search }
     * @param pagination Opsional { page, pageSize } — jika diisi, hasil { items, total }.
     */
    async getAll(
        filters?: { pemprov?: string; status_kepengurusan?: string; search?: string },
        pagination?: Pagination
    ) {
        return await KepengurusanRepository.findAll(filters, pagination);
    },

    /**
     * Mendapatkan data kepengurusan berdasarkan ID.
     * @param id ID Kepengurusan
     */
    async getById(id: string) {
        return await KepengurusanRepository.findById(id);
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
        // Validasi field wajib
        if (!data.pemprov || !data.nomor_sk || !data.tanggal_sk || !data.tanggal_berakhir || !data.ketua_umum || !data.sekretaris) {
            throw new ValidationError("Field pemprov, nomor_sk, tanggal_sk, tanggal_berakhir, ketua_umum, dan sekretaris wajib diisi.");
        }

        // Validasi status_kepengurusan
        if (data.status_kepengurusan) {
            const validStatus = ["Aktif", "Berakhir"];
            if (!validStatus.includes(data.status_kepengurusan)) {
                throw new ValidationError("status_kepengurusan tidak valid. Harus salah satu dari: Aktif, Berakhir.");
            }
        }

        const newKepengurusan = await KepengurusanRepository.create({
            pemprov: data.pemprov.trim(),
            cabor_id: data.cabor_id,
            nomor_sk: data.nomor_sk.trim(),
            tanggal_sk: data.tanggal_sk,
            tanggal_berakhir: data.tanggal_berakhir,
            ketua_umum: data.ketua_umum.trim(),
            sekretaris: data.sekretaris.trim(),
            file_path_sk: data.file_path_sk?.trim(),
            status_kepengurusan: data.status_kepengurusan || "Aktif"
        });

        // Auto-mutasi: jika SK baru berstatus Aktif, matikan SK lama (masih Aktif)
        // pada pemprov yang sama agar hanya SK terbaru yang aktif.
        if ((data.status_kepengurusan ?? "Aktif") === "Aktif" && newKepengurusan?.id) {
            try {
                await KepengurusanRepository.deactivateOthers(data.pemprov.trim(), newKepengurusan.id);
            } catch (err) {
                // SK utama sudah tersimpan; kegagalan deaktivasi jangan sampai
                // dianggap gagal total (klien bisa retry dan membuat duplikasi).
                console.error("SK baru tersimpan, tapi gagal mematikan SK lama:", err);
            }
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
        // Validasi status_kepengurusan jika dikirimkan
        if (data.status_kepengurusan) {
            const validStatus = ["Aktif", "Berakhir"];
            if (!validStatus.includes(data.status_kepengurusan)) {
                throw new ValidationError("status_kepengurusan tidak valid. Harus salah satu dari: Aktif, Berakhir.");
            }
        }

        const payload: any = { ...data };
        if (data.pemprov) payload.pemprov = data.pemprov.trim();
        if (data.nomor_sk) payload.nomor_sk = data.nomor_sk.trim();
        if (data.ketua_umum) payload.ketua_umum = data.ketua_umum.trim();
        if (data.sekretaris) payload.sekretaris = data.sekretaris.trim();
        if (data.file_path_sk) payload.file_path_sk = data.file_path_sk.trim();
        if (data.tanggal_berakhir) payload.tanggal_berakhir = data.tanggal_berakhir;

        const updated = await KepengurusanRepository.update(id, payload);

        // Konsistensi di jalur update: jika SK ini di-set menjadi "Aktif",
        // matikan SK Aktif lain pada pemprov yang sama (kecuali dirinya sendiri)
        // agar tidak ada dua SK aktif sekaligus.
        if (payload.status_kepengurusan === "Aktif" && (updated?.pemprov || updated?.cabor_id) != null) {
            try {
                await KepengurusanRepository.deactivateOthers(
                    (updated?.pemprov as string) || String(updated?.cabor_id),
                    Number(id)
                );
            } catch (err) {
                console.error("Gagal mematikan SK lain saat update menjadi Aktif:", err);
            }
        }

        return updated;
    },

    /**
     * Menghapus data kepengurusan berdasarkan ID.
     * @param id ID Kepengurusan
     */
    async delete(id: string) {
        return await KepengurusanRepository.delete(id);
    }
};

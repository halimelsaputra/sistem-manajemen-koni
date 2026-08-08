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
        filters?: { cabor_id?: string; status_kepengurusan?: string; search?: string },
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
        // Validasi field wajib
        if (!data.cabor_id || !data.masa_bakti || !data.nomor_sk || !data.tanggal_sk || !data.ketua_umum || !data.sekretaris) {
            throw new ValidationError("Field cabor_id, masa_bakti, nomor_sk, tanggal_sk, ketua_umum, dan sekretaris wajib diisi.");
        }

        // Validasi status_kepengurusan
        if (data.status_kepengurusan) {
            const validStatus = ["Aktif", "Berakhir"];
            if (!validStatus.includes(data.status_kepengurusan)) {
                throw new ValidationError("status_kepengurusan tidak valid. Harus salah satu dari: Aktif, Berakhir.");
            }
        }

        return await KepengurusanRepository.create({
            cabor_id: data.cabor_id,
            masa_bakti: data.masa_bakti.trim(),
            nomor_sk: data.nomor_sk.trim(),
            tanggal_sk: data.tanggal_sk,
            ketua_umum: data.ketua_umum.trim(),
            ketua_harian: data.ketua_harian?.trim(),
            sekretaris: data.sekretaris.trim(),
            file_path_sk: data.file_path_sk?.trim(),
            status_kepengurusan: data.status_kepengurusan || "Aktif"
        });
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
        // Validasi status_kepengurusan jika dikirimkan
        if (data.status_kepengurusan) {
            const validStatus = ["Aktif", "Berakhir"];
            if (!validStatus.includes(data.status_kepengurusan)) {
                throw new ValidationError("status_kepengurusan tidak valid. Harus salah satu dari: Aktif, Berakhir.");
            }
        }

        const payload: any = { ...data };
        if (data.masa_bakti) payload.masa_bakti = data.masa_bakti.trim();
        if (data.nomor_sk) payload.nomor_sk = data.nomor_sk.trim();
        if (data.ketua_umum) payload.ketua_umum = data.ketua_umum.trim();
        if (data.ketua_harian) payload.ketua_harian = data.ketua_harian.trim();
        if (data.sekretaris) payload.sekretaris = data.sekretaris.trim();
        if (data.file_path_sk) payload.file_path_sk = data.file_path_sk.trim();

        return await KepengurusanRepository.update(id, payload);
    },

    /**
     * Menghapus data kepengurusan berdasarkan ID.
     * @param id ID Kepengurusan
     */
    async delete(id: string) {
        return await KepengurusanRepository.delete(id);
    }
};

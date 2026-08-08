import { AtletRepository } from "@/repositories/atlet.repository";
import { ValidationError } from "@/lib/errors";
import type { Pagination } from "@/lib/pagination";

export const AtletService = {
    /**
     * Mendapatkan data atlet dengan filter opsional dan pagination opsional.
     * @param filters Objek filter { search, kabupaten_kota, cabor_id }
     * @param pagination Opsional { page, pageSize } — jika diisi, hasil { items, total }.
     */
    async getAll(
        filters?: { search?: string; kabupaten_kota?: string; cabor_id?: string },
        pagination?: Pagination
    ) {
        return await AtletRepository.findAll(filters, pagination);
    },

    /**
     * Mendapatkan satu data atlet berdasarkan ID.
     * @param id ID Atlet
     */
    async getById(id: string) {
        return await AtletRepository.findByid(id);
    },

    /**
     * Membuat atlet baru.
     * @param data Payload data atlet
     */
    async create(data: { nama_atlet: string; kabupaten_kota: string; cabor_id: number }) {
        // Validasi dasar
        if (!data.nama_atlet || !data.kabupaten_kota || !data.cabor_id) {
            throw new ValidationError("Field nama_atlet, kabupaten_kota, dan cabor_id wajib diisi.");
        }
        return await AtletRepository.create(data);
    },

    /**
     * Memperbarui data atlet berdasarkan ID.
     * @param id ID Atlet
     * @param data Payload update
     */
    async update(id: string, data: Partial<{ nama_atlet: string; kabupaten_kota: string; cabor_id: number }>) {
        return await AtletRepository.update(id, data);
    },

    /**
     * Menghapus atlet berdasarkan ID.
     * @param id ID Atlet
     */
    async delete(id: string) {
        return await AtletRepository.delete(id);
    }
};

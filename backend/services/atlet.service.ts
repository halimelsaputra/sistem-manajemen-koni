import { AtletRepository } from "@/repositories/atlet.repository";
import { ValidationError } from "@/lib/errors";

export const AtletService = {
    /**
     * Mendapatkan semua data atlet dengan filter opsional.
     * @param filters Objek filter { search, kabupaten_kota, cabor_id }
     */
    async getAll(filters?: { search?: string; kabupaten_kota?: string; cabor_id?: string }) {
        return await AtletRepository.findAll(filters);
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

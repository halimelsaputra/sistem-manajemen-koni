import { CaborRepository } from "@/repositories/cabor.repository";
import { ValidationError } from "@/lib/errors";

export const CaborService = {
    /**
     * Mendapatkan semua cabang olahraga dengan filter opsional.
     * @param filters Objek filter { search }
     */
    async getAll(filters?: { search?: string }) {
        return await CaborRepository.findAll(filters);
    },

    /**
     * Mendapatkan satu cabang olahraga berdasarkan ID.
     * @param id ID Cabor
     */
    async getById(id: string) {
        return await CaborRepository.findById(id);
    },

    /**
     * Membuat cabang olahraga baru.
     * @param data Payload data cabor { nama_cabor }
     */
    async create(data: { nama_cabor: string }) {
        if (!data.nama_cabor || data.nama_cabor.trim() === "") {
            throw new ValidationError("Nama cabang olahraga (nama_cabor) wajib diisi.");
        }
        return await CaborRepository.create({
            nama_cabor: data.nama_cabor.trim()
        });
    },

    /**
     * Memperbarui cabang olahraga berdasarkan ID.
     * @param id ID Cabor
     * @param data Payload update { nama_cabor }
     */
    async update(id: string, data: { nama_cabor: string }) {
        if (!data.nama_cabor || data.nama_cabor.trim() === "") {
            throw new ValidationError("Nama cabang olahraga (nama_cabor) wajib diisi.");
        }
        return await CaborRepository.update(id, {
            nama_cabor: data.nama_cabor.trim()
        });
    },

    /**
     * Menghapus cabang olahraga berdasarkan ID.
     * @param id ID Cabor
     */
    async delete(id: string) {
        return await CaborRepository.delete(id);
    }
};

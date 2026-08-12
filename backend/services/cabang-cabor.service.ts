import { CabangCaborRepository } from "@/repositories/cabang-cabor.repository";
import { CaborRepository } from "@/repositories/cabor.repository";
import { ValidationError } from "@/lib/errors";

export const CabangCaborService = {
    /**
     * Mendapatkan semua cabang cabor, opsional difilter per cabor.
     * @param caborId Opsional — hanya cabang milik cabor ini
     */
    async getAll(caborId?: string) {
        return await CabangCaborRepository.findAll(caborId);
    },

    /**
     * Membuat cabang cabor baru milik sebuah cabor.
     * @param caborId ID cabor induk
     * @param data Payload { nama_cabang }
     */
    async create(caborId: string, data: { nama_cabang: string }) {
        if (!data.nama_cabang || data.nama_cabang.trim() === "") {
            throw new ValidationError("Nama cabang (nama_cabang) wajib diisi.");
        }

        // Pastikan cabor induk benar-benar ada (referensi FK)
        const cabor = await CaborRepository.findById(caborId);
        if (!cabor) {
            throw new ValidationError("Cabor induk tidak ditemukan.");
        }

        return await CabangCaborRepository.create(cabor.id, data.nama_cabang.trim());
    },

    /**
     * Menghapus cabang cabor berdasarkan ID.
     * @param id ID Cabang Cabor
     */
    async delete(id: string) {
        return await CabangCaborRepository.delete(id);
    }
};

import { CaborRepository } from "@/repositories/cabor.repository";
import { ValidationError } from "@/lib/errors";

/**
 * Memastikan nama cabor belum dipakai (case-insensitive).
 * @param nama Nama cabor yang akan dicek
 * @param excludeId Opsional — ID cabor yang dikecualikan (saat update dirinya sendiri)
 */
async function ensureNamaUnik(nama: string, excludeId?: string) {
    const all = await CaborRepository.findAll();
    const dup = (all ?? []).find(
        c => String(c.nama_cabor || "").trim().toLowerCase() === nama.toLowerCase()
            && String(c.id) !== String(excludeId)
    );
    if (dup) {
        throw new ValidationError(`Cabang olahraga "${nama}" sudah terdaftar.`);
    }
}

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
        const nama = data.nama_cabor.trim();
        await ensureNamaUnik(nama);
        return await CaborRepository.create({ nama_cabor: nama });
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
        const nama = data.nama_cabor.trim();
        await ensureNamaUnik(nama, id);
        return await CaborRepository.update(id, { nama_cabor: nama });
    },

    /**
     * Menghapus cabang olahraga berdasarkan ID.
     * @param id ID Cabor
     */
    async delete(id: string) {
        return await CaborRepository.delete(id);
    }
};

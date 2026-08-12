import { CabangCaborRepository } from "@/repositories/cabang-cabor.repository";
import { CaborRepository } from "@/repositories/cabor.repository";
import { ValidationError } from "@/lib/errors";

/**
 * Memastikan nama cabang belum dipakai dalam cabor yang sama (case-insensitive).
 */
async function ensureNamaUnik(caborId: number, nama: string, excludeId?: string) {
    const cabangs = await CabangCaborRepository.findAll(String(caborId));
    const dup = (cabangs ?? []).find(
        c => String(c.nama_cabang || "").trim().toLowerCase() === nama.toLowerCase()
            && String(c.id) !== String(excludeId)
    );
    if (dup) {
        throw new ValidationError(`Cabang "${nama}" sudah ada pada cabor ini.`);
    }
}

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

        const nama = data.nama_cabang.trim();
        await ensureNamaUnik(cabor.id, nama);
        return await CabangCaborRepository.create(cabor.id, nama);
    },

    /**
     * Memperbarui nama cabang cabor.
     * @param id ID Cabang Cabor
     * @param data Payload { nama_cabang }
     */
    async update(id: string, data: { nama_cabang: string }) {
        if (!data.nama_cabang || data.nama_cabang.trim() === "") {
            throw new ValidationError("Nama cabang (nama_cabang) wajib diisi.");
        }
        const nama = data.nama_cabang.trim();
        const existing = await CabangCaborRepository.findById(id);
        if (existing) {
            await ensureNamaUnik(existing.cabor_id, nama, id);
        }
        return await CabangCaborRepository.update(id, nama);
    },

    /**
     * Menghapus cabang cabor berdasarkan ID.
     * @param id ID Cabang Cabor
     */
    async delete(id: string) {
        return await CabangCaborRepository.delete(id);
    }
};

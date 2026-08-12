import { AtletRepository } from "@/repositories/atlet.repository";
import { ValidationError } from "@/lib/errors";
import type { Pagination } from "@/lib/pagination";

/**
 * Memastikan kombinasi (nama_atlet + kabupaten_kota + cabor_id) belum dipakai (case-insensitive).
 * Dua atlet senama boleh didaftarkan jika cabor ATAU daerahnya berbeda.
 */
async function ensureNamaUnik(nama: string, kabupatenKota: string, caborId: number, excludeId?: string) {
    const all = (await AtletRepository.findAll({ cabor_id: String(caborId) })) as any[];
    const dup = (all ?? []).find(
        a =>
            String(a.nama_atlet || "").trim().toLowerCase() === nama.toLowerCase() &&
            String(a.kabupaten_kota || "").trim().toLowerCase() === kabupatenKota.toLowerCase() &&
            String(a.id) !== String(excludeId)
    );
    if (dup) {
        throw new ValidationError(`Atlet "${nama}" sudah terdaftar pada cabor dan daerah yang sama.`);
    }
}

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
        return await AtletRepository.findById(id);
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
        const nama = data.nama_atlet.trim();
        await ensureNamaUnik(nama, data.kabupaten_kota.trim(), data.cabor_id);
        return await AtletRepository.create({ ...data, nama_atlet: nama });
    },

    /**
     * Memperbarui data atlet berdasarkan ID.
     * @param id ID Atlet
     * @param data Payload update
     */
    async update(id: string, data: Partial<{ nama_atlet: string; kabupaten_kota: string; cabor_id: number }>) {
        // Nilai efektif nama, daerah, & cabor (payload ?? nilai existing) untuk cek duplikat
        const existing = await AtletRepository.findById(id);
        const effNama = (data.nama_atlet ?? existing?.nama_atlet ?? "").trim();
        const effDaerah = (data.kabupaten_kota ?? existing?.kabupaten_kota ?? "").trim();
        const effCaborId = data.cabor_id ?? existing?.cabor_id;
        if (effNama && effDaerah && effCaborId != null) {
            await ensureNamaUnik(effNama, effDaerah, effCaborId, id);
        }
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

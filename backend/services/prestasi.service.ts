import { PrestasiRepository } from "@/repositories/prestasi.repository";
import { ValidationError } from "@/lib/errors";
import type { Pagination } from "@/lib/pagination";

export const PrestasiService = {
    /**
     * Mendapatkan data prestasi dengan filter opsional dan pagination opsional.
     * @param filters Objek filter { atlet_id, tingkat_lomba, mendali, tanggal, cabor_id, kabupaten_kota, search }
     * @param pagination Opsional { page, pageSize } — jika diisi, hasil { items, total }.
     */
    async getAll(
        filters?: {
            atlet_id?: string;
            tingkat_lomba?: string;
            mendali?: string;
            tanggal?: string;
            cabor_id?: string;
            kabupaten_kota?: string;
            search?: string;
        },
        pagination?: Pagination
    ) {
        return await PrestasiRepository.findAll(filters, pagination);
    },

    /**
     * Mendapatkan data prestasi berdasarkan ID.
     * @param id ID Prestasi
     */
    async getById(id: string) {
        return await PrestasiRepository.findById(id);
    },

    /**
     * Membuat prestasi baru.
     * @param data Payload data prestasi
     */
    async create(data: {
        atlet_id: number;
        event_kejuaraan: string;
        tanggal: string;
        tingkat_lomba: "Daerah" | "Nasional" | "Internasional";
        mendali: "Emas" | "Perak" | "Perunggu" | "Tanpa Medali";
        cabang_cabor_id?: number | null;
    }) {
        // Validasi parameter wajib
        if (!data.atlet_id || !data.event_kejuaraan || !data.tanggal || !data.tingkat_lomba || !data.mendali) {
            throw new ValidationError("Semua field (atlet_id, event_kejuaraan, tanggal, tingkat_lomba, mendali) wajib diisi.");
        }

        // Validasi enum tingkat_lomba
        const validTingkat = ["Daerah", "Nasional", "Internasional"];
        if (!validTingkat.includes(data.tingkat_lomba)) {
            throw new ValidationError("tingkat_lomba tidak valid. Harus salah satu dari: Daerah, Nasional, Internasional.");
        }

        // Validasi enum mendali
        const validMendali = ["Emas", "Perak", "Perunggu", "Tanpa Medali"];
        if (!validMendali.includes(data.mendali)) {
            throw new ValidationError("mendali tidak valid. Harus salah satu dari: Emas, Perak, Perunggu, Tanpa Medali.");
        }

        return await PrestasiRepository.create({
            atlet_id: data.atlet_id,
            event_kejuaraan: data.event_kejuaraan.trim(),
            tanggal: data.tanggal,
            tingkat_lomba: data.tingkat_lomba,
            mendali: data.mendali,
            cabang_cabor_id: data.cabang_cabor_id ?? null
        });
    },

    /**
     * Memperbarui prestasi berdasarkan ID.
     * @param id ID Prestasi
     * @param data Payload update
     */
    async update(
        id: string,
        data: Partial<{
            atlet_id: number;
            event_kejuaraan: string;
            tanggal: string;
            tingkat_lomba: "Daerah" | "Nasional" | "Internasional";
            mendali: "Emas" | "Perak" | "Perunggu" | "Tanpa Medali";
            cabang_cabor_id?: number | null;
        }>
    ) {
        // Validasi parsial jika diinputkan
        if (data.tingkat_lomba) {
            const validTingkat = ["Daerah", "Nasional", "Internasional"];
            if (!validTingkat.includes(data.tingkat_lomba)) {
                throw new ValidationError("tingkat_lomba tidak valid. Harus salah satu dari: Daerah, Nasional, Internasional.");
            }
        }

        if (data.mendali) {
            const validMendali = ["Emas", "Perak", "Perunggu", "Tanpa Medali"];
            if (!validMendali.includes(data.mendali)) {
                throw new ValidationError("mendali tidak valid. Harus salah satu dari: Emas, Perak, Perunggu, Tanpa Medali.");
            }
        }

        const payload: any = { ...data };
        if (data.event_kejuaraan) payload.event_kejuaraan = data.event_kejuaraan.trim();
        if (data.tanggal) payload.tanggal = data.tanggal;

        return await PrestasiRepository.update(id, payload);
    },

    /**
     * Menghapus prestasi berdasarkan ID.
     * @param id ID Prestasi
     */
    async delete(id: string) {
        return await PrestasiRepository.delete(id);
    }
};

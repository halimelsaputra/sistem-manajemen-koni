import { PrestasiRepository } from "@/repositories/prestasi.repository";
import { ValidationError } from "@/lib/errors";

export const PrestasiService = {
    /**
     * Mendapatkan semua data prestasi dengan filter opsional.
     * @param filters Objek filter { atlet_id, tingkat_lomba, mendali, tahun, search }
     */
    async getAll(filters?: { atlet_id?: string; tingkat_lomba?: string; mendali?: string; tahun?: string; search?: string }) {
        return await PrestasiRepository.findAll(filters);
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
        tahun: number;
        tingkat_lomba: "Daerah" | "Nasional" | "Internasional";
        mendali: "Emas" | "Perak" | "Perunggu" | "Tanpa Medali";
    }) {
        // Validasi parameter wajib
        if (!data.atlet_id || !data.event_kejuaraan || !data.tahun || !data.tingkat_lomba || !data.mendali) {
            throw new ValidationError("Semua field (atlet_id, event_kejuaraan, tahun, tingkat_lomba, mendali) wajib diisi.");
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
            tahun: Number(data.tahun),
            tingkat_lomba: data.tingkat_lomba,
            mendali: data.mendali
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
            tahun: number;
            tingkat_lomba: "Daerah" | "Nasional" | "Internasional";
            mendali: "Emas" | "Perak" | "Perunggu" | "Tanpa Medali";
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
        if (data.tahun) payload.tahun = Number(data.tahun);

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

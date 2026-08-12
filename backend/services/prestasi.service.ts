import { PrestasiRepository } from "@/repositories/prestasi.repository";
import { AtletRepository } from "@/repositories/atlet.repository";
import { CabangCaborRepository } from "@/repositories/cabang-cabor.repository";
import { ValidationError } from "@/lib/errors";
import type { Pagination } from "@/lib/pagination";

/**
 * Memastikan kombinasi lengkap prestasi (atlet + event + tanggal + tingkat + medali + cabang)
 * belum pernah dicatat untuk atlet yang sama.
 */
async function ensurePrestasiUnik(
    p: {
        atlet_id: number;
        event_kejuaraan: string;
        tanggal: string;
        tingkat_lomba: string;
        mendali: string;
        cabang_cabor_id?: number | null;
    },
    excludeId?: string
) {
    const all = (await PrestasiRepository.findAll({ atlet_id: String(p.atlet_id) })) as any[];
    const event = p.event_kejuaraan.trim().toLowerCase();
    const dup = (all ?? []).find(
        x =>
            String(x.atlet_id) === String(p.atlet_id) &&
            String(x.event_kejuaraan || "").trim().toLowerCase() === event &&
            String(x.tanggal || "") === String(p.tanggal || "") &&
            String(x.tingkat_lomba || "") === String(p.tingkat_lomba || "") &&
            String(x.mendali || "") === String(p.mendali || "") &&
            String(x.cabang_cabor_id ?? "") === String(p.cabang_cabor_id ?? "") &&
            String(x.id) !== String(excludeId)
    );
    if (dup) {
        throw new ValidationError("Prestasi dengan data yang sama sudah tercatat untuk atlet ini.");
    }
}

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

        // Jika cabor atlet memiliki cabang → cabang cabor WAJIB diisi
        const atlet = await AtletRepository.findById(String(data.atlet_id));
        if (atlet?.cabor_id != null) {
            const cabangs = await CabangCaborRepository.findAll(String(atlet.cabor_id));
            if (cabangs && cabangs.length > 0 && !data.cabang_cabor_id) {
                throw new ValidationError("Cabor atlet memiliki cabang — cabang cabor wajib diisi.");
            }
        }

        // Cegah duplikat (kombinasi lengkap sama)
        await ensurePrestasiUnik({
            atlet_id: data.atlet_id,
            event_kejuaraan: data.event_kejuaraan.trim(),
            tanggal: data.tanggal,
            tingkat_lomba: data.tingkat_lomba,
            mendali: data.mendali,
            cabang_cabor_id: data.cabang_cabor_id ?? null
        });

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

        // Nilai efektif = payload ?? nilai existing — partial update yang TIDAK mengirim
        // cabang_cabor_id tidak boleh ditolak hanya karena field-nya absen.
        const existingPrestasi = await PrestasiRepository.findById(id);
        const effective: any = {
            atlet_id: data.atlet_id ?? existingPrestasi?.atlet_id,
            event_kejuaraan: data.event_kejuaraan ?? existingPrestasi?.event_kejuaraan,
            tanggal: data.tanggal ?? existingPrestasi?.tanggal,
            tingkat_lomba: data.tingkat_lomba ?? existingPrestasi?.tingkat_lomba,
            mendali: data.mendali ?? existingPrestasi?.mendali,
            cabang_cabor_id: data.cabang_cabor_id === undefined
                ? (existingPrestasi?.cabang_cabor_id ?? null)
                : data.cabang_cabor_id,
        };

        // Jika cabor atlet memiliki cabang → cabang cabor WAJIB
        if (!effective.cabang_cabor_id) {
            const atlet = effective.atlet_id != null ? await AtletRepository.findById(String(effective.atlet_id)) : null;
            if (atlet?.cabor_id != null) {
                const cabangs = await CabangCaborRepository.findAll(String(atlet.cabor_id));
                if (cabangs && cabangs.length > 0) {
                    throw new ValidationError("Cabor atlet memiliki cabang — cabang cabor wajib diisi.");
                }
            }
        }

        // Cegah duplikat (kombinasi lengkap sama)
        if (effective.atlet_id && effective.event_kejuaraan && effective.tanggal && effective.tingkat_lomba && effective.mendali) {
            await ensurePrestasiUnik(effective, id);
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

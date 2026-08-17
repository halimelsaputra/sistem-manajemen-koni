import { KepengurusanKabupatenRepository } from "@/repositories/kepengurusan-kabupaten.repository";
import { ValidationError } from "@/lib/errors";
import type { Pagination } from "@/lib/pagination";

/**
 * Service data kepengurusan kabupaten/kota (KONI Kabupaten/Kota se-Aceh).
 * Validasi + logika bisnis (auto-deaktivasi pengurus lama saat SK baru Aktif).
 */
export const KepengurusanKabupatenService = {
    /**
     * Mendapatkan data kepengurusan kabupaten dengan filter opsional dan pagination opsional.
     * @param filters Objek filter { kabupaten_kota, status_kepengurusan, search }
     * @param pagination Opsional { page, pageSize } — jika diisi, hasil { items, total }.
     */
    async getAll(
        filters?: { kabupaten_kota?: string; status_kepengurusan?: string; search?: string },
        pagination?: Pagination
    ) {
        return await KepengurusanKabupatenRepository.findAll(filters, pagination);
    },

    /**
     * Mendapatkan data kepengurusan kabupaten berdasarkan ID.
     * @param id ID Kepengurusan Kabupaten
     */
    async getById(id: string) {
        return await KepengurusanKabupatenRepository.findById(id);
    },

    /**
     * Membuat data kepengurusan kabupaten baru.
     * @param data Payload data kepengurusan kabupaten
     */
    async create(data: {
        kabupaten_kota: string;
        masa_bakti: string;
        nomor_sk: string;
        tanggal_sk: string;
        ketua_umum: string;
        ketua_harian?: string;
        sekretaris: string;
        file_path_sk?: string;
        status_kepengurusan?: "Aktif" | "Berakhir";
    }) {
        // Validasi field wajib
        if (!data.kabupaten_kota || !data.masa_bakti || !data.nomor_sk || !data.tanggal_sk || !data.ketua_umum || !data.sekretaris) {
            throw new ValidationError("Field kabupaten_kota, masa_bakti, nomor_sk, tanggal_sk, ketua_umum, dan sekretaris wajib diisi.");
        }

        // Validasi status_kepengurusan
        if (data.status_kepengurusan) {
            const validStatus = ["Aktif", "Berakhir"];
            if (!validStatus.includes(data.status_kepengurusan)) {
                throw new ValidationError("status_kepengurusan tidak valid. Harus salah satu dari: Aktif, Berakhir.");
            }
        }

        const newKepengurusan = await KepengurusanKabupatenRepository.create({
            kabupaten_kota: data.kabupaten_kota.trim(),
            masa_bakti: data.masa_bakti.trim(),
            nomor_sk: data.nomor_sk.trim(),
            tanggal_sk: data.tanggal_sk,
            ketua_umum: data.ketua_umum.trim(),
            ketua_harian: data.ketua_harian?.trim(),
            sekretaris: data.sekretaris.trim(),
            file_path_sk: data.file_path_sk?.trim(),
            status_kepengurusan: data.status_kepengurusan || "Aktif"
        });

        // Auto-mutasi: jika SK baru berstatus Aktif, matikan SK lama (masih Aktif)
        // pada kabupaten yang sama agar hanya pengurus terbaru yang aktif.
        if ((data.status_kepengurusan ?? "Aktif") === "Aktif" && newKepengurusan?.id) {
            try {
                await KepengurusanKabupatenRepository.deactivateOthers(data.kabupaten_kota.trim(), newKepengurusan.id);
            } catch (err) {
                // SK utama sudah tersimpan; kegagalan deaktivasi jangan sampai
                // dianggap gagal total (klien bisa retry dan membuat duplikasi).
                console.error("SK kabupaten baru tersimpan, tapi gagal mematikan SK lama:", err);
            }
        }

        return newKepengurusan;
    },

    /**
     * Memperbarui data kepengurusan kabupaten berdasarkan ID.
     * @param id ID Kepengurusan Kabupaten
     * @param data Payload update
     */
    async update(
        id: string,
        data: Partial<{
            kabupaten_kota: string;
            masa_bakti: string;
            nomor_sk: string;
            tanggal_sk: string;
            ketua_umum: string;
            ketua_harian: string;
            sekretaris: string;
            file_path_sk: string;
            status_kepengurusan: "Aktif" | "Berakhir";
        }>
    ) {
        // Validasi status_kepengurusan jika dikirimkan
        if (data.status_kepengurusan) {
            const validStatus = ["Aktif", "Berakhir"];
            if (!validStatus.includes(data.status_kepengurusan)) {
                throw new ValidationError("status_kepengurusan tidak valid. Harus salah satu dari: Aktif, Berakhir.");
            }
        }

        const payload: any = { ...data };
        if (data.kabupaten_kota) payload.kabupaten_kota = data.kabupaten_kota.trim();
        if (data.masa_bakti) payload.masa_bakti = data.masa_bakti.trim();
        if (data.nomor_sk) payload.nomor_sk = data.nomor_sk.trim();
        if (data.ketua_umum) payload.ketua_umum = data.ketua_umum.trim();
        if (data.ketua_harian) payload.ketua_harian = data.ketua_harian.trim();
        if (data.sekretaris) payload.sekretaris = data.sekretaris.trim();
        if (data.file_path_sk) payload.file_path_sk = data.file_path_sk.trim();

        const updated = await KepengurusanKabupatenRepository.update(id, payload);

        // Konsistensi di jalur update: jika SK ini di-set menjadi "Aktif",
        // matikan SK Aktif lain pada kabupaten yang sama (kecuali dirinya sendiri)
        // agar tidak ada dua pengurus aktif sekaligus.
        if (payload.status_kepengurusan === "Aktif" && updated?.kabupaten_kota != null) {
            try {
                await KepengurusanKabupatenRepository.deactivateOthers(updated.kabupaten_kota, Number(id));
            } catch (err) {
                console.error("Gagal mematikan SK lain saat update menjadi Aktif (kabupaten):", err);
            }
        }

        return updated;
    },

    /**
     * Menghapus data kepengurusan kabupaten berdasarkan ID.
     * @param id ID Kepengurusan Kabupaten
     */
    async delete(id: string) {
        return await KepengurusanKabupatenRepository.delete(id);
    }
};

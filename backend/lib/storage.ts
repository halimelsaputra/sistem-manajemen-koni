import { supabase } from "@/lib/supabase";

const BUCKET = "sk-documents";

/**
 * Menghapus file dari bucket storage (best-effort).
 * Dipanggil saat data terkait dihapus agar berkas tidak menjadi yatim.
 * Kegagalan penghapusan file TIDAK menggagalkan penghapusan data utama —
 * file tersisa hanya "sampah" yang bisa dibersihkan manual dari dashboard storage.
 * @param path Path file di storage (mis. "sk/uuid.pdf" atau "foto/uuid.jpg"), atau null/kosong → no-op.
 * @param bucket Nama bucket storage (default `sk-documents`).
 */
export async function removeStorageFile(path?: string | null, bucket: string = BUCKET) {
    if (!path) return;
    try {
        // supabase-js storage.remove() TIDAK melempar — error dikembalikan di objek hasil
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) {
            console.error("Gagal menghapus file dari storage (diabaikan):", error.message);
        }
    } catch (err) {
        console.error("Gagal menghapus file dari storage (diabaikan):", err);
    }
}

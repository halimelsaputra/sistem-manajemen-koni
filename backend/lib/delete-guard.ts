/**
 * Validasi frasa konfirmasi hapus permanen di sisi SERVER.
 *
 * Frontend mewajibkan user mengetik frasa persis (mis. "hapus cabor Basket")
 * sebelum mengirim DELETE. Namun agar ini benar-benar menjadi pengaman
 * (bukan sekadar anti salah-klik), backend menghitung ulang frasa yang
 * diharapkan dari data asli di database, lalu mencocokkannya dengan
 * `confirmText` yang dikirim klien. Mismatch → ditolak 400.
 *
 * @param confirmText Nilai `confirmText` dari klien (body/query).
 * @param expectedPhrase Frasa yang dihitung server dari data DB (mis. `hapus cabor Basket`).
 * @returns null jika valid, atau pesan error jika tidak valid.
 */
export function validateConfirmPhrase(
    confirmText: unknown,
    expectedPhrase: string
): string | null {
    if (typeof confirmText !== "string" || confirmText.trim() === "") {
        return "Field confirmText wajib dikirim untuk menghapus data.";
    }

    if (confirmText.trim().toLowerCase() !== expectedPhrase.trim().toLowerCase()) {
        return "Teks konfirmasi tidak sesuai. Ketik frasa persis seperti yang ditampilkan.";
    }

    return null;
}

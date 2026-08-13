import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession, unauthorizedResponse } from "@/lib/auth";

/**
 * Endpoint GET /api/auth/me
 * Mengembalikan informasi pengguna yang sedang login (dari token sesi).
 * Dipakai frontend untuk menampilkan peran/wilayah & menyembunyikan menu yang tidak diizinkan.
 *
 * Untuk admin wilayah, sesi divalidasi ulang terhadap tabel `admin_users`
 * (akun yang sudah dihapus super admin langsung kehilangan akses, walau token belum kedaluwarsa).
 */
export async function GET(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        // Super admin: sesi dari env, tidak perlu cek DB.
        if (session.role === "superadmin") {
            return NextResponse.json({
                status: "success",
                message: "data pengguna berhasil diambil",
                data: session,
            });
        }

        // Admin wilayah: pastikan akun masih ada & wilayahnya masih sesuai.
        const { data: admin, error } = await supabase
            .from("admin_users")
            .select("id, username, role, kabupaten_kota")
            .eq("id", session.uid)
            .maybeSingle();

        if (error) {
            console.error("Gagal validasi akun admin saat /me:", error.message);
            return unauthorizedResponse();
        }
        if (!admin || admin.role !== "admin_wilayah") {
            return unauthorizedResponse();
        }

        return NextResponse.json({
            status: "success",
            message: "data pengguna berhasil diambil",
            data: {
                uid: String(admin.id),
                username: admin.username,
                role: "admin_wilayah",
                region: admin.kabupaten_kota || null,
            },
        });
    } catch (error: any) {
        console.error("Gagal mengambil data pengguna:", error);
        return NextResponse.json(
            { status: "error", message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

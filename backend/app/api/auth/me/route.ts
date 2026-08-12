import { NextResponse } from "next/server";
import { getSession, unauthorizedResponse } from "@/lib/auth";

/**
 * Endpoint GET /api/auth/me
 * Mengembalikan informasi pengguna yang sedang login (dari token sesi).
 * Dipakai frontend untuk menampilkan peran/wilayah & menyembunyikan menu yang tidak diizinkan.
 */
export async function GET(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        return NextResponse.json({
            status: "success",
            message: "data pengguna berhasil diambil",
            data: session,
        });
    } catch (error: any) {
        console.error("Gagal mengambil data pengguna:", error);
        return NextResponse.json(
            { status: "error", message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Endpoint PUT /api/auth/password
 * Mengubah kata sandi akun sendiri (wajib konfirmasi kata sandi saat ini).
 * Hanya berlaku untuk pengguna pada tabel `admin_users` (admin wilayah).
 * Super admin dikelola lewat env ADMIN_USERNAME / ADMIN_PASSWORD, bukan endpoint ini.
 *
 * Request Body: { current_password: string, new_password: string }
 */
export async function PUT(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        if (session.role === "superadmin") {
            return forbiddenResponse(
                "Akun super admin dikelola melalui konfigurasi server (env), bukan melalui menu ini."
            );
        }

        const { current_password, new_password } = await req.json();
        if (!current_password || !new_password) {
            return NextResponse.json(
                { status: "fail", message: "Kata sandi saat ini dan kata sandi baru wajib diisi." },
                { status: 400 }
            );
        }
        if (String(new_password).length < 6) {
            return NextResponse.json(
                { status: "fail", message: "Kata sandi baru minimal 6 karakter." },
                { status: 400 }
            );
        }

        // Ambil hash tersimpan untuk verifikasi kata sandi saat ini
        const { data, error } = await supabase
            .from("admin_users")
            .select("password_hash")
            .eq("id", session.uid)
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            return NextResponse.json(
                { status: "fail", message: "Akun tidak ditemukan." },
                { status: 404 }
            );
        }

        const valid = await verifyPassword(current_password, data.password_hash);
        if (!valid) {
            return NextResponse.json(
                { status: "fail", message: "Kata sandi saat ini salah." },
                { status: 401 }
            );
        }

        const newHash = await hashPassword(new_password);
        const { error: updateError } = await supabase
            .from("admin_users")
            .update({ password_hash: newHash, updated_at: new Date().toISOString() })
            .eq("id", session.uid);

        if (updateError) throw updateError;

        return NextResponse.json({
            status: "success",
            message: "Kata sandi berhasil diubah.",
        });
    } catch (error: any) {
        console.error("Gagal mengubah kata sandi:", error);
        return NextResponse.json(
            { status: "error", message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

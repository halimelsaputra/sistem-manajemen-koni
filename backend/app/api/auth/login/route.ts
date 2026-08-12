import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
    signSessionToken,
    COOKIE_NAME,
    COOKIE_MAX_AGE,
    type SessionUser,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

/**
 * Endpoint POST /api/auth/login
 * Memverifikasi kredensial lalu membuat token sesi bertanda tangan.
 *
 * 1. Super admin → dicek terhadap env ADMIN_USERNAME / ADMIN_PASSWORD (backward compatible).
 * 2. Admin wilayah → dicek terhadap tabel `admin_users` di Supabase (migrasi 010).
 *
 * Response: { status, message, data: { uid, username, role, region } } + cookie auth_token.
 */
export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { status: "fail", message: "Username dan kata sandi wajib diisi." },
                { status: 400 }
            );
        }

        let user: SessionUser | null = null;

        // 1) Super admin (kredensial env)
        const envUser = process.env.ADMIN_USERNAME || "admin";
        const envPass = process.env.ADMIN_PASSWORD || "password123";
        if (username === envUser && password === envPass) {
            user = { uid: "superadmin", username: envUser, role: "superadmin", region: null };
        } else {
            // 2) Admin wilayah (tabel admin_users)
            // Jika tabel belum ada (migrasi 010 belum dijalankan) atau query gagal,
            // perlakukan sebagai "tidak ada pengguna" → 401 (jangan bocorkan detail error).
            const { data, error } = await supabase
                .from("admin_users")
                .select("id, username, password_hash, role, kabupaten_kota")
                .eq("username", username)
                .maybeSingle();

            if (error) {
                console.error("Gagal query admin_users saat login:", error.message);
            } else if (data && (await verifyPassword(password, data.password_hash))) {
                user = {
                    uid: String(data.id),
                    username: data.username,
                    role: data.role === "superadmin" ? "superadmin" : "admin_wilayah",
                    region: data.kabupaten_kota || null,
                };
            }
        }

        if (!user) {
            return NextResponse.json(
                { status: "fail", message: "Username atau kata sandi salah." },
                { status: 401 }
            );
        }

        const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
        const token = await signSessionToken({ ...user, exp });

        const res = NextResponse.json({
            status: "success",
            message: "Login berhasil",
            data: user,
        });
        res.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: COOKIE_MAX_AGE,
            path: "/",
        });
        return res;
    } catch (error: any) {
        console.error("Gagal login:", error);
        return NextResponse.json(
            { status: "error", message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

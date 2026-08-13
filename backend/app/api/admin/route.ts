import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

/**
 * Endpoint /api/admin — khusus super admin.
 *
 * GET  → daftar semua akun admin (tanpa password_hash).
 * POST → tambah admin wilayah baru { username, password, kabupaten_kota }.
 */
export async function GET(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola akun admin.");
        }

        const { data, error } = await supabase
            .from("admin_users")
            .select("id, username, role, kabupaten_kota, created_at, updated_at")
            .order("username", { ascending: true });

        if (error) throw error;

        return NextResponse.json({
            status: "success",
            message: "Daftar admin berhasil diambil.",
            data: data ?? [],
        });
    } catch (error: any) {
        console.error("Gagal mengambil daftar admin:", error);
        return NextResponse.json(
            { status: "error", message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola akun admin.");
        }

        const { username, password, kabupaten_kota } = await req.json();

        if (!username || !String(username).trim()) {
            return NextResponse.json(
                { status: "fail", message: "Username wajib diisi." },
                { status: 400 }
            );
        }
        if (!password || String(password).length < 6) {
            return NextResponse.json(
                { status: "fail", message: "Kata sandi minimal 6 karakter." },
                { status: 400 }
            );
        }
        if (!kabupaten_kota || !String(kabupaten_kota).trim()) {
            return NextResponse.json(
                { status: "fail", message: "Wilayah wajib dipilih." },
                { status: 400 }
            );
        }

        const cleanUsername = String(username).trim();
        const cleanRegion = String(kabupaten_kota).trim();

        // Username tidak boleh sama dengan akun super admin env
        const envUser = process.env.ADMIN_USERNAME || "admin";
        if (cleanUsername.toLowerCase() === envUser.toLowerCase()) {
            return NextResponse.json(
                { status: "fail", message: "Username sudah digunakan." },
                { status: 400 }
            );
        }

        // Cek username unik
        const { data: existing } = await supabase
            .from("admin_users")
            .select("id")
            .eq("username", cleanUsername)
            .maybeSingle();
        if (existing) {
            return NextResponse.json(
                { status: "fail", message: "Username sudah digunakan." },
                { status: 400 }
            );
        }

        // Satu wilayah = satu admin (wilayah tidak boleh dipegang dua admin)
        const { data: regionTaken } = await supabase
            .from("admin_users")
            .select("id, username")
            .eq("kabupaten_kota", cleanRegion)
            .maybeSingle();
        if (regionTaken) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: `Wilayah ${cleanRegion} sudah dikelola oleh akun ${regionTaken.username}.`,
                },
                { status: 400 }
            );
        }

        const passwordHash = await hashPassword(String(password));

        const { data, error } = await supabase
            .from("admin_users")
            .insert({
                username: cleanUsername,
                password_hash: passwordHash,
                role: "admin_wilayah",
                kabupaten_kota: cleanRegion,
            })
            .select("id, username, role, kabupaten_kota, created_at, updated_at")
            .single();

        if (error) throw error;

        return NextResponse.json({
            status: "success",
            message: `Admin ${cleanUsername} berhasil ditambahkan.`,
            data,
        });
    } catch (error: any) {
        console.error("Gagal menambahkan admin:", error);
        return NextResponse.json(
            { status: "error", message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

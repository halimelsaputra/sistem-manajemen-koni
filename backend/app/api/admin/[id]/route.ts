import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

/**
 * Endpoint /api/admin/[id] — khusus super admin.
 *
 * PUT    → ubah kata sandi dan/atau wilayah admin { password?, kabupaten_kota? }.
 * DELETE → hapus akun admin.
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola akun admin.");
        }

        const { id } = await params;
        const { data: admin, error: fetchError } = await supabase
            .from("admin_users")
            .select("id, username, role, kabupaten_kota")
            .eq("id", id)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!admin) {
            return NextResponse.json(
                { status: "fail", message: "Akun admin tidak ditemukan." },
                { status: 404 }
            );
        }
        if (admin.role === "superadmin") {
            return forbiddenResponse("Akun super admin tidak dapat diubah melalui endpoint ini.");
        }

        const { username, password, kabupaten_kota } = await req.json();
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        // Username boleh diubah (opsional — kosongkan = tidak diubah)
        if (username !== undefined && username !== null && String(username).trim() !== "") {
            const cleanUsername = String(username).trim();

            // Tidak boleh sama dengan akun super admin env
            const envUser = process.env.ADMIN_USERNAME || "admin";
            if (cleanUsername.toLowerCase() === envUser.toLowerCase()) {
                return NextResponse.json(
                    { status: "fail", message: "Username sudah digunakan." },
                    { status: 400 }
                );
            }

            // Tidak boleh duplikat dengan admin lain (kecuali dirinya sendiri)
            const { data: existing } = await supabase
                .from("admin_users")
                .select("id")
                .eq("username", cleanUsername)
                .neq("id", id)
                .maybeSingle();
            if (existing) {
                return NextResponse.json(
                    { status: "fail", message: "Username sudah digunakan." },
                    { status: 400 }
                );
            }

            updates.username = cleanUsername;
        }

        if (password !== undefined && password !== null && String(password) !== "") {
            if (String(password).length < 6) {
                return NextResponse.json(
                    { status: "fail", message: "Kata sandi minimal 6 karakter." },
                    { status: 400 }
                );
            }
            updates.password_hash = await hashPassword(String(password));
        }

        if (kabupaten_kota !== undefined && kabupaten_kota !== null && String(kabupaten_kota).trim() !== "") {
            const newRegion = String(kabupaten_kota).trim();

            // Wilayah tidak boleh dipegang admin lain
            const { data: regionTaken } = await supabase
                .from("admin_users")
                .select("id, username")
                .eq("kabupaten_kota", newRegion)
                .neq("id", id)
                .maybeSingle();
            if (regionTaken) {
                return NextResponse.json(
                    {
                        status: "fail",
                        message: `Wilayah ${newRegion} sudah dikelola oleh akun ${regionTaken.username}.`,
                    },
                    { status: 400 }
                );
            }

            updates.kabupaten_kota = newRegion;
        }

        const { data, error } = await supabase
            .from("admin_users")
            .update(updates)
            .eq("id", id)
            .select("id, username, role, kabupaten_kota, created_at, updated_at")
            .single();

        if (error) throw error;

        return NextResponse.json({
            status: "success",
            message: `Akun ${admin.username} berhasil diperbarui.`,
            data,
        });
    } catch (error: any) {
        console.error("Gagal memperbarui admin:", error);
        return NextResponse.json(
            { status: "error", message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola akun admin.");
        }

        const { id } = await params;
        const { data: admin, error: fetchError } = await supabase
            .from("admin_users")
            .select("id, username, role")
            .eq("id", id)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!admin) {
            return NextResponse.json(
                { status: "fail", message: "Akun admin tidak ditemukan." },
                { status: 404 }
            );
        }
        if (admin.role === "superadmin") {
            return forbiddenResponse("Akun super admin tidak dapat dihapus.");
        }

        const { error } = await supabase.from("admin_users").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({
            status: "success",
            message: `Akun ${admin.username} berhasil dihapus.`,
        });
    } catch (error: any) {
        console.error("Gagal menghapus admin:", error);
        return NextResponse.json(
            { status: "error", message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

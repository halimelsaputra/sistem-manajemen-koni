import { NextResponse } from "next/server";
import { KepengurusanKabupatenService } from "@/services/kepengurusan-kabupaten.service";
import { supabase } from "@/lib/supabase";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

const BUCKET = "sk-documents";
const TTL_SECONDS = 300; // 5 menit — PRD: Secure Signed URL kedaluwarsa otomatis

/**
 * Endpoint GET /api/kepengurusan-kabupaten/[id]/download
 * Menghasilkan Secure Signed URL (TTL 5 menit) untuk dokumen PDF SK kabupaten
 * lalu mengarahkan (redirect) ke URL tersebut.
 *
 * Catatan: URL hasil generate BUKAN tautan statis — kedaluwarsa otomatis
 * setelah 5 menit sesuai PRD Non-Functional Security.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengunduh dokumen SK kabupaten.");
        }

        const { id } = await params;

        // Ambil data kepengurusan kabupaten untuk mendapatkan path file di storage
        let kepengurusan: any;
        try {
            kepengurusan = await KepengurusanKabupatenService.getById(id);
        } catch (err: any) {
            if (err?.code === "PGRST116") {
                return NextResponse.json(
                    { status: "fail", message: "data kepengurusan kabupaten tidak ditemukan" },
                    { status: 404 }
                );
            }
            throw err;
        }

        if (!kepengurusan?.file_path_sk) {
            return NextResponse.json(
                { status: "fail", message: "SK ini belum memiliki berkas dokumen." },
                { status: 404 }
            );
        }

        // Buat signed URL sementara (5 menit)
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(kepengurusan.file_path_sk, TTL_SECONDS);

        if (error || !data?.signedUrl) {
            console.error("Gagal membuat signed URL:", error?.message || "URL kosong");
            return NextResponse.json(
                {
                    status: "error",
                    message: "gagal membuat tautan unduhan",
                    error: error?.message || "signed url kosong",
                },
                { status: 500 }
            );
        }

        return NextResponse.redirect(data.signedUrl);
    } catch (error: any) {
        console.error("Gagal mengunduh dokumen SK kabupaten:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengunduh dokumen",
                error: error.message || error,
            },
            { status: 500 }
        );
    }
}

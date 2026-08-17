import { NextResponse } from "next/server";
import { AtletService } from "@/services/atlet.service";
import { supabase } from "@/lib/supabase";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

const BUCKET = "atlet-photos";
const TTL_SECONDS = 300; // 5 menit — signed URL kedaluwarsa otomatis

/**
 * Endpoint GET /api/atlet/[id]/foto
 * Menghasilkan Secure Signed URL (TTL 5 menit) untuk foto atlet
 * lalu mengarahkan (redirect) ke URL tersebut.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        const { id } = await params;

        const atlet = await AtletService.getById(id);
        if (!atlet) {
            return NextResponse.json(
                { status: "fail", message: "data atlet tidak ditemukan" },
                { status: 404 }
            );
        }

        // Admin wilayah: hanya boleh melihat foto atlet di wilayahnya sendiri
        if (session.role === "admin_wilayah" && atlet.kabupaten_kota !== session.region) {
            return forbiddenResponse();
        }

        if (!atlet.foto_url) {
            return NextResponse.json(
                { status: "fail", message: "Atlet ini belum memiliki foto." },
                { status: 404 }
            );
        }

        const { data, error } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(atlet.foto_url, TTL_SECONDS);

        if (error || !data?.signedUrl) {
            console.error("Gagal membuat signed URL foto:", error?.message || "URL kosong");
            return NextResponse.json(
                {
                    status: "error",
                    message: "gagal membuat tautan foto",
                    error: error?.message || "signed url kosong",
                },
                { status: 500 }
            );
        }

        return NextResponse.redirect(data.signedUrl);
    } catch (error: any) {
        console.error("Gagal mengambil foto atlet:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengambil foto atlet",
                error: error.message || error,
            },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { CabangCaborService } from "@/services/cabang-cabor.service";
import { CabangCaborRepository } from "@/repositories/cabang-cabor.repository";

/**
 * Endpoint DELETE /api/cabor/[id]/cabang/[cabangId]
 * Menghapus cabang cabor tertentu. Prestasi yang mereferensikannya
 * otomatis di-set null (FK on delete set null).
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; cabangId: string }> }
) {
    try {
        const { id, cabangId } = await params;

        // Pastikan cabang yang dihapus benar-benar milik cabor pada URL
        // (mencegah penghapusan silang antar cabor).
        const existing = await CabangCaborRepository.findById(cabangId);
        if (!existing || String(existing.cabor_id) !== id) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data cabang cabor tidak ditemukan untuk cabor ini"
                },
                { status: 404 }
            );
        }

        const result = await CabangCaborService.delete(cabangId);

        if (!result) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data cabang cabor tidak ditemukan"
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "data cabang cabor berhasil dihapus",
                data: result
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal menghapus data cabang cabor:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menghapus data cabang cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

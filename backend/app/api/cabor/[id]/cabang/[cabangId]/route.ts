import { NextResponse } from "next/server";
import { CabangCaborService } from "@/services/cabang-cabor.service";
import { CabangCaborRepository } from "@/repositories/cabang-cabor.repository";
import { ValidationError } from "@/lib/errors";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

/**
 * Endpoint PUT /api/cabor/[id]/cabang/[cabangId]
 * Memperbarui nama cabang cabor tertentu.
 * Request Body: { nama_cabang: string }
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; cabangId: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola cabang cabor.");
        }

        const { id, cabangId } = await params;

        // Pastikan cabang yang diubah benar-benar milik cabor pada URL
        // (mencegah perubahan silang antar cabor).
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

        const body = await req.json();
        const updated = await CabangCaborService.update(cabangId, body);

        if (!updated) {
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
                message: "data cabang cabor berhasil diperbarui",
                data: updated
            },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof ValidationError) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: error.message
                },
                { status: 400 }
            );
        }
        console.error(`Gagal memperbarui data cabang cabor:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal memperbarui data cabang cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

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
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola cabang cabor.");
        }

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

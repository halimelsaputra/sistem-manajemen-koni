import { NextResponse } from "next/server";
import { KepengurusanService } from "@/services/kepengurusan.service";
import { ValidationError } from "@/lib/errors";
import { validateConfirmPhrase } from "@/lib/delete-guard";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

/**
 * Endpoint GET /api/kepengurusan/[id]
 * Mengambil detail data kepengurusan berdasarkan ID.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengakses arsip SK kepengurusan.");
        }

        const { id } = await params;
        const data = await KepengurusanService.getById(id);

        if (!data) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data kepengurusan tidak ditemukan"
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "data kepengurusan berhasil diambil",
                data: data
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal mendapatkan data kepengurusan dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mendapatkan data kepengurusan",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint PUT /api/kepengurusan/[id]
 * Memperbarui data kepengurusan tertentu berdasarkan ID.
 * Request Body: Partial<{ cabor_id: number, masa_bakti: string, nomor_sk: string, tanggal_sk: string, ketua_umum: string, ketua_harian: string, sekretaris: string, file_path_sk: string, status_kepengurusan: string }>
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola arsip SK kepengurusan.");
        }

        const { id } = await params;
        const body = await req.json();
        const updatedKepengurusan = await KepengurusanService.update(id, body);

        return NextResponse.json(
            {
                status: "success",
                message: "data kepengurusan berhasil diperbarui",
                data: updatedKepengurusan
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
        console.error(`Gagal memperbarui data kepengurusan dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal memperbarui data kepengurusan",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint DELETE /api/kepengurusan/[id]
 * Menghapus data kepengurusan tertentu beserta berkas PDF-nya di storage.
 * Wajib mengirim `confirmText` (frasa "hapus sk {nomor_sk}") yang divalidasi server.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola arsip SK kepengurusan.");
        }

        const { id } = await params;

        // Ambil data dulu untuk memvalidasi frasa konfirmasi (server-side guard)
        const existing = await KepengurusanService.getById(id);
        if (!existing) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data kepengurusan tidak ditemukan"
                },
                { status: 404 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const guardError = validateConfirmPhrase(body?.confirmText, `hapus sk ${existing.nomor_sk}`);
        if (guardError) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: guardError
                },
                { status: 400 }
            );
        }

        const result = await KepengurusanService.delete(id);

        if (!result) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data kepengurusan tidak ditemukan"
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "data kepengurusan berhasil dihapus",
                data: result
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal menghapus data kepengurusan dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menghapus data kepengurusan",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { AtletService } from "@/services/atlet.service";
import { ValidationError } from "@/lib/errors";
import { validateConfirmPhrase } from "@/lib/delete-guard";

/**
 * Endpoint GET /api/atlet/[id]
 * Mengambil detail data atlet tertentu berdasarkan ID.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await AtletService.getById(id);

        if (!data) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data atlet tidak ditemukan"
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "data berhasil diambil",
                data: data
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal mendapatkan data atlet dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mendapatkan data atlet",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint PUT /api/atlet/[id]
 * Memperbarui data atlet tertentu berdasarkan ID.
 * Request Body: Partial<{ nama_atlet: string, kabupaten_kota: string, cabor_id: number }>
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const updatedAtlet = await AtletService.update(id, body);

        return NextResponse.json(
            {
                status: "success",
                message: "data atlet berhasil diperbarui",
                data: updatedAtlet
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
        console.error(`Gagal memperbarui data atlet dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal memperbarui data atlet",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint DELETE /api/atlet/[id]
 * Menghapus data atlet beserta seluruh prestasi miliknya (cascade).
 * Wajib mengirim `confirmText` (frasa "hapus atlet {nama}") yang divalidasi server.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Ambil data dulu untuk memvalidasi frasa konfirmasi (server-side guard)
        const existing = await AtletService.getById(id);
        if (!existing) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data atlet tidak ditemukan"
                },
                { status: 404 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const guardError = validateConfirmPhrase(body?.confirmText, `hapus atlet ${existing.nama_atlet}`);
        if (guardError) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: guardError
                },
                { status: 400 }
            );
        }

        const result = await AtletService.delete(id);

        if (!result) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data atlet tidak ditemukan"
                },
                { status: 404 }
            );
        }

        const cascadePrestasi = result.cascade?.prestasi ?? 0;
        return NextResponse.json(
            {
                status: "success",
                message: cascadePrestasi > 0
                    ? `data atlet berhasil dihapus (beserta ${cascadePrestasi} prestasi terkait)`
                    : "data atlet berhasil dihapus",
                data: result
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal menghapus data atlet dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menghapus data atlet",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { PrestasiService } from "@/services/prestasi.service";
import { ValidationError } from "@/lib/errors";
import { validateConfirmPhrase } from "@/lib/delete-guard";

/**
 * Endpoint GET /api/prestasi/[id]
 * Mengambil detail data prestasi berdasarkan ID.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await PrestasiService.getById(id);

        if (!data) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data prestasi tidak ditemukan"
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "data prestasi berhasil diambil",
                data: data
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal mendapatkan data prestasi dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mendapatkan data prestasi",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint PUT /api/prestasi/[id]
 * Memperbarui data prestasi tertentu berdasarkan ID.
 * Request Body: Partial<{ atlet_id: number, event_kejuaraan: string, tanggal: string, tingkat_lomba: string, mendali: string }>
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const updatedPrestasi = await PrestasiService.update(id, body);

        return NextResponse.json(
            {
                status: "success",
                message: "data prestasi berhasil diperbarui",
                data: updatedPrestasi
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
        console.error(`Gagal memperbarui data prestasi dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal memperbarui data prestasi",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint DELETE /api/prestasi/[id]
 * Menghapus data prestasi tertentu berdasarkan ID.
 * Wajib mengirim `confirmText` (frasa "hapus prestasi {nama}") yang divalidasi server.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Ambil data dulu untuk memvalidasi frasa konfirmasi (server-side guard)
        const existing = await PrestasiService.getById(id);
        if (!existing) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data prestasi tidak ditemukan"
                },
                { status: 404 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const guardError = validateConfirmPhrase(body?.confirmText, `hapus prestasi ${existing.event_kejuaraan}`);
        if (guardError) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: guardError
                },
                { status: 400 }
            );
        }

        const result = await PrestasiService.delete(id);

        if (!result) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data prestasi tidak ditemukan"
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "data prestasi berhasil dihapus",
                data: result
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal menghapus data prestasi dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menghapus data prestasi",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

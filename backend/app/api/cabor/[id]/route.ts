import { NextResponse } from "next/server";
import { CaborService } from "@/services/cabor.service";
import { ValidationError } from "@/lib/errors";
import { validateConfirmPhrase } from "@/lib/delete-guard";

/**
 * Endpoint GET /api/cabor/[id]
 * Mengambil detail data cabang olahraga berdasarkan ID.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await CaborService.getById(id);

        if (!data) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data cabor tidak ditemukan"
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "data cabor berhasil diambil",
                data: data
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal mendapatkan data cabor dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mendapatkan data cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint PUT /api/cabor/[id]
 * Memperbarui data cabang olahraga tertentu berdasarkan ID.
 * Request Body: { nama_cabor: string }
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const updatedCabor = await CaborService.update(id, body);

        return NextResponse.json(
            {
                status: "success",
                message: "data cabor berhasil diperbarui",
                data: updatedCabor
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
        console.error(`Gagal memperbarui data cabor dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal memperbarui data cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint DELETE /api/cabor/[id]
 * Menghapus data cabang olahraga beserta seluruh data yang bergantung padanya
 * (kepengurusan/SK + file PDF, atlet, dan prestasi para atlet) — cascade.
 * Wajib mengirim `confirmText` (frasa "hapus cabor {nama}") yang divalidasi server.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Ambil data dulu untuk memvalidasi frasa konfirmasi (server-side guard)
        const existing = await CaborService.getById(id);
        if (!existing) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data cabor tidak ditemukan"
                },
                { status: 404 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const guardError = validateConfirmPhrase(body?.confirmText, `hapus cabor ${existing.nama_cabor}`);
        if (guardError) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: guardError
                },
                { status: 400 }
            );
        }

        const result = await CaborService.delete(id);

        if (!result) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data cabor tidak ditemukan"
                },
                { status: 404 }
            );
        }

        const { atlet, prestasi, kepengurusan } = result.cascade ?? {};
        const parts: string[] = [];
        if (kepengurusan) parts.push(`${kepengurusan} SK`);
        if (atlet) parts.push(`${atlet} atlet`);
        if (prestasi) parts.push(`${prestasi} prestasi`);

        return NextResponse.json(
            {
                status: "success",
                message: parts.length > 0
                    ? `data cabor berhasil dihapus (beserta ${parts.join(", ")} terkait)`
                    : "data cabor berhasil dihapus",
                data: result
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal menghapus data cabor dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menghapus data cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

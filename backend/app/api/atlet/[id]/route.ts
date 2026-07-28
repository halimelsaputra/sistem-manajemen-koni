import { NextResponse } from "next/server";
import { AtletService } from "@/services/atlet.service";

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
 * Menghapus data atlet tertentu berdasarkan ID.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await AtletService.delete(id);

        return NextResponse.json(
            {
                status: "success",
                message: "data atlet berhasil dihapus"
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

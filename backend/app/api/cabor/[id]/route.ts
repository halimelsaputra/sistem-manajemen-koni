import { NextResponse } from "next/server";
import { CaborService } from "@/services/cabor.service";

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
 * Menghapus data cabang olahraga tertentu berdasarkan ID.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await CaborService.delete(id);

        return NextResponse.json(
            {
                status: "success",
                message: "data cabor berhasil dihapus"
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

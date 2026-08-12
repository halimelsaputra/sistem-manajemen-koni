import { NextResponse } from "next/server";
import { CabangCaborService } from "@/services/cabang-cabor.service";
import { ValidationError } from "@/lib/errors";

/**
 * Endpoint POST /api/cabor/[id]/cabang
 * Menambahkan cabang cabor baru milik cabor tertentu.
 * Request Body: { nama_cabang: string }
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const newCabang = await CabangCaborService.create(id, body);

        return NextResponse.json(
            {
                status: "success",
                message: "data cabang cabor berhasil ditambahkan",
                data: newCabang
            },
            { status: 201 }
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
        console.error("Gagal menambahkan data cabang cabor:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menambahkan data cabang cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

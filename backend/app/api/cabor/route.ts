import { NextResponse } from "next/server";
import { CaborService } from "@/services/cabor.service";
import { ValidationError } from "@/lib/errors";

/**
 * Endpoint GET /api/cabor
 * Mengambil data cabang olahraga (cabor) dengan filter opsional (search).
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || undefined;

        const data = await CaborService.getAll({ search });

        return NextResponse.json(
            {
                status: "success",
                message: data && data.length > 0 ? "data cabor berhasil diambil" : "tidak menemukan data cabor",
                data: data ?? []
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Gagal mengambil data cabor:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengambil data cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint POST /api/cabor
 * Menambahkan data cabang olahraga baru.
 * Request Body: { nama_cabor: string }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newCabor = await CaborService.create(body);

        return NextResponse.json(
            {
                status: "success",
                message: "data cabor berhasil ditambahkan",
                data: newCabor
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
        console.error("Gagal menambahkan data cabor:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menambahkan data cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

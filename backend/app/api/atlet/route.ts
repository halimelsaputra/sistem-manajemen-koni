import { NextResponse } from "next/server";
import { AtletService } from "@/services/atlet.service";

/**
 * Endpoint GET /api/atlet
 * Mengambil data atlet dengan filter opsional (search, kabupaten_kota, cabor_id).
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || undefined;
        const kabupaten_kota = searchParams.get("kabupaten_kota") || undefined;
        const cabor_id = searchParams.get("cabor_id") || undefined;

        const data = await AtletService.getAll({ search, kabupaten_kota, cabor_id });

        if (!data || data.length === 0) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "tidak menemukan data atlet",
                    data: []
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
        console.error("Gagal mengambil data atlet:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengambil data atlet",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint POST /api/atlet
 * Menambahkan data atlet baru.
 * Request Body: { nama_atlet: string, kabupaten_kota: string, cabor_id: number }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newAtlet = await AtletService.create(body);

        return NextResponse.json(
            {
                status: "success",
                message: "data atlet berhasil ditambahkan",
                data: newAtlet
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Gagal menambahkan data atlet:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menambahkan data atlet",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

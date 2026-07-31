import { NextResponse } from "next/server";
import { KepengurusanService } from "@/services/kepengurusan.service";
import { ValidationError } from "@/lib/errors";

/**
 * Endpoint GET /api/kepengurusan
 * Mengambil data kepengurusan dengan filter opsional (cabor_id, status_kepengurusan, search).
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const cabor_id = searchParams.get("cabor_id") || undefined;
        const status_kepengurusan = searchParams.get("status_kepengurusan") || undefined;
        const search = searchParams.get("search") || undefined;

        const data = await KepengurusanService.getAll({ cabor_id, status_kepengurusan, search });

        return NextResponse.json(
            {
                status: "success",
                message: data && data.length > 0 ? "data kepengurusan berhasil diambil" : "tidak menemukan data kepengurusan",
                data: data ?? []
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Gagal mengambil data kepengurusan:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengambil data kepengurusan",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint POST /api/kepengurusan
 * Menambahkan data kepengurusan baru.
 * Request Body: { cabor_id: number, masa_bakti: string, nomor_sk: string, tanggal_sk: string, ketua_umum: string, ketua_harian?: string, sekretaris: string, file_path_sk?: string, status_kepengurusan?: string }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newKepengurusan = await KepengurusanService.create(body);

        return NextResponse.json(
            {
                status: "success",
                message: "data kepengurusan berhasil ditambahkan",
                data: newKepengurusan
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
        console.error("Gagal menambahkan data kepengurusan:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menambahkan data kepengurusan",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

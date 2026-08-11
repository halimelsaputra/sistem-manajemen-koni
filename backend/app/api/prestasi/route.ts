import { NextResponse } from "next/server";
import { PrestasiService } from "@/services/prestasi.service";
import { ValidationError } from "@/lib/errors";
import { parsePagination, toPaginatedData, isPaginatedResult } from "@/lib/pagination";

/**
 * Endpoint GET /api/prestasi
 * Mengambil data prestasi dengan filter opsional (atlet_id, tingkat_lomba, mendali, tanggal, search).
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const atlet_id = searchParams.get("atlet_id") || undefined;
        const tingkat_lomba = searchParams.get("tingkat_lomba") || undefined;
        const mendali = searchParams.get("mendali") || undefined;
        const tanggal = searchParams.get("tanggal") || undefined;
        const cabor_id = searchParams.get("cabor_id") || undefined;
        const kabupaten_kota = searchParams.get("kabupaten_kota") || undefined;
        const search = searchParams.get("search") || undefined;
        const pagination = parsePagination(searchParams);

        const result = await PrestasiService.getAll(
            { atlet_id, tingkat_lomba, mendali, tanggal, cabor_id, kabupaten_kota, search },
            pagination ?? undefined
        );

        // Mode paginated: { items, pagination: { page, pageSize, total, totalPages } }
        if (pagination) {
            const { items, total } = isPaginatedResult(result) ? result : { items: [], total: 0 };
            return NextResponse.json(
                {
                    status: "success",
                    message: items.length > 0 ? "data prestasi berhasil diambil" : "tidak menemukan data prestasi",
                    data: toPaginatedData(items, total, pagination)
                },
                { status: 200 }
            );
        }

        // Mode non-paginated (backward compatible): array penuh
        const data = Array.isArray(result) ? result : [];
        return NextResponse.json(
            {
                status: "success",
                message: data && data.length > 0 ? "data prestasi berhasil diambil" : "tidak menemukan data prestasi",
                data
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Gagal mengambil data prestasi:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengambil data prestasi",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint POST /api/prestasi
 * Menambahkan data prestasi baru.
 * Request Body: { atlet_id: number, event_kejuaraan: string, tanggal: string, tingkat_lomba: string, mendali: string }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newPrestasi = await PrestasiService.create(body);

        return NextResponse.json(
            {
                status: "success",
                message: "data prestasi berhasil ditambahkan",
                data: newPrestasi
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
        console.error("Gagal menambahkan data prestasi:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menambahkan data prestasi",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

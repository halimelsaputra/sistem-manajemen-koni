import { NextResponse } from "next/server";
import { KepengurusanKabupatenService } from "@/services/kepengurusan-kabupaten.service";
import { ValidationError } from "@/lib/errors";
import { parsePagination, toPaginatedData, isPaginatedResult } from "@/lib/pagination";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

/**
 * Endpoint GET /api/kepengurusan-kabupaten
 * Mengambil data kepengurusan kabupaten/kota dengan filter opsional
 * (kabupaten_kota, status_kepengurusan, search). Khusus super admin.
 */
export async function GET(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengakses arsip SK kepengurusan kabupaten.");
        }

        const { searchParams } = new URL(req.url);
        const kabupaten_kota = searchParams.get("kabupaten_kota") || undefined;
        const status_kepengurusan = searchParams.get("status_kepengurusan") || undefined;
        const search = searchParams.get("search") || undefined;
        const pagination = parsePagination(searchParams);

        const result = await KepengurusanKabupatenService.getAll(
            { kabupaten_kota, status_kepengurusan, search },
            pagination ?? undefined
        );

        // Mode paginated: { items, pagination: { page, pageSize, total, totalPages } }
        if (pagination) {
            const { items, total } = isPaginatedResult(result) ? result : { items: [], total: 0 };
            return NextResponse.json(
                {
                    status: "success",
                    message: items.length > 0 ? "data kepengurusan kabupaten berhasil diambil" : "tidak menemukan data kepengurusan kabupaten",
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
                message: data && data.length > 0 ? "data kepengurusan kabupaten berhasil diambil" : "tidak menemukan data kepengurusan kabupaten",
                data
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Gagal mengambil data kepengurusan kabupaten:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengambil data kepengurusan kabupaten",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint POST /api/kepengurusan-kabupaten
 * Menambahkan data kepengurusan kabupaten baru.
 * Request Body: { kabupaten_kota: string, nomor_sk: string, tanggal_sk: string, tanggal_berakhir?: string, ketua_umum: string, sekretaris: string, file_path_sk?: string, status_kepengurusan?: string }
 */
export async function POST(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola arsip SK kepengurusan kabupaten.");
        }

        const body = await req.json();
        const newKepengurusan = await KepengurusanKabupatenService.create(body);

        return NextResponse.json(
            {
                status: "success",
                message: "data kepengurusan kabupaten berhasil ditambahkan",
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
        console.error("Gagal menambahkan data kepengurusan kabupaten:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menambahkan data kepengurusan kabupaten",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

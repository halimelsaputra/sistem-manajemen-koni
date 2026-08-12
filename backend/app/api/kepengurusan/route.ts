import { NextResponse } from "next/server";
import { KepengurusanService } from "@/services/kepengurusan.service";
import { ValidationError } from "@/lib/errors";
import { parsePagination, toPaginatedData, isPaginatedResult } from "@/lib/pagination";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

/**
 * Endpoint GET /api/kepengurusan
 * Mengambil data kepengurusan dengan filter opsional (cabor_id, status_kepengurusan, search).
 * Arsip SK bersifat provinsi (per cabor) — khusus super admin.
 */
export async function GET(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengakses arsip SK kepengurusan.");
        }

        const { searchParams } = new URL(req.url);
        const cabor_id = searchParams.get("cabor_id") || undefined;
        const status_kepengurusan = searchParams.get("status_kepengurusan") || undefined;
        const search = searchParams.get("search") || undefined;
        const pagination = parsePagination(searchParams);

        const result = await KepengurusanService.getAll(
            { cabor_id, status_kepengurusan, search },
            pagination ?? undefined
        );

        // Mode paginated: { items, pagination: { page, pageSize, total, totalPages } }
        if (pagination) {
            const { items, total } = isPaginatedResult(result) ? result : { items: [], total: 0 };
            return NextResponse.json(
                {
                    status: "success",
                    message: items.length > 0 ? "data kepengurusan berhasil diambil" : "tidak menemukan data kepengurusan",
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
                message: data && data.length > 0 ? "data kepengurusan berhasil diambil" : "tidak menemukan data kepengurusan",
                data
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
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat mengelola arsip SK kepengurusan.");
        }

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

import { NextResponse } from "next/server";
import { CabangCaborService } from "@/services/cabang-cabor.service";
import { getSession, unauthorizedResponse } from "@/lib/auth";

/**
 * Endpoint GET /api/cabang-cabor
 * Mengambil semua data cabang cabor, opsional difilter per cabor (?cabor_id=).
 */
export async function GET(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        const { searchParams } = new URL(req.url);
        const caborId = searchParams.get("cabor_id") || undefined;

        const data = await CabangCaborService.getAll(caborId);

        return NextResponse.json(
            {
                status: "success",
                message: data && data.length > 0 ? "data cabang cabor berhasil diambil" : "tidak menemukan data cabang cabor",
                data: data ?? []
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Gagal mengambil data cabang cabor:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengambil data cabang cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

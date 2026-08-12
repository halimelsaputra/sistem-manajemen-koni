import { NextResponse } from "next/server";
import { AtletRepository } from "@/repositories/atlet.repository";
import { AtletService } from "@/services/atlet.service";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

/**
 * Endpoint GET /api/atlet/[id]/dependencies
 * Menampilkan jumlah data yang akan ikut terhapus (cascade) jika atlet ini dihapus.
 * Dipakai frontend untuk menampilkan peringatan dampak sebelum konfirmasi hapus.
 * Response: { prestasi: number }
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        const { id } = await params;

        // Admin wilayah hanya boleh menghitung dampak untuk atlet di wilayahnya sendiri
        if (session.role === "admin_wilayah") {
            const atlet = await AtletService.getById(id);
            if (!atlet || atlet.kabupaten_kota !== session.region) {
                return forbiddenResponse();
            }
        }
        const prestasi = await AtletRepository.countPrestasi(id);

        return NextResponse.json(
            {
                status: "success",
                message: "dependensi berhasil dihitung",
                data: { prestasi }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal menghitung dependensi atlet:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menghitung dependensi atlet",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

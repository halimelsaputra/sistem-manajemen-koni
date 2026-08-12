import { NextResponse } from "next/server";
import { CaborRepository } from "@/repositories/cabor.repository";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

/**
 * Endpoint GET /api/cabor/[id]/dependencies
 * Menampilkan jumlah data yang akan ikut terhapus (cascade) jika cabor ini dihapus.
 * Dipakai frontend untuk menampilkan peringatan dampak sebelum konfirmasi hapus.
 * Khusus super admin (cabor hanya dikelola pusat).
 * Response: { atlet, prestasi, kepengurusan }
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();
        if (session.role !== "superadmin") {
            return forbiddenResponse("Hanya super admin yang dapat melihat dampak penghapusan cabor.");
        }

        const { id } = await params;
        const dependencies = await CaborRepository.countDependencies(id);

        return NextResponse.json(
            {
                status: "success",
                message: "dependensi berhasil dihitung",
                data: dependencies
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal menghitung dependensi cabor:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menghitung dependensi cabor",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

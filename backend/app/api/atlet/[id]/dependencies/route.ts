import { NextResponse } from "next/server";
import { AtletRepository } from "@/repositories/atlet.repository";

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
        const { id } = await params;
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

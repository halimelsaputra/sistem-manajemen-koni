import { NextResponse } from "next/server";
import { DashboardService } from "@/services/dashboard.service";

/**
 * Endpoint GET /api/dashboard
 * Mengambil ringkasan data statistik untuk halaman dashboard (Total Atlet, Cabor, Prestasi, Kepengurusan, perolehan medali per wilayah, tren tahunan, dan peringatan SK kedaluwarsa).
 */
export async function GET() {
    try {
        const data = await DashboardService.getSummary();

        return NextResponse.json(
            {
                status: "success",
                message: "data dashboard berhasil diambil",
                data: data
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Gagal mengambil data dashboard:", error);
        return NextResponse.json(
            { 
                status: "error", 
                message: "gagal mengambil data dashboard", 
                error: error.message || error 
            }, 
            { status: 500 }
        );
    }
}
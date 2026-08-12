import { NextResponse } from "next/server";
import { DashboardService } from "@/services/dashboard.service";
import { getSession, unauthorizedResponse } from "@/lib/auth";

/**
 * Endpoint GET /api/dashboard
 * Mengambil ringkasan data statistik untuk halaman dashboard (Total Atlet, Cabor, Prestasi, Kepengurusan, perolehan medali per wilayah, tren tahunan, dan peringatan SK kedaluwarsa).
 * Admin wilayah hanya melihat statistik wilayahnya sendiri; statistik SK hanya untuk super admin.
 */
export async function GET(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        let region: string | undefined;
        if (session.role === "admin_wilayah") {
            region = session.region ?? undefined;
        }

        const data = await DashboardService.getSummary({
            region,
            includeKepengurusan: session.role === "superadmin"
        });

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
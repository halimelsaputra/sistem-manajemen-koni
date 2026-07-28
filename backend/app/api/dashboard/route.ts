import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Endpoint GET /api/dashboard
 * Mengambil ringkasan data statistik untuk halaman dashboard (Total Atlet, Cabor, Prestasi, Kepengurusan, dan perolehan medali per wilayah).
 */
export async function GET() {
    try {
        const [totalAtlet, totalCabor, totalPrestasi, totalKepengurusan, medalsByRegion] = await Promise.all([
            supabase.from("atlet").select("*", { count: "exact", head: true }),
            supabase.from("cabor").select("*", { count: "exact", head: true }),
            supabase.from("prestasi").select("*", { count: "exact", head: true }),
            supabase.from("kepengurusan").select("*", { count: "exact", head: true }),
            supabase.from("mv_medals_by_region").select("*")
        ]);

        const results = {
            status: "success",
            message: "data dashboard berhasil diambil",
            data: {
                totalAtlet: totalAtlet.count ?? 0,
                totalCabor: totalCabor.count ?? 0,
                totalPrestasi: totalPrestasi.count ?? 0,
                totalKepengurusan: totalKepengurusan.count ?? 0,
                medalsByRegion: medalsByRegion.data ?? []
            }
        };
        
        return NextResponse.json(results, { status: 200 });
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
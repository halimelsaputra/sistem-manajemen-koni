import {NextRequest, NextResponse} from "next/server";
import {supabase} from "@/lib/supabase";

export async function GET(){
    try{
        const [totalAtlet, totalCabor, totalPrestasi, totalKepengurusan] = await Promise.all([
        supabase.from("atlet").select("*", { count: "exact", head: true }),
        supabase.from("cabor").select("*", { count: "exact", head: true }),
        supabase.from("prestasi").select("*", { count: "exact", head: true }),
        supabase.from("kepengurusan").select("*", { count: "exact", head: true }),
    ]);

    const results = { totalAtlet, totalCabor, totalPrestasi, totalKepengurusan };
    return NextResponse.json(results);
    } 
        
    catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

/**
 * Endpoint POST /api/auth/logout
 * Menghapus cookie sesi.
 */
export async function POST() {
    const res = NextResponse.json({ status: "success", message: "Logout berhasil" });
    res.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/",
    });
    return res;
}

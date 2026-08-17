import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabase } from "@/lib/supabase";
import { getSession, unauthorizedResponse } from "@/lib/auth";

const BUCKET = "atlet-photos";
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIME: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};

/**
 * Endpoint POST /api/atlet/upload
 * Mengunggah foto atlet ke Supabase Storage (bucket privat `atlet-photos`).
 * Request: multipart/form-data dengan field `file` (File image, maks 2MB).
 * Response: { path: string } — path di storage yang disimpan ke kolom atlet.foto_url.
 */
export async function POST(req: Request) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return NextResponse.json(
                { status: "fail", message: "File tidak ditemukan di request." },
                { status: 400 }
            );
        }

        const imageFile = file as File;

        // Validasi tipe: MIME harus image yang diizinkan (jpg/png/webp)
        const ext = ALLOWED_MIME[imageFile.type];
        const lowerName = imageFile.name.toLowerCase();
        const hasAllowedExt = ALLOWED_EXTENSIONS.some(e => lowerName.endsWith(e));
        if (!ext || !hasAllowedExt) {
            return NextResponse.json(
                { status: "fail", message: "Hanya file gambar JPG, PNG, atau WebP yang diperbolehkan." },
                { status: 400 }
            );
        }

        // Validasi ukuran: maks 2MB
        if (imageFile.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { status: "fail", message: "Ukuran foto maksimal 2MB." },
                { status: 400 }
            );
        }

        // Path unik agar tidak bentrok & mencegah path traversal dari nama file asli.
        const storagePath = `foto/${randomUUID()}${ext}`;

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, imageFile, {
                contentType: imageFile.type,
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Gagal mengunggah foto ke Supabase Storage:", error.message);
            return NextResponse.json(
                {
                    status: "error",
                    message: "gagal mengunggah foto",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "foto berhasil diunggah",
                data: {
                    path: storagePath,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Gagal mengunggah foto:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengunggah foto",
                error: error.message || error,
            },
            { status: 500 }
        );
    }
}

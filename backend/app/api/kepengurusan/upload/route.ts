import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabase } from "@/lib/supabase";

const BUCKET = "sk-documents";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Endpoint POST /api/kepengurusan/upload
 * Mengunggah dokumen PDF SK ke Supabase Storage (bucket privat `sk-documents`).
 * Request: multipart/form-data dengan field `file` (File, type application/pdf, maks 5MB).
 * Response: { path: string } — path di storage yang disimpan ke kolom kepengurusan.file_path_sk.
 */
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || typeof file === "string") {
            return NextResponse.json(
                { status: "fail", message: "File tidak ditemukan di request." },
                { status: 400 }
            );
        }

        const pdfFile = file as File;

        // Validasi tipe: ekstensi wajib .pdf DAN signature magic bytes %PDF-
        // (cek magic bytes agar file ber-rename tidak lolos)
        const isPdfExtension = pdfFile.name.toLowerCase().endsWith(".pdf");
        const buffer = Buffer.from(await pdfFile.arrayBuffer());
        const isPdfMagic = buffer.subarray(0, 5).toString("ascii") === "%PDF-";
        if (!isPdfExtension || !isPdfMagic) {
            return NextResponse.json(
                { status: "fail", message: "Hanya file PDF asli yang diperbolehkan." },
                { status: 400 }
            );
        }

        // Validasi ukuran: maks 5MB
        if (pdfFile.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { status: "fail", message: "Ukuran file maksimal 5MB." },
                { status: 400 }
            );
        }

        // Path unik agar tidak bentrok & mencegah path traversal dari nama file asli.
        const storagePath = `sk/${randomUUID()}.pdf`;

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, pdfFile, {
                contentType: "application/pdf",
                cacheControl: "3600",
                upsert: false,
            });

        if (error) {
            console.error("Gagal mengunggah file ke Supabase Storage:", error.message);
            return NextResponse.json(
                {
                    status: "error",
                    message: "gagal mengunggah file",
                    error: error.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "file berhasil diunggah",
                data: {
                    path: storagePath,
                    original_name: pdfFile.name,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Gagal mengunggah file:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mengunggah file",
                error: error.message || error,
            },
            { status: 500 }
        );
    }
}

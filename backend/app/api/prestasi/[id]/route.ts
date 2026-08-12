import { NextResponse } from "next/server";
import { PrestasiService } from "@/services/prestasi.service";
import { AtletService } from "@/services/atlet.service";
import { ValidationError } from "@/lib/errors";
import { validateConfirmPhrase } from "@/lib/delete-guard";
import { getSession, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

/**
 * Mengambil wilayah atlet dari relasi join (defensif: objek atau array,
 * sesuai pola yang dipakai dashboard.repository).
 */
type PrestasiWithAtlet = {
    atlet?: { kabupaten_kota?: string } | Array<{ kabupaten_kota?: string }>;
};

function getAtletRegion(prestasi: PrestasiWithAtlet | null | undefined): string | undefined {
    const atlet = Array.isArray(prestasi?.atlet) ? prestasi.atlet[0] : prestasi?.atlet;
    return atlet?.kabupaten_kota;
}

/**
 * Endpoint GET /api/prestasi/[id]
 * Mengambil detail data prestasi berdasarkan ID.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        const { id } = await params;
        const data = await PrestasiService.getById(id);

        // Admin wilayah hanya dapat melihat prestasi atlet di wilayahnya sendiri
        if (session.role === "admin_wilayah" && getAtletRegion(data) !== session.region) {
            return forbiddenResponse();
        }

        if (!data) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data prestasi tidak ditemukan"
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "data prestasi berhasil diambil",
                data: data
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal mendapatkan data prestasi dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal mendapatkan data prestasi",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint PUT /api/prestasi/[id]
 * Memperbarui data prestasi tertentu berdasarkan ID.
 * Request Body: Partial<{ atlet_id: number, event_kejuaraan: string, tanggal: string, tingkat_lomba: string, mendali: string }>
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();

        // Admin wilayah: hanya boleh mengubah prestasi atlet di wilayahnya sendiri,
        // dan tidak boleh memindahkan prestasi ke atlet wilayah lain.
        if (session.role === "admin_wilayah") {
            const existing = await PrestasiService.getById(id);
            if (!existing) {
                return NextResponse.json(
                    { status: "fail", message: "data prestasi tidak ditemukan" },
                    { status: 404 }
                );
            }
            if (getAtletRegion(existing) !== session.region) {
                return forbiddenResponse();
            }
            if (body.atlet_id && body.atlet_id !== existing.atlet_id) {
                const newAtlet = await AtletService.getById(String(body.atlet_id));
                if (!newAtlet || newAtlet.kabupaten_kota !== session.region) {
                    return NextResponse.json(
                        {
                            status: "fail",
                            message: `Anda hanya dapat mencatat prestasi untuk atlet di wilayah ${session.region}.`
                        },
                        { status: 403 }
                    );
                }
            }
        }

        const updatedPrestasi = await PrestasiService.update(id, body);

        return NextResponse.json(
            {
                status: "success",
                message: "data prestasi berhasil diperbarui",
                data: updatedPrestasi
            },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof ValidationError) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: error.message
                },
                { status: 400 }
            );
        }
        console.error(`Gagal memperbarui data prestasi dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal memperbarui data prestasi",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint DELETE /api/prestasi/[id]
 * Menghapus data prestasi tertentu berdasarkan ID.
 * Wajib mengirim `confirmText` (frasa "hapus prestasi {nama}") yang divalidasi server.
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session) return unauthorizedResponse();

        const { id } = await params;

        // Ambil data dulu untuk memvalidasi frasa konfirmasi (server-side guard)
        const existing = await PrestasiService.getById(id);
        if (!existing) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data prestasi tidak ditemukan"
                },
                { status: 404 }
            );
        }

        // Admin wilayah: hanya boleh menghapus prestasi atlet di wilayahnya sendiri
        if (session.role === "admin_wilayah" && getAtletRegion(existing) !== session.region) {
            return forbiddenResponse();
        }

        const body = await req.json().catch(() => ({}));
        const guardError = validateConfirmPhrase(body?.confirmText, `hapus prestasi ${existing.event_kejuaraan}`);
        if (guardError) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: guardError
                },
                { status: 400 }
            );
        }

        const result = await PrestasiService.delete(id);

        if (!result) {
            return NextResponse.json(
                {
                    status: "fail",
                    message: "data prestasi tidak ditemukan"
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: "data prestasi berhasil dihapus",
                data: result
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error(`Gagal menghapus data prestasi dengan ID:`, error);
        return NextResponse.json(
            {
                status: "error",
                message: "gagal menghapus data prestasi",
                error: error.message || error
            },
            { status: 500 }
        );
    }
}

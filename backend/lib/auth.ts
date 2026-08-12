import { NextResponse } from "next/server";

/**
 * Secret untuk menandatangani token sesi.
 * WAJIB sama antara backend dan frontend (env AUTH_SECRET di kedua aplikasi).
 * Jangan gunakan nilai default ini di produksi.
 */
const SECRET = process.env.AUTH_SECRET || "koni-aceh-session-secret-change-in-production";

export const COOKIE_NAME = "auth_token";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export type UserRole = "superadmin" | "admin_wilayah";

export type SessionUser = {
    uid: string;
    username: string;
    role: UserRole;
    region: string | null; // kabupaten_kota — null untuk superadmin
};

// ---------------------------------------------------------------------------
// CATATAN: Modul ini HANYA memakai Web Crypto (kompatibel Node & Edge runtime)
// sehingga aman diimpor dari middleware.ts. Hashing kata sandi (scrypt)
// ada di lib/password.ts (Node-only).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Token sesi (HMAC-SHA256 via Web Crypto — kompatibel Node & Edge runtime)
// Format: "<base64url(payload JSON)>.<base64url(signature)>"
// ---------------------------------------------------------------------------

function b64urlEncode(bytes: Uint8Array): string {
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): ArrayBuffer {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer as ArrayBuffer;
}

async function getHmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        [usage]
    );
}

export async function signSessionToken(
    payload: SessionUser & { exp: number }
): Promise<string> {
    const data = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
    const key = await getHmacKey("sign");
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    return `${data}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifySessionToken(
    token: string
): Promise<(SessionUser & { exp: number }) | null> {
    const [data, sig] = String(token || "").split(".");
    if (!data || !sig) return null;
    try {
        const key = await getHmacKey("verify");
        const valid = await crypto.subtle.verify(
            "HMAC",
            key,
            b64urlDecode(sig),
            new TextEncoder().encode(data)
        );
        if (!valid) return null;

        const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(data)));
        if (!payload || typeof payload !== "object" || !payload.exp) return null;
        if (payload.exp < Math.floor(Date.now() / 1000)) return null; // kedaluwarsa
        return payload;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Ekstraksi sesi dari request
// ---------------------------------------------------------------------------

function parseCookieHeader(header: string | null, name: string): string | null {
    if (!header) return null;
    for (const part of header.split(";")) {
        const idx = part.indexOf("=");
        if (idx === -1) continue;
        if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
    }
    return null;
}

export async function getSession(req: Request): Promise<SessionUser | null> {
    const token = parseCookieHeader(req.headers.get("cookie"), COOKIE_NAME);
    if (!token) return null;
    const payload = await verifySessionToken(token);
    if (!payload) return null;
    return {
        uid: payload.uid,
        username: payload.username,
        role: payload.role,
        region: payload.region ?? null,
    };
}

// ---------------------------------------------------------------------------
// Response & guard helpers
// ---------------------------------------------------------------------------

export function unauthorizedResponse(
    message = "Sesi tidak valid atau sudah berakhir. Silakan masuk kembali."
) {
    return NextResponse.json({ status: "error", message }, { status: 401 });
}

export function forbiddenResponse(
    message = "Anda tidak memiliki akses untuk operasi ini."
) {
    return NextResponse.json({ status: "error", message }, { status: 403 });
}


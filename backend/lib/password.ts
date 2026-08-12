import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt) as (
    password: string,
    salt: string,
    keylen: number
) => Promise<Buffer>;

/**
 * Hashing & verifikasi kata sandi (scrypt) — format "salt:hash".
 *
 * CATATAN: Modul ini mengimpor Node `crypto` sehingga HANYA boleh dipakai
 * di runtime Node (route handler). Jangan diimpor dari middleware
 * (Edge runtime) — gunakan lib/auth.ts yang berbasis Web Crypto.
 */

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derived = await scrypt(password, salt, 64);
    return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [salt, hashHex] = String(stored || "").split(":");
    if (!salt || !hashHex) return false;
    try {
        const derived = await scrypt(password, salt, 64);
        const expected = Buffer.from(hashHex, "hex");
        return derived.length === expected.length && timingSafeEqual(derived, expected);
    } catch {
        return false;
    }
}

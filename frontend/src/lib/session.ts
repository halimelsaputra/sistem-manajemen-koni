/**
 * Verifikasi token sesi di sisi frontend (dipakai middleware.ts).
 * Format token harus identik dengan backend/lib/auth.ts:
 *   "<base64url(payload JSON)>.<base64url(HMAC-SHA256 signature)>"
 * AUTH_SECRET harus sama dengan backend/.env AUTH_SECRET.
 */

const SECRET =
  process.env.AUTH_SECRET || 'koni-aceh-session-secret-change-in-production';

export const COOKIE_NAME = 'auth_token';

export type SessionUser = {
  uid: string;
  username: string;
  role: 'superadmin' | 'admin_wilayah';
  region: string | null;
};

function b64urlDecode(str: string): ArrayBuffer {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

/** Memverifikasi tanda tangan token & mengembalikan payload; null jika tidak valid/kedaluwarsa. */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig) return null;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig),
      new TextEncoder().encode(data)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(data)));
    if (!payload || typeof payload !== 'object' || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // kedaluwarsa

    return {
      uid: payload.uid,
      username: payload.username,
      role: payload.role,
      region: payload.region ?? null,
    };
  } catch {
    return null;
  }
}

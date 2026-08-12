import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';

/**
 * Melindungi seluruh API backend (port 3001) dari akses langsung tanpa sesi.
 *
 * Token sesi adalah HMAC bertanda tangan (lihat lib/auth.ts) yang di-set
 * sebagai cookie `auth_token` oleh endpoint /api/auth/login. Frontend
 * meneruskan cookie melalui rewrite proxy.
 *
 * Endpoint login & logout dibuka (public) — semua endpoint lain wajib
 * memiliki token sesi yang valid. Pembatasan peran (super admin / admin
 * wilayah) ditangani di dalam masing-masing route handler.
 */
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.json(
      { status: 'error', message: 'Unauthorized: sesi tidak valid' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

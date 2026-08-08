import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Melindungi seluruh API backend (port 3001) dari akses langsung tanpa sesi.
 *
 * Token sesi di-set sebagai cookie `auth_token` oleh frontend saat login,
 * lalu diteruskan ke backend melalui rewrite proxy (Next.js meneruskan
 * header request asli, termasuk Cookie). Nilai default 'authenticated'
 * harus sama dengan nilai cookie yang di-set frontend — bisa dikustomisasi
 * lewat env `AUTH_TOKEN_VALUE` di kedua aplikasi.
 */
const expectedToken = process.env.AUTH_TOKEN_VALUE || 'authenticated';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;

  if (!authToken || authToken !== expectedToken) {
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

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/** Convert string to Uint8Array */
function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert ArrayBuffer to hex string */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Verify an HMAC-signed token using Web Crypto API (Edge-compatible) for legacy Access Code */
async function verifyAccessCodeToken(token: string, accessCode: string): Promise<boolean> {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;

  const timestamp = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);

  const keyData = encode(accessCode);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const data = encode(timestamp);
  const expected = bufToHex(await crypto.subtle.sign('HMAC', key, data.buffer as ArrayBuffer));

  if (signature.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 1. Whitelist: Static assets, auth-related routes, and classroom media
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/access-code/') ||
    pathname.startsWith('/api/classroom-media/') ||
    pathname === '/api/health' ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

  // 2. Handle Admin Dashboard Protection
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn || (req.auth?.user as any)?.role !== 'ADMIN') {
      // In development, we might allow bypass, but here we enforce it
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }
  }

  // 3. Handle Main App Protection (NextAuth takes priority)
  if (!isLoggedIn) {
    // Fallback to legacy Access Code if configured
    const accessCode = process.env.ACCESS_CODE;
    if (accessCode) {
      const cookie = req.cookies.get('openmaic_access');
      const isValidAccessCode =
        cookie?.value && (await verifyAccessCodeToken(cookie.value, accessCode));

      if (isValidAccessCode) {
        return NextResponse.next();
      }
    }

    // If neither Auth.js nor Access Code is valid, redirect to login for pages, 401 for API
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, errorCode: 'UNAUTHORIZED', error: 'Authentication required' },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logos/).*)'],
};

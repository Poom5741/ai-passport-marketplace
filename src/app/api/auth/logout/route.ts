import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

// POST /api/auth/logout — clear the auth cookie
export async function POST(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: proto === 'https',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

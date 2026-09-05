import { NextRequest, NextResponse } from 'next/server';
import type { KVNamespace } from '@cloudflare/workers-types';
import { verifyPassword, signJWT, COOKIE_NAME } from '@/lib/auth';
import { createDB } from '@/lib/d1';
import { getCloudflareEnv } from '@/lib/env';
import { checkRateLimit } from '@/lib/rate-limit';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

const RATE_LIMIT_KEY_PREFIX = 'rate_limit:login:';

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const env = getCloudflareEnv();

  const clientIP =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    'unknown';
  const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}${clientIP}`;

  if (env.RATE_LIMIT) {
    const { allowed } = await checkRateLimit(env.RATE_LIMIT as KVNamespace, rateLimitKey);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429, headers: { 'Retry-After': '900' } },
      );
    }
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  if (!env.DB) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const db = createDB(env.DB);
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get();

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signJWT({ sub: user.id, email: user.email });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}

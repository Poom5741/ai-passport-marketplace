import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import { hashPassword, signJWT, COOKIE_NAME } from '@/lib/auth';
import { createDB } from '@/lib/d1';
import { getCloudflareEnv } from '@/lib/env';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

const AI_PASSPORT_DOMAIN = '@ai-passport.go.th';
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: { email?: string; password?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password, displayName } = body;

  if (!email || !email.endsWith(AI_PASSPORT_DOMAIN)) {
    return NextResponse.json(
      { error: `Registration is only open to ${AI_PASSPORT_DOMAIN} email addresses` },
      { status: 400 },
    );
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 },
    );
  }

  if (!displayName || displayName.trim().length === 0) {
    return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
  }

  const env = getCloudflareEnv();
  if (!env.DB) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const db = createDB(env.DB);
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get();

  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const userId = ulid();

  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    displayName: displayName.trim(),
    createdAt: now,
  });

  const token = await signJWT({ sub: userId, email: email.toLowerCase() });
  const response = new NextResponse(null, { status: 201 });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}

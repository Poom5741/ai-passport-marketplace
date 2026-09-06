/**
 * Auth integration tests (T6)
 * Tests the auth module functions and route-level response codes.
 *
 * Mocks are declared at module top level (vitest hoists vi.mock); shared
 * mutable state lives in `mocks` via vi.hoisted so each test configures
 * behavior in beforeEach. Tests that exercise REAL crypto (bcrypt/JWT) use
 * vi.importActual to bypass the module mock.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KVNamespace } from '@cloudflare/workers-types';
import {
  TEST_EMAIL_VALID,
  TEST_EMAIL_INVALID,
  TEST_DISPLAY_NAME,
  getTestPassword,
  getTestPasswordShort,
  getTestPasswordWrong,
} from './auth-test-fixtures';

// ---------------------------------------------------------------------------
// Shared mock state (hoisted so top-level vi.mock factories can reference it)
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  db: null as Record<string, unknown> | null,
  rateLimitKV: null as Record<string, unknown> | null,
  session: null as { sub: string; email: string } | null,
}));

vi.mock('@/lib/env', () => ({
  getCloudflareEnv: () => ({ DB: mocks.db, RATE_LIMIT: mocks.rateLimitKV }),
}));

vi.mock('drizzle-orm/d1', () => ({
  drizzle: () => mocks.db,
}));

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return {
    ...actual,
    hashPassword: vi.fn().mockResolvedValue('$2a$10$mockhash'),
    verifyPassword: vi.fn(),
    signJWT: vi.fn().mockResolvedValue('mock.jwt.token'),
    getSession: () => Promise.resolve(mocks.session),
  };
});

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4 }),
}));

// ---------------------------------------------------------------------------
// Auth functions: bcrypt hashing, JWT sign/verify (real implementations)
// ---------------------------------------------------------------------------
describe('auth module', () => {
  it('hashPassword produces a bcrypt cost-10 hash', async () => {
    const { hashPassword } = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
    const hash = await hashPassword('testpassword123');
    // bcrypt cost 10 prefix: $2a$10$ or $2b$10$
    expect(hash).toMatch(/^\$2[ab]\$10\$/);
  });

  it('hashPassword produces different hashes for same input (salt)', async () => {
    const { hashPassword } = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
    const h1 = await hashPassword('sameinput');
    const h2 = await hashPassword('sameinput');
    expect(h1).not.toBe(h2);
  });

  it('verifyPassword returns true for correct password', async () => {
    const { hashPassword, verifyPassword } = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
    const hash = await hashPassword('correctpassword');
    const result = await verifyPassword('correctpassword', hash);
    expect(result).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const { hashPassword, verifyPassword } = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
    const hash = await hashPassword('correctpassword');
    const result = await verifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('signJWT returns a valid 3-part JWT', async () => {
    const { signJWT } = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
    const token = await signJWT({ sub: 'user-ulid-123', email: 'test@ai-passport.go.th' });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('verifyJWT decodes a valid token', async () => {
    const { signJWT, verifyJWT } = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
    const token = await signJWT({ sub: 'user-ulid-456', email: 'user@ai-passport.go.th' });
    const payload = await verifyJWT(token);
    expect(payload?.sub).toBe('user-ulid-456');
    expect(payload?.email).toBe('user@ai-passport.go.th');
  });

  it('verifyJWT returns null for an invalid token', async () => {
    const { verifyJWT } = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
    expect(await verifyJWT('not.a.jwt')).toBeNull();
  });

  it('verifyJWT returns null for a tampered token', async () => {
    const { signJWT, verifyJWT } = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
    const token = await signJWT({ sub: 'user-1', email: 'test@ai-passport.go.th' });
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(await verifyJWT(tampered)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
describe('checkRateLimit', () => {
  it('allows first request and sets remaining count', async () => {
    const { checkRateLimit } = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit');
    const mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const result = await checkRateLimit(mockKV as unknown as KVNamespace, 'test-key');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks when max attempts exceeded', async () => {
    const { checkRateLimit } = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit');
    const now = Date.now();
    const mockKV = {
      get: vi.fn().mockResolvedValue({ count: 5, windowStart: now }),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const result = await checkRateLimit(mockKV as unknown as KVNamespace, 'test-key');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets window after expiration', async () => {
    const { checkRateLimit } = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit');
    const expiredWindow = Date.now() - 20 * 60 * 1000; // 20 min ago
    const mockKV = {
      get: vi.fn().mockResolvedValue({ count: 5, windowStart: expiredWindow }),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const result = await checkRateLimit(mockKV as unknown as KVNamespace, 'test-key');
    expect(result.allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tag normalization (also used by project route)
// ---------------------------------------------------------------------------
describe('normalizeTags', () => {
  it('normalizes mixed-case tags to lowercase', async () => {
    const { normalizeTags } = await import('@/lib/tags');
    expect(normalizeTags(['Python', 'JavaScript'])).toEqual(['python', 'javascript']);
  });

  it('caps at 10 tags', async () => {
    const { normalizeTags } = await import('@/lib/tags');
    expect(normalizeTags(Array.from({ length: 15 }, (_, i) => `tag${i}`))).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// Route handler tests: POST /api/auth/register
// ---------------------------------------------------------------------------
describe('POST /api/auth/register', () => {
  beforeEach(() => {
    mocks.session = null;
    mocks.rateLimitKV = null;
    mocks.db = {
      select: () => ({ from: () => ({ where: () => ({ get: () => null }) }) }),
      insert: () => ({
        values: () => Promise.resolve({ success: true, meta: { changes: 1 } }),
      }),
    };
  });

  const makePostRequest = (body: Record<string, unknown>) =>
    new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as unknown as Parameters<typeof import('@/app/api/auth/register/route').POST>[0];

  it('returns 400 for email outside @ai-passport.go.th domain', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makePostRequest({ email: TEST_EMAIL_INVALID, password: getTestPassword(), displayName: TEST_DISPLAY_NAME }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('ai-passport.go.th');
  });

  it('returns 400 for password shorter than 8 characters', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makePostRequest({ email: TEST_EMAIL_VALID, password: getTestPasswordShort(), displayName: TEST_DISPLAY_NAME }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('8');
  });

  it('returns 400 when displayName is missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makePostRequest({ email: TEST_EMAIL_VALID, password: getTestPassword() }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Display name');
  });

  it('returns 400 when email is missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makePostRequest({ password: getTestPassword(), displayName: TEST_DISPLAY_NAME }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('email');
  });

  it('returns 409 for duplicate email', async () => {
    mocks.db = {
      select: () => ({ from: () => ({ where: () => ({ get: () => ({ id: 'existing-user', email: TEST_EMAIL_VALID }) }) }) }),
      insert: () => ({ values: () => Promise.resolve({ success: true, meta: { changes: 1 } }) }),
    };
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makePostRequest({ email: TEST_EMAIL_VALID, password: getTestPassword(), displayName: TEST_DISPLAY_NAME }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already registered');
  });

  it('returns 201 on valid registration', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(makePostRequest({ email: TEST_EMAIL_VALID, password: getTestPassword(), displayName: TEST_DISPLAY_NAME }));
    expect(res.status).toBe(201);
  });

  it('returns 405 for non-POST method', async () => {
    const { POST } = await import('@/app/api/auth/register/route');
    const res = await POST(
      new Request('http://localhost:3000/api/auth/register', { method: 'DELETE' }) as unknown as Parameters<typeof POST>[0],
    );
    expect(res.status).toBe(405);
  });
});

// ---------------------------------------------------------------------------
// Route handler tests: POST /api/auth/login
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    mocks.db = {
      select: () => ({ from: () => ({ where: () => ({ get: () => null }) }) }),
    };
    mocks.rateLimitKV = {};
    const { checkRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 4 });
    const { verifyPassword } = await import('@/lib/auth');
    vi.mocked(verifyPassword).mockResolvedValue(true);
  });

  const makePostRequest = (body: Record<string, unknown>) =>
    new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as unknown as Parameters<typeof import('@/app/api/auth/login/route').POST>[0];

  it('returns 400 when email is missing', async () => {
    const { POST } = await import('@/app/api/auth/login/route');
    const res = await POST(makePostRequest({ password: getTestPassword() }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const { POST } = await import('@/app/api/auth/login/route');
    const res = await POST(makePostRequest({ email: TEST_EMAIL_VALID }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when user not found', async () => {
    const { POST } = await import('@/app/api/auth/login/route');
    const res = await POST(makePostRequest({ email: 'nobody@ai-passport.go.th', password: getTestPassword() }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid credentials');
  });

  it('returns 401 when password is wrong', async () => {
    const { verifyPassword } = await import('@/lib/auth');
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);
    mocks.db = {
      select: () => ({ from: () => ({ where: () => ({ get: () => ({ id: 'user-1', email: TEST_EMAIL_VALID, passwordHash: '$2a$10$hash' }) }) }) }),
    };
    const { POST } = await import('@/app/api/auth/login/route');
    const res = await POST(makePostRequest({ email: TEST_EMAIL_VALID, password: getTestPasswordWrong() }));
    expect(res.status).toBe(401);
  });

  it('returns 200 with ok:true and sets HttpOnly cookie on valid login', async () => {
    mocks.db = {
      select: () => ({ from: () => ({ where: () => ({ get: () => ({ id: 'user-1', email: TEST_EMAIL_VALID, passwordHash: '$2a$10$hash' }) }) }) }),
    };
    const { POST } = await import('@/app/api/auth/login/route');
    const res = await POST(makePostRequest({ email: TEST_EMAIL_VALID, password: getTestPassword() }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('ai_passport_token');
  });

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0 });
    const { POST } = await import('@/app/api/auth/login/route');
    const res = await POST(makePostRequest({ email: TEST_EMAIL_VALID, password: getTestPassword() }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('Too many');
  });

  it('returns 405 for non-POST method', async () => {
    const { POST } = await import('@/app/api/auth/login/route');
    const res = await POST(
      new Request('http://localhost:3000/api/auth/login', { method: 'GET' }) as unknown as Parameters<typeof POST>[0],
    );
    expect(res.status).toBe(405);
  });
});

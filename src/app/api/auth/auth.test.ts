/**
 * Auth integration tests (T6)
 * Tests the auth module functions and route-level response codes.
 *
 * For full route handler tests (409, 429, etc.) the app must be running
 * with a real or wrangler-mocked D1. These tests cover the auth logic
 * that is testable in isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KVNamespace } from '@cloudflare/workers-types';

// ---------------------------------------------------------------------------
// Auth functions: bcrypt hashing, JWT sign/verify
// ---------------------------------------------------------------------------
describe('auth module', () => {
  it('hashPassword produces a bcrypt cost-10 hash', async () => {
    const { hashPassword } = await import('@/lib/auth');
    const hash = await hashPassword('testpassword123');
    // bcrypt cost 10 prefix: $2a$10$ or $2b$10$
    expect(hash).toMatch(/^\$2[ab]\$10\$/);
  });

  it('hashPassword produces different hashes for same input (salt)', async () => {
    const { hashPassword } = await import('@/lib/auth');
    const h1 = await hashPassword('sameinput');
    const h2 = await hashPassword('sameinput');
    expect(h1).not.toBe(h2);
  });

  it('verifyPassword returns true for correct password', async () => {
    const { hashPassword, verifyPassword } = await import('@/lib/auth');
    const hash = await hashPassword('correctpassword');
    const result = await verifyPassword('correctpassword', hash);
    expect(result).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const { hashPassword, verifyPassword } = await import('@/lib/auth');
    const hash = await hashPassword('correctpassword');
    const result = await verifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('signJWT returns a valid 3-part JWT', async () => {
    const { signJWT } = await import('@/lib/auth');
    const token = await signJWT({ sub: 'user-ulid-123', email: 'test@ai-passport.go.th' });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('verifyJWT decodes a valid token', async () => {
    const { signJWT, verifyJWT } = await import('@/lib/auth');
    const token = await signJWT({ sub: 'user-ulid-456', email: 'user@ai-passport.go.th' });
    const payload = await verifyJWT(token);
    expect(payload?.sub).toBe('user-ulid-456');
    expect(payload?.email).toBe('user@ai-passport.go.th');
  });

  it('verifyJWT returns null for an invalid token', async () => {
    const { verifyJWT } = await import('@/lib/auth');
    expect(await verifyJWT('not.a.jwt')).toBeNull();
  });

  it('verifyJWT returns null for a tampered token', async () => {
    const { signJWT, verifyJWT } = await import('@/lib/auth');
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
    const { checkRateLimit } = await import('@/lib/rate-limit');
    const mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    const result = await checkRateLimit(mockKV as unknown as KVNamespace, 'test-key');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks when max attempts exceeded', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
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
    const { checkRateLimit } = await import('@/lib/rate-limit');
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

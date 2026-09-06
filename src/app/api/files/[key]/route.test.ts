/**
 * File delivery route tests (rc-3)
 * GET /api/files/[key] — validates key format, R2 lookup, streaming
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------
let r2GetObject: ((key: string) => Promise<{ body: ReadableStream; httpMetadata: { contentType: string } } | null>) | null = null;
let r2Enabled = true;

vi.mock('@/lib/env', () => ({
  getCloudflareEnv: () => r2Enabled ? {
    UPLOADS: {
      get: vi.fn().mockImplementation((key: string) => r2GetObject?.(key) ?? null),
    },
  } : { UPLOADS: undefined },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const makeGetRequest = (key: string) =>
  new Request(`http://localhost:3000/api/files/${key}`, {
    method: 'GET',
  }) as unknown as Parameters<typeof import('@/app/api/files/[key]/route').GET>[0];

const makeParams = (key: string) =>
  ({ params: Promise.resolve({ key }) }) as { params: Promise<{ key: string }> };

const makeR2Object = (contentType: string) => ({
  body: new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('file-content'));
      controller.close();
    },
  }),
  httpMetadata: { contentType },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/files/[key]', () => {
  beforeEach(() => {
    r2GetObject = null;
  });

  it('returns 400 for invalid key format (no extension)', async () => {
    const { GET } = await import('@/app/api/files/[key]/route');
    const res = await GET(makeGetRequest('not-a-valid-key'), makeParams('not-a-valid-key'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid file key');
  });

  it('returns 400 for key with disallowed extension', async () => {
    const { GET } = await import('@/app/api/files/[key]/route');
    const key = `${VALID_UUID}.gif`;
    const res = await GET(makeGetRequest(key), makeParams(key));
    expect(res.status).toBe(400);
  });

  it('returns 400 for key with uppercase hex', async () => {
    const { GET } = await import('@/app/api/files/[key]/route');
    const key = `A1B2C3D4-E5F6-7890-ABCD-EF1234567890.png`;
    const res = await GET(makeGetRequest(key), makeParams(key));
    expect(res.status).toBe(400);
  });

  it('returns 400 for path-traversal-style key', async () => {
    const { GET } = await import('@/app/api/files/[key]/route');
    const key = `../../etc/passwd`;
    const res = await GET(makeGetRequest(key), makeParams(key));
    expect(res.status).toBe(400);
  });

  it('returns 404 when file not found in R2', async () => {
    r2GetObject = async () => null;
    const { GET } = await import('@/app/api/files/[key]/route');
    const key = `${VALID_UUID}.png`;
    const res = await GET(makeGetRequest(key), makeParams(key));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('not found');
  });

  it('streams file body with correct Content-Type for png', async () => {
    r2GetObject = async () => makeR2Object('image/png');
    const { GET } = await import('@/app/api/files/[key]/route');
    const key = `${VALID_UUID}.png`;
    const res = await GET(makeGetRequest(key), makeParams(key));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    const text = await res.text();
    expect(text).toBe('file-content');
  });

  it('streams file body with correct Content-Type for jpg', async () => {
    r2GetObject = async () => makeR2Object('image/jpeg');
    const { GET } = await import('@/app/api/files/[key]/route');
    const key = `${VALID_UUID}.jpg`;
    const res = await GET(makeGetRequest(key), makeParams(key));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('streams file body with correct Content-Type for webp', async () => {
    r2GetObject = async () => makeR2Object('image/webp');
    const { GET } = await import('@/app/api/files/[key]/route');
    const key = `${VALID_UUID}.webp`;
    const res = await GET(makeGetRequest(key), makeParams(key));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/webp');
  });

  it('sets immutable cache headers', async () => {
    r2GetObject = async () => makeR2Object('image/png');
    const { GET } = await import('@/app/api/files/[key]/route');
    const key = `${VALID_UUID}.png`;
    const res = await GET(makeGetRequest(key), makeParams(key));
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  });

  it('returns 500 when R2 storage is not configured', async () => {
    r2Enabled = false;
    const { GET } = await import('@/app/api/files/[key]/route');
    const key = `${VALID_UUID}.png`;
    const res = await GET(makeGetRequest(key), makeParams(key));
    expect(res.status).toBe(500);
    r2Enabled = true;
  });
});

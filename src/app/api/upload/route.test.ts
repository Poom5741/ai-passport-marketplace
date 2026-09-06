/**
 * Upload route tests (rc-3)
 * POST /api/upload — validates auth, content-type, file size, R2 storage
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------
let sessionUser: { sub: string; email: string } | null = null;
let r2PutCalls: Array<{ key: string; contentType: string }> = [];
let r2Enabled = true;

const mockR2Put = vi.fn().mockImplementation(async (key: string, _stream: unknown, opts: { httpMetadata: { contentType: string } }) => {
  r2PutCalls.push({ key, contentType: opts.httpMetadata.contentType });
  return { key };
});

vi.mock('@/lib/env', () => ({
  getCloudflareEnv: () => r2Enabled ? { UPLOADS: { put: mockR2Put } } : { UPLOADS: undefined },
}));

vi.mock('@/lib/auth', () => ({
  getSession: () => Promise.resolve(sessionUser),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeUploadRequest = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return new Request('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData,
  }) as unknown as Parameters<typeof import('@/app/api/upload/route').POST>[0];
};

const makeFile = (name: string, type: string, size: number) => {
  const buf = new Uint8Array(size);
  return new File([buf], name, { type });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/upload', () => {
  beforeEach(() => {
    sessionUser = { sub: 'user-1', email: 'test@ai-passport.go.th' };
    r2PutCalls = [];
  });

  it('returns 401 when unauthenticated', async () => {
    sessionUser = null;
    const { POST } = await import('@/app/api/upload/route');
    const res = await POST(makeUploadRequest(makeFile('test.png', 'image/png', 100)));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when no file is provided', async () => {
    const formData = new FormData();
    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    }) as unknown as Parameters<typeof import('@/app/api/upload/route').POST>[0];
    const { POST } = await import('@/app/api/upload/route');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('No file');
  });

  it('returns 415 for unsupported content type (image/gif)', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const res = await POST(makeUploadRequest(makeFile('test.gif', 'image/gif', 100)));
    expect(res.status).toBe(415);
    const body = await res.json();
    expect(body.error).toContain('Unsupported content type');
  });

  it('returns 415 for text/plain', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const res = await POST(makeUploadRequest(makeFile('test.txt', 'text/plain', 100)));
    expect(res.status).toBe(415);
  });

  it('returns 413 for files over 5MB', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const overSize = 5 * 1024 * 1024 + 1;
    const res = await POST(makeUploadRequest(makeFile('large.png', 'image/png', overSize)));
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toContain('File too large');
  });

  it('accepts a 5MB file exactly', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const exactSize = 5 * 1024 * 1024;
    const res = await POST(makeUploadRequest(makeFile('exact.png', 'image/png', exactSize)));
    expect(res.status).toBe(201);
  });

  it('returns 201 with key and url for valid png upload', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const res = await POST(makeUploadRequest(makeFile('photo.png', 'image/png', 1024)));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.key).toBeDefined();
    expect(body.key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/);
    expect(body.url).toBe(`/api/files/${body.key}`);
    expect(r2PutCalls).toHaveLength(1);
    expect(r2PutCalls[0].contentType).toBe('image/png');
  });

  it('accepts image/jpeg with correct extension', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const res = await POST(makeUploadRequest(makeFile('photo.jpg', 'image/jpeg', 512)));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.key).toMatch(/\.jpg$/);
  });

  it('accepts image/webp with correct extension', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const res = await POST(makeUploadRequest(makeFile('photo.webp', 'image/webp', 512)));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.key).toMatch(/\.webp$/);
  });

  it('returns 500 when R2 storage is not configured', async () => {
    r2Enabled = false;
    const { POST } = await import('@/app/api/upload/route');
    const res = await POST(makeUploadRequest(makeFile('test.png', 'image/png', 100)));
    expect(res.status).toBe(500);
    r2Enabled = true;
  });
});

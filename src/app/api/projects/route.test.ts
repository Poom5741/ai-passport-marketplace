/**
 * Project submission unit tests (T7)
 * Test cases from docs/implementation/tickets/t7-project-submission-tests.md
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock — bypasses Drizzle entirely, gives full control over DB responses
// ---------------------------------------------------------------------------
let sessionUser: { sub: string; email: string } | null = null;
let lastInsertedProject: Record<string, unknown> | null = null;

vi.mock('@/lib/env', () => ({
  getCloudflareEnv: () => ({ DB: mockDB, RATE_LIMIT: undefined }),
}));

vi.mock('@/lib/auth', () => ({
  getSession: () => Promise.resolve(sessionUser),
}));

// Mock drizzle-orm/d1 so createDB returns our fully-controlled mock
vi.mock('drizzle-orm/d1', () => ({
  drizzle: () => mockDB,
}));

const mockDB = {
  select: () => ({ get: () => null, all: () => [] }),
  insert: () => ({
    values: (vals: Record<string, unknown>) => {
      lastInsertedProject = { ...vals, id: 'mock-ulid-123' };
      return Promise.resolve({ success: true, meta: { changes: 1 } });
    },
  }),
};

// ---------------------------------------------------------------------------
// Request factory
// ---------------------------------------------------------------------------
const makePostRequest = (body: object) =>
  new Request('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof import('@/app/api/projects/route').POST>[0];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/projects', () => {
  beforeEach(() => {
    sessionUser = { sub: 'user-1', email: 'test@ai-passport.go.th' };
    lastInsertedProject = null;
  });

  it('returns 401 when unauthenticated', async () => {
    sessionUser = null;
    const { POST } = await import('@/app/api/projects/route');
    const res = await POST(makePostRequest({ title: 'My Project', description: 'Desc' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when title exceeds 100 characters', async () => {
    const { POST } = await import('@/app/api/projects/route');
    const res = await POST(makePostRequest({ title: 'a'.repeat(101), description: 'Desc' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('100');
  });

  it('returns 400 when tag count exceeds 10', async () => {
    const { POST } = await import('@/app/api/projects/route');
    const res = await POST(
      makePostRequest({
        title: 'My Project',
        description: 'Desc',
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('10');
  });

  it('returns 400 when liveUrl is invalid', async () => {
    const { POST } = await import('@/app/api/projects/route');
    const res = await POST(
      makePostRequest({ title: 'My Project', description: 'Desc', liveUrl: 'not-a-url' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 201 with project object on valid submission', async () => {
    const { POST } = await import('@/app/api/projects/route');
    const res = await POST(
      makePostRequest({
        title: 'My AI Project',
        description: 'Built with LLMs',
        liveUrl: 'https://example.com',
        tags: ['python', 'ai'],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.project).toBeDefined();
    expect(body.project.title).toBe('My AI Project');
    expect(body.project.tags).toEqual(['python', 'ai']);
  });

  it('returns 405 for non-POST method', async () => {
    const { POST } = await import('@/app/api/projects/route');
    const res = await POST(
      new Request('http://localhost:3000/api/projects', { method: 'DELETE' }) as unknown as Parameters<typeof POST>[0],
    );
    expect(res.status).toBe(405);
  });
});

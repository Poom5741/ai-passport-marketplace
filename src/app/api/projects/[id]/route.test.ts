/**
 * Project detail route tests — dedup view tracking + repoUrl response
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------
let mockProjectRow: Record<string, unknown> | null = null;
let mockTags: { tag: string }[] = [];
let mockExistingView: { id: string } | null = null;
let insertedViews: Record<string, unknown>[] = [];

vi.mock('@/lib/env', () => ({
  getCloudflareEnv: () => ({ DB: mockD1, RATE_LIMIT: undefined }),
}));

const mockD1 = {
  prepare: (sql: string) => ({
    bind: (...args: unknown[]) => ({
      run: () => Promise.resolve({ success: true }),
      get: () => {
        if (sql.includes('project_views')) return mockExistingView;
        return null;
      },
    }),
  }),
};

vi.mock('drizzle-orm/d1', () => ({
  drizzle: () => mockDB,
}));

function makeQueryResult<T>(single: T | null, many: T[]) {
  return {
    get: () => single,
    then: (resolve: (v: T[]) => void, reject?: (e: Error) => void) => {
      return Promise.resolve(many).then(resolve, reject);
    },
  };
}

let selectCallCount = 0;

const mockDB = {
  select: () => {
    selectCallCount++;
    return {
      from: () => ({
        // .innerJoin() chain used by the project lookup query (call 1)
        innerJoin: () => ({
          where: () =>
            makeQueryResult(
              mockProjectRow
                ? {
                    project: mockProjectRow,
                    user: {
                      id: mockProjectRow.userId,
                      displayName: 'Test User',
                      avatarUrl: null,
                    },
                  }
                : null,
              [],
            ),
        }),
        // .where() used by tags query (call 2) and dedup check (call 3+)
        where: () => {
          if (selectCallCount === 2) {
            // Tags query — expected to return array when awaited
            return makeQueryResult(null, mockTags);
          }
          // Dedup check — expected to return single row via .get()
          return makeQueryResult(mockExistingView, []);
        },
      }),
    };
  },
  insert: () => ({
    values: (vals: Record<string, unknown>) => {
      insertedViews.push(vals);
      return Promise.resolve({ success: true });
    },
  }),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeGetRequest(id: string, headers: Record<string, string> = {}) {
  const req = new Request(`http://localhost:3000/api/projects/${id}`, {
    method: 'GET',
    headers,
  });
  return req as unknown as Parameters<typeof import('@/app/api/projects/[id]/route').GET>[0];
}

const mockParams = (id: string) =>
  ({ params: Promise.resolve({ id }) }) as Parameters<typeof import('@/app/api/projects/[id]/route').GET>[1];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    selectCallCount = 0;
    mockProjectRow = {
      id: 'proj-1',
      userId: 'user-1',
      title: 'Test Project',
      description: 'A test',
      liveUrl: 'https://example.com',
      repoUrl: 'https://github.com/user/repo',
      screenshotUrl: null,
      viewCount: 5,
      createdAt: new Date('2025-01-01'),
    };
    mockTags = [{ tag: 'ai' }, { tag: 'python' }];
    mockExistingView = null;
    insertedViews = [];
  });

  afterEach(async () => {
    // Flush any pending async trackView promises to avoid leaking into next test
    await new Promise((r) => setTimeout(r, 20));
  });

  it('returns 404 when project not found', async () => {
    mockProjectRow = null;
    const { GET } = await import('@/app/api/projects/[id]/route');
    const res = await GET(makeGetRequest('nonexistent'), mockParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('returns project with repoUrl in response', async () => {
    const { GET } = await import('@/app/api/projects/[id]/route');
    const res = await GET(
      makeGetRequest('proj-1', { 'user-agent': 'test-agent' }),
      mockParams('proj-1'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.project.repoUrl).toBe('https://github.com/user/repo');
    expect(body.project.title).toBe('Test Project');
  });

  it('returns project when repoUrl is null', async () => {
    mockProjectRow = { ...mockProjectRow, repoUrl: null };
    const { GET } = await import('@/app/api/projects/[id]/route');
    const res = await GET(
      makeGetRequest('proj-1', { 'user-agent': 'test-agent' }),
      mockParams('proj-1'),
    );
    const body = await res.json();
    expect(body.project.repoUrl).toBeNull();
  });

  it('inserts a dedup view row for first-time viewer', async () => {
    mockExistingView = null;
    const { GET } = await import('@/app/api/projects/[id]/route');
    await GET(
      makeGetRequest('proj-1', {
        'user-agent': 'Mozilla/5.0',
        'cf-connecting-ip': '1.2.3.4',
      }),
      mockParams('proj-1'),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(insertedViews.length).toBe(1);
    expect(insertedViews[0].projectId).toBe('proj-1');
    expect(insertedViews[0].viewerIp).toBe('1.2.3.4');
  });

  it('does not insert when viewer already viewed within 1 hour', async () => {
    mockExistingView = { id: 'existing-view-id' };
    const { GET } = await import('@/app/api/projects/[id]/route');
    await GET(
      makeGetRequest('proj-1', {
        'user-agent': 'Mozilla/5.0',
        'cf-connecting-ip': '1.2.3.4',
      }),
      mockParams('proj-1'),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(insertedViews.length).toBe(0);
  });

  it('falls back to x-forwarded-for when cf-connecting-ip is absent', async () => {
    mockExistingView = null;
    const { GET } = await import('@/app/api/projects/[id]/route');
    await GET(
      makeGetRequest('proj-1', {
        'user-agent': 'TestBot/1.0',
        'x-forwarded-for': '10.0.0.1, 10.0.0.2',
      }),
      mockParams('proj-1'),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(insertedViews.length).toBe(1);
    expect(insertedViews[0].viewerIp).toBe('10.0.0.1');
  });

  it('uses unknown when no IP headers present', async () => {
    mockExistingView = null;
    const { GET } = await import('@/app/api/projects/[id]/route');
    await GET(
      makeGetRequest('proj-1', { 'user-agent': 'curl/7.0' }),
      mockParams('proj-1'),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(insertedViews.length).toBe(1);
    expect(insertedViews[0].viewerIp).toBe('unknown');
  });

  it('computes SHA-256 hash of user-agent', async () => {
    mockExistingView = null;
    const { GET } = await import('@/app/api/projects/[id]/route');
    await GET(
      makeGetRequest('proj-1', { 'user-agent': 'TestBot/1.0' }),
      mockParams('proj-1'),
    );
    await new Promise((r) => setTimeout(r, 10));
    const hash = insertedViews[0].viewerUaHash as string;
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

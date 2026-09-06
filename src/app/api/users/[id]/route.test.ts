/**
 * User profile route tests — dedup profile view tracking
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------
let mockUser: Record<string, unknown> | null = null;
let mockProjects: Record<string, unknown>[] = [];
let mockExistingView: { id: string } | null = null;
let insertedViews: Record<string, unknown>[] = [];
let selectCallCount = 0;

vi.mock('@/lib/env', () => ({
  getCloudflareEnv: () => ({ DB: mockD1, RATE_LIMIT: undefined }),
}));

const mockD1 = {
  prepare: (sql: string) => ({
    bind: (...args: unknown[]) => ({
      run: () => Promise.resolve({ success: true }),
      get: () => {
        if (sql.includes('profile_views')) return mockExistingView;
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
    orderBy: () => many,
    then: (resolve: (v: T[]) => void, reject?: (e: Error) => void) => {
      return Promise.resolve(many).then(resolve, reject);
    },
    [Symbol.iterator]: function* () {
      for (const item of many) yield item;
    },
  };
}

const mockDB = {
  select: () => {
    selectCallCount++;
    return {
      from: () => ({
        where: () => {
          if (selectCallCount === 1) {
            // User lookup
            return makeQueryResult(mockUser, []);
          }
          if (selectCallCount === 2) {
            // User projects query
            return makeQueryResult(null, mockProjects);
          }
          // Dedup check (call 3+)
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
  const req = new Request(`http://localhost:3000/api/users/${id}`, {
    method: 'GET',
    headers,
  });
  return req as unknown as Parameters<typeof import('@/app/api/users/[id]/route').GET>[0];
}

const mockParams = (id: string) =>
  ({ params: Promise.resolve({ id }) }) as Parameters<typeof import('@/app/api/users/[id]/route').GET>[1];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GET /api/users/[id]', () => {
  beforeEach(() => {
    selectCallCount = 0;
    mockUser = {
      id: 'user-1',
      email: 'test@ai-passport.go.th',
      displayName: 'Test User',
      bio: 'Hello',
      avatarUrl: null,
      createdAt: new Date('2025-01-01'),
    };
    mockProjects = [];
    mockExistingView = null;
    insertedViews = [];
  });

  afterEach(async () => {
    // Flush any pending async trackProfileView promises
    await new Promise((r) => setTimeout(r, 20));
  });

  it('returns 404 when user not found', async () => {
    mockUser = null;
    const { GET } = await import('@/app/api/users/[id]/route');
    const res = await GET(makeGetRequest('nonexistent'), mockParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('returns user profile and projects', async () => {
    const { GET } = await import('@/app/api/users/[id]/route');
    const res = await GET(
      makeGetRequest('user-1', { 'user-agent': 'test-agent' }),
      mockParams('user-1'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.displayName).toBe('Test User');
  });

  it('inserts a dedup profile view row for first-time viewer', async () => {
    mockExistingView = null;
    const { GET } = await import('@/app/api/users/[id]/route');
    await GET(
      makeGetRequest('user-1', {
        'user-agent': 'Mozilla/5.0',
        'cf-connecting-ip': '5.6.7.8',
      }),
      mockParams('user-1'),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(insertedViews.length).toBe(1);
    expect(insertedViews[0].profileUserId).toBe('user-1');
    expect(insertedViews[0].viewerIp).toBe('5.6.7.8');
  });

  it('does not insert when viewer already viewed within 1 hour', async () => {
    mockExistingView = { id: 'existing-profile-view' };
    const { GET } = await import('@/app/api/users/[id]/route');
    await GET(
      makeGetRequest('user-1', {
        'user-agent': 'Mozilla/5.0',
        'cf-connecting-ip': '5.6.7.8',
      }),
      mockParams('user-1'),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(insertedViews.length).toBe(0);
  });

  it('computes SHA-256 hash of user-agent for profile views', async () => {
    mockExistingView = null;
    const { GET } = await import('@/app/api/users/[id]/route');
    await GET(
      makeGetRequest('user-1', { 'user-agent': 'TestBot/1.0' }),
      mockParams('user-1'),
    );
    await new Promise((r) => setTimeout(r, 10));
    const hash = insertedViews[0].viewerUaHash as string;
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

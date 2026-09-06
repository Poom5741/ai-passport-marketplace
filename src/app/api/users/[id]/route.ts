import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import type { D1Database } from '@cloudflare/workers-types';
import { createDB } from '@/lib/d1';
import { getCloudflareEnv } from '@/lib/env';
import { users, projects, profileViews } from '@/drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getViewerIp(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

// GET /api/users/[id] — get a user profile + their projects + deduped profile view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const env = getCloudflareEnv();

  if (!env.DB) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  const db = createDB(env.DB as D1Database);

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      profileViewCount: users.profileViewCount,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, id))
    .orderBy(projects.createdAt);

  // Fire-and-forget deduped profile view tracking via waitUntil
  const trackProfileView = async () => {
    if (!env.DB) return;
    const db2 = createDB(env.DB as D1Database);

    const viewerIp = getViewerIp(request);
    const userAgent = request.headers.get('user-agent') ?? '';
    const viewerUaHash = await sha256Hex(userAgent);
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    // Check if this viewer already viewed this profile within the last hour
    const existing = db2
      .select({ id: profileViews.id })
      .from(profileViews)
      .where(
        and(
          eq(profileViews.profileUserId, id),
          eq(profileViews.viewerIp, viewerIp),
          eq(profileViews.viewerUaHash, viewerUaHash),
          gt(profileViews.viewedAt, oneHourAgo),
        ),
      )
      .get();

    if (!existing) {
      // New unique view — record dedup row and increment the profile counter
      await db2.insert(profileViews).values({
        id: ulid(),
        profileUserId: id,
        viewerIp,
        viewerUaHash,
        viewedAt: now,
      });
      await env.DB!
        .prepare('UPDATE users SET profile_view_count = profile_view_count + 1 WHERE id = ?')
        .bind(id)
        .run();
    }

    // Opportunistically delete rows older than 24h (fire-and-forget)
    const cutoff = now - 86400;
    await env.DB!
      .prepare('DELETE FROM profile_views WHERE viewed_at < ?')
      .bind(cutoff)
      .run();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = request as unknown as { waitUntil?: (p: Promise<void>) => void };
  if (ctx.waitUntil) {
    ctx.waitUntil(trackProfileView());
  } else {
    void trackProfileView().catch(() => {});
  }

  return NextResponse.json({ user, projects: userProjects });
}

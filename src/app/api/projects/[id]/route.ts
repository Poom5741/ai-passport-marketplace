import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import type { D1Database } from '@cloudflare/workers-types';
import { createDB } from '@/lib/d1';
import { getCloudflareEnv } from '@/lib/env';
import { projects, projectTags, projectViews, users } from '@/drizzle/schema';
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

// GET /api/projects/[id] — get a single project + deduped view count
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

  const project = await db
    .select({
      project: projects,
      user: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl },
    })
    .from(projects)
    .innerJoin(users, eq(projects.userId, users.id))
    .where(eq(projects.id, id))
    .get();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const tags = await db
    .select({ tag: projectTags.tag })
    .from(projectTags)
    .where(eq(projectTags.projectId, id));

  // Fire-and-forget deduped view tracking via waitUntil
  const trackView = async () => {
    if (!env.DB) return;
    const db2 = createDB(env.DB as D1Database);

    const viewerIp = getViewerIp(request);
    const userAgent = request.headers.get('user-agent') ?? '';
    const viewerUaHash = await sha256Hex(userAgent);
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    // Check if this viewer already viewed within the last hour
    const existing = db2
      .select({ id: projectViews.id })
      .from(projectViews)
      .where(
        and(
          eq(projectViews.projectId, id),
          eq(projectViews.viewerIp, viewerIp),
          eq(projectViews.viewerUaHash, viewerUaHash),
          gt(projectViews.viewedAt, oneHourAgo),
        ),
      )
      .get();

    if (!existing) {
      // New unique view — insert dedup row and increment counter
      await db2.insert(projectViews).values({
        id: ulid(),
        projectId: id,
        viewerIp,
        viewerUaHash,
        viewedAt: now,
      });
      await env.DB!
        .prepare('UPDATE projects SET view_count = view_count + 1 WHERE id = ?')
        .bind(id)
        .run();
    }

    // Opportunistically delete rows older than 24h (fire-and-forget)
    const cutoff = now - 86400;
    await env.DB!
      .prepare('DELETE FROM project_views WHERE viewed_at < ?')
      .bind(cutoff)
      .run();
  };

  // ctx.waitUntil is available in Cloudflare Pages / Workers runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = request as unknown as { waitUntil?: (p: Promise<void>) => void };
  if (ctx.waitUntil) {
    ctx.waitUntil(trackView());
  } else {
    void trackView().catch(() => {});
  }

  return NextResponse.json({
    project: {
      ...project.project,
      user: project.user,
      tags: tags.map((t) => t.tag),
    },
  });
}

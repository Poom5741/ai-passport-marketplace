import { NextRequest, NextResponse } from 'next/server';
import type { D1Database } from '@cloudflare/workers-types';
import { createDB } from '@/lib/d1';
import { getCloudflareEnv } from '@/lib/env';
import { projects, projectTags, users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET /api/projects/[id] — get a single project + fire-and-forget view count
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

  // T5: Fire-and-forget view count increment via waitUntil
  // Fires after response is sent — user never waits for this D1 write
  const incrementViewCount = (db: D1Database) =>
    db
      .prepare('UPDATE projects SET view_count = view_count + 1 WHERE id = ?')
      .bind(id)
      .run();

  // ctx.waitUntil is available in Cloudflare Pages / Workers runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = request as unknown as { waitUntil?: (p: Promise<void>) => void };
  if (ctx.waitUntil && env.DB) {
    ctx.waitUntil(incrementViewCount(env.DB) as unknown as Promise<void>);
  } else if (env.DB) {
    // Fallback: fire without blocking, ignore errors
    void incrementViewCount(env.DB).catch(() => {});
  }

  return NextResponse.json({
    project: {
      ...project.project,
      user: project.user,
      tags: tags.map((t) => t.tag),
    },
  });
}

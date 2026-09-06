import { NextRequest, NextResponse } from 'next/server';
import { ulid } from 'ulid';
import type { D1Database } from '@cloudflare/workers-types';
import { getSession } from '@/lib/auth';
import { createDB } from '@/lib/d1';
import { getCloudflareEnv } from '@/lib/env';
import { projects, projectTags, users } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { normalizeTags, MAX_TAGS } from '@/lib/tags';

// GET /api/projects — list projects with optional tag filter + pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const sort = searchParams.get('sort') ?? 'newest';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const env = getCloudflareEnv();
  if (!env.DB) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  const db = createDB(env.DB as D1Database);

  let rows;
  if (tag) {
    rows = await db
      .select({
        project: projects,
        user: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl },
        tag: projectTags.tag,
      })
      .from(projectTags)
      .innerJoin(projects, eq(projectTags.projectId, projects.id))
      .innerJoin(users, eq(projects.userId, users.id))
      .where(eq(projectTags.tag, tag.toLowerCase()))
      .orderBy(sort === 'views' ? desc(projects.viewCount) : desc(projects.createdAt))
      .limit(limit)
      .offset(offset);
  } else {
    rows = await db
      .select({
        project: projects,
        user: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl },
        tag: projectTags.tag,
      })
      .from(projects)
      .innerJoin(users, eq(projects.userId, users.id))
      .leftJoin(projectTags, eq(projects.id, projectTags.projectId))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Group tags by project
  const projectMap = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    if (!projectMap.has(row.project.id)) {
      projectMap.set(row.project.id, {
        ...row.project,
        user: row.user,
        tags: [] as string[],
      });
    }
    if (row.tag) {
      (projectMap.get(row.project.id)!.tags as string[]).push(row.tag);
    }
  }

  return NextResponse.json({ projects: Array.from(projectMap.values()) });
}

// POST /api/projects — create a project
export async function POST(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    title?: string;
    description?: string;
    liveUrl?: string;
    repoUrl?: string;
    screenshotUrl?: string;
    tags?: unknown[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, description, liveUrl, repoUrl, screenshotUrl, tags } = body;

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (title.length > 100) {
    return NextResponse.json({ error: 'Title must be 100 characters or fewer' }, { status: 400 });
  }
  if (!description || description.trim().length === 0) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  if (!liveUrl || liveUrl.trim().length === 0) {
    return NextResponse.json({ error: 'Live URL is required' }, { status: 400 });
  }
  try {
    new URL(liveUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid live URL format' }, { status: 400 });
  }

  if (repoUrl) {
    try {
      new URL(repoUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid repo URL format' }, { status: 400 });
    }
  }

  const normalizedTags = normalizeTags(tags ?? []);
  if ((tags?.length ?? 0) > MAX_TAGS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_TAGS} tags allowed` },
      { status: 400 },
    );
  }

  const env = getCloudflareEnv();
  if (!env.DB) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  const db = createDB(env.DB as D1Database);
  const projectId = ulid();
  const now = new Date();

  await db.insert(projects).values({
    id: projectId,
    userId: session.sub,
    title: title.trim(),
    description: description.trim(),
    liveUrl: liveUrl ?? null,
    repoUrl: repoUrl ?? null,
    screenshotUrl: screenshotUrl ?? null,
    viewCount: 0,
    createdAt: now,
  });

  if (normalizedTags.length > 0) {
    await db.insert(projectTags).values(
      normalizedTags.map((tag) => ({ projectId, tag })),
    );
  }

  return NextResponse.json(
    {
      project: {
        id: projectId,
        title: title.trim(),
        description: description.trim(),
        liveUrl,
        repoUrl,
        screenshotUrl,
        tags: normalizedTags,
        viewCount: 0,
        createdAt: now.toISOString(),
      },
    },
    { status: 201 },
  );
}

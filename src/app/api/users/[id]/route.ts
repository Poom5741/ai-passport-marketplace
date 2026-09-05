import { NextRequest, NextResponse } from 'next/server';
import type { D1Database } from '@cloudflare/workers-types';
import { createDB } from '@/lib/d1';
import { getCloudflareEnv } from '@/lib/env';
import { users, projects } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET /api/users/[id] — get a user profile + their projects
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

  return NextResponse.json({ user, projects: userProjects });
}

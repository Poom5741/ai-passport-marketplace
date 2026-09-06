import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/env';

const VALID_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;

// GET /api/files/[key] — serve uploaded file from R2
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  if (!VALID_KEY.test(key)) {
    return NextResponse.json({ error: 'Invalid file key format' }, { status: 400 });
  }

  const env = getCloudflareEnv();
  if (!env.UPLOADS) {
    return NextResponse.json({ error: 'Upload storage not configured' }, { status: 500 });
  }

  const object = await env.UPLOADS.get(key);

  if (!object) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Cast body — Cloudflare R2 body is a CF ReadableStream, not a standard web one
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Response(object.body as any, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

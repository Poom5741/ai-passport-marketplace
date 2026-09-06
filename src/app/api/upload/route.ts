import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCloudflareEnv } from '@/lib/env';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Parse form data ---
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // --- Validate content type ---
  const contentType = file.type;
  if (!(contentType in ALLOWED_TYPES)) {
    return NextResponse.json(
      { error: `Unsupported content type: ${contentType}. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}` },
      { status: 415 },
    );
  }

  // --- Validate file size ---
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
      { status: 413 },
    );
  }

  // --- Build R2 key ---
  const ext = ALLOWED_TYPES[contentType];
  const key = `${crypto.randomUUID()}${ext}`;

  // --- Stream to R2 ---
  const env = getCloudflareEnv();
  if (!env.UPLOADS) {
    return NextResponse.json({ error: 'Upload storage not configured' }, { status: 500 });
  }

  // Cast to any — Cloudflare Workers R2Bucket expects its own ReadableStream type
  // which is incompatible with the standard web ReadableStream in TypeScript
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await env.UPLOADS.put(key, file.stream() as any, {
    httpMetadata: { contentType },
  });

  return NextResponse.json(
    { key, url: `/api/files/${key}` },
    { status: 201 },
  );
}

import type { KVNamespace } from '@cloudflare/workers-types';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const raw = await kv.get(key, 'json');
  const record = (raw as { count: number; windowStart: number } | null);

  if (!record || record.windowStart < windowStart) {
    // New window
    await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), {
      expirationTtl: Math.ceil(WINDOW_MS / 1000),
    });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  await kv.put(key, JSON.stringify({ count: record.count + 1, windowStart: record.windowStart }), {
    expirationTtl: Math.ceil((record.windowStart + WINDOW_MS - now) / 1000),
  });

  return { allowed: true, remaining: MAX_ATTEMPTS - record.count - 1 };
}

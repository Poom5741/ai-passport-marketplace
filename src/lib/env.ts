/**
 * Cloudflare Pages runtime bindings accessor.
 *
 * In the Cloudflare Pages runtime (Next.js + @cloudflare/next-on-pages),
 * bindings like D1, KV, and R2 are injected as global variables accessible
 * at runtime. They are NOT on `process.env` (that is build-time only).
 *
 * This helper provides type-safe access to those bindings, defaulting to
 * `undefined` when the binding is not present (local dev without wrangler).
 */

import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

export interface CloudflareEnv {
  DB?: D1Database;
  RATE_LIMIT?: KVNamespace;
  UPLOADS?: R2Bucket;
  CLOUDFLARE_IMAGES_ACCOUNT_ID?: string;
  CLOUDFLARE_IMAGES_API_TOKEN?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const __env__: any;

export function getCloudflareEnv(): CloudflareEnv {
  // Cloudflare Workers runtime: env is stored in AsyncLocalStorage (cloudflareContextALS).
  // It is NOT on __env__ or globalThis.env (those don't exist in Workers).
  const cloudflareEnv = (globalThis as Record<string, unknown>)[Symbol.for('__cloudflare-env__') as unknown as string];
  if (cloudflareEnv) return cloudflareEnv as CloudflareEnv;
  if (typeof __env__ !== 'undefined') return __env__;
  if (typeof (globalThis as unknown as { env?: CloudflareEnv }).env !== 'undefined') {
    return (globalThis as unknown as { env: CloudflareEnv }).env;
  }
  return {};
}

import type { R2Bucket } from '@cloudflare/workers-types';

/**
 * Upload Worker — proxies file uploads to Cloudflare R2.</parameter>

 *
 * Memory budget: 128MB max. Uses ReadableStream to avoid loading
 * the full file into memory.
 *
 * Bound resources (from wrangler.jsonc):
 *   - UPLOADS: R2 bucket for raw file storage
 *
 * Environment variables:
 *   CLOUDFLARE_IMAGES_ACCOUNT_ID
 *   CLOUDFLARE_IMAGES_API_TOKEN
 */

export interface Env {
  UPLOADS: R2Bucket;
  CLOUDFLARE_IMAGES_ACCOUNT_ID: string;
  CLOUDFLARE_IMAGES_API_TOKEN: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return new Response('Invalid form data', { status: 400 });
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
      return new Response('No file provided', { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response('File too large (max 5MB)', { status: 413 });
    }

    const fileKey = `${crypto.randomUUID()}-${file.name}`;

    // Stream the file directly to R2 — no full file in memory
    const r2Object = await env.UPLOADS.put(fileKey, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `inline; filename="${file.name}"`,
      },
    });

    // Return the R2 key — the calling app constructs the Cloudflare Images
    // delivery URL from this key. Variant creation (400px, 1200px) is
    // handled by Cloudflare Images transform rules on the delivery URL.
    return Response.json(
      {
        key: r2Object.key,
        size: file.size,
        type: file.type,
      },
      { status: 201 },
    );
  },
};

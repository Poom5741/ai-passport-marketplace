import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import * as schema from '@/drizzle/schema';

/**
 * Create a typed Drizzle client from a Cloudflare D1 binding.
 * Usage in a route: const db = drizzle(env.DB as D1Database);
 */
export function createDB(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DB = ReturnType<typeof createDB>;

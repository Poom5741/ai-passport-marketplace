/**
 * Normalize tags: lowercase, trim whitespace, deduplicate, cap at 10.
 * @param tags - raw array of tag strings (may be empty)
 * @returns normalized array, max 10 tags
 */
export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const normalized = tag.toLowerCase().trim();
    if (!normalized) continue; // skip empty strings
    if (seen.has(normalized)) continue; // dedupe
    if (result.length >= 10) break; // cap at 10
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export const MAX_TAGS = 10;

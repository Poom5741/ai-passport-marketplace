/**
 * Tag normalization unit tests (T9)
 * Test cases from docs/implementation/tickets/t9-tag-normalization-tests.md
 */
import { describe, it, expect } from 'vitest';
import { normalizeTags, MAX_TAGS } from '@/lib/tags';

describe('normalizeTags()', () => {
  it('uppercase input becomes lowercase', () => {
    expect(normalizeTags(['Python', 'JavaScript'])).toEqual(['python', 'javascript']);
  });

  it('leading and trailing whitespace is trimmed', () => {
    expect(normalizeTags(['  python  ', '  javascript'])).toEqual(['python', 'javascript']);
  });

  it('duplicate tags are deduped', () => {
    expect(normalizeTags(['python', 'Python', 'python'])).toEqual(['python']);
  });

  it('empty string tags are filtered out', () => {
    expect(normalizeTags(['python', '', '  ', 'javascript'])).toEqual(['python', 'javascript']);
  });

  it('more than 10 tags are truncated to 10', () => {
    const input = Array.from({ length: 15 }, (_, i) => `tag${i}`);
    expect(normalizeTags(input)).toHaveLength(MAX_TAGS);
    expect(normalizeTags(input)).toEqual(Array.from({ length: MAX_TAGS }, (_, i) => `tag${i}`));
  });

  it('exactly 10 tags are all kept', () => {
    const input = Array.from({ length: 10 }, (_, i) => `tag${i}`);
    expect(normalizeTags(input)).toHaveLength(10);
  });

  it('special characters are preserved', () => {
    expect(normalizeTags(['react-native', 'node_js', 'c++'])).toEqual(['react-native', 'node_js', 'c++']);
  });

  it('Thai and unicode characters are preserved', () => {
    expect(normalizeTags(['ภาษาไทย', '日本語'])).toEqual(['ภาษาไทย', '日本語']);
  });

  it('empty array returns empty array', () => {
    expect(normalizeTags([])).toEqual([]);
  });

  it('non-array input returns empty array', () => {
    expect(normalizeTags(null as unknown)).toEqual([]);
    expect(normalizeTags(undefined as unknown)).toEqual([]);
    expect(normalizeTags('python' as unknown)).toEqual([]);
    expect(normalizeTags(123 as unknown)).toEqual([]);
  });
});

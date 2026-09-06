'use client';

import { useCallback, useRef, useState } from 'react';

const MAX_TAGS = 10;

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagInput({ tags, onChange, disabled }: TagInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(
    (raw: string) => {
      const normalized = raw.toLowerCase().trim();
      if (!normalized) return;
      if (tags.includes(normalized)) return;
      if (tags.length >= MAX_TAGS) return;
      onChange([...tags, normalized]);
      setInput('');
    },
    [tags, onChange],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag));
    },
    [tags, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Handle comma-separated paste
    if (value.includes(',')) {
      const parts = value.split(',');
      for (const part of parts.slice(0, -1)) {
        addTag(part);
      }
      setInput(parts[parts.length - 1] ?? '');
    } else {
      setInput(value);
    }
  };

  const handleBlur = () => {
    if (input.trim()) {
      addTag(input);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 min-h-[42px] cursor-text focus-within:border-zinc-500 dark:focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500"
      onClick={() => inputRef.current?.focus()}
      role="group"
      aria-label="Tags"
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-zinc-200 dark:bg-zinc-700 px-2.5 py-0.5 text-sm text-zinc-800 dark:text-zinc-200"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            disabled={disabled}
            className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            aria-label={`Remove tag ${tag}`}
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        </span>
      ))}
      {tags.length < MAX_TAGS && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={tags.length === 0 ? 'Add tags (comma-separated)' : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none text-black dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          aria-label="Add a tag"
        />
      )}
      <span className="text-xs text-zinc-400 dark:text-zinc-500 self-center ml-auto">
        {tags.length}/{MAX_TAGS}
      </span>
    </div>
  );
}

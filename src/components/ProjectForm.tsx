'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TagInput } from '@/components/TagInput';

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 2000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

interface UploadResult {
  key: string;
  url: string;
}

interface FieldErrors {
  title?: string;
  description?: string;
  liveUrl?: string;
  repoUrl?: string;
  screenshot?: string;
  tags?: string;
  submit?: string;
}

export function ProjectForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // ---- Client-side validation ----
  const validate = useCallback((): FieldErrors => {
    const errs: FieldErrors = {};

    const t = title.trim();
    if (!t) {
      errs.title = 'Title is required';
    } else if (t.length > TITLE_MAX) {
      errs.title = `Title must be ${TITLE_MAX} characters or fewer`;
    }

    const d = description.trim();
    if (!d) {
      errs.description = 'Description is required';
    } else if (d.length > DESCRIPTION_MAX) {
      errs.description = `Description must be ${DESCRIPTION_MAX} characters or fewer`;
    }

    if (liveUrl.trim()) {
      try {
        new URL(liveUrl.trim());
      } catch {
        errs.liveUrl = 'Please enter a valid URL';
      }
    } else {
      errs.liveUrl = 'Live URL is required';
    }

    if (repoUrl.trim()) {
      try {
        new URL(repoUrl.trim());
      } catch {
        errs.repoUrl = 'Please enter a valid URL';
      }
    }

    return errs;
  }, [title, description, liveUrl, repoUrl]);

  // ---- Screenshot handling ----
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate client-side
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          screenshot: 'Only PNG, JPEG, and WebP images are accepted',
        }));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors((prev) => ({
          ...prev,
          screenshot: 'File must be 5MB or smaller',
        }));
        return;
      }

      setErrors((prev) => ({ ...prev, screenshot: undefined }));

      // Show preview
      const reader = new FileReader();
      reader.onload = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload immediately
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg =
            res.status === 413
              ? 'File is too large (max 5MB)'
              : res.status === 415
                ? 'Unsupported file type'
                : res.status === 401
                  ? 'You must be logged in to upload'
                  : data.error || 'Upload failed';
          setErrors((prev) => ({ ...prev, screenshot: msg }));
          setScreenshotPreview(null);
          return;
        }

        const result: UploadResult = await res.json();
        setUploadResult(result);
      } catch {
        setErrors((prev) => ({ ...prev, screenshot: 'Upload failed. Please try again.' }));
        setScreenshotPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const removeScreenshot = useCallback(() => {
    setScreenshotPreview(null);
    setUploadResult(null);
    setErrors((prev) => ({ ...prev, screenshot: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // ---- Submit ----
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }

      if (uploading) {
        setErrors({ submit: 'Screenshot is still uploading. Please wait.' });
        return;
      }

      setErrors({});
      setSubmitting(true);

      try {
        const body = {
          title: title.trim(),
          description: description.trim(),
          liveUrl: liveUrl.trim(),
          repoUrl: repoUrl.trim() || undefined,
          screenshotUrl: uploadResult?.url ?? undefined,
          tags: tags.length > 0 ? tags : undefined,
        };

        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.status === 401) {
          setErrors({ submit: 'You must be logged in. Redirecting...' });
          setTimeout(() => router.push('/login'), 1500);
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrors({ submit: data.error || 'Failed to submit project. Please try again.' });
          return;
        }

        const data = await res.json();
        // Detect current locale from URL path
        const locale = window.location.pathname.split('/')[1] || 'en';
        router.push(`/${locale}/projects/${data.project.id}`);
      } catch {
        setErrors({ submit: 'Something went wrong. Please try again.' });
      } finally {
        setSubmitting(false);
      }
    },
    [title, description, liveUrl, repoUrl, tags, uploadResult, uploading, validate, router],
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Title */}
      <FieldGroup label="Title" htmlFor="title" required error={errors.title}>
        <input
          id="title"
          type="text"
          maxLength={TITLE_MAX}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          placeholder="My awesome project"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-black dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-500 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none transition-colors"
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        <CharCount current={title.length} max={TITLE_MAX} />
      </FieldGroup>

      {/* Description */}
      <FieldGroup label="Description" htmlFor="description" required error={errors.description}>
        <textarea
          id="description"
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
          rows={5}
          placeholder="Describe your project..."
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-black dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-500 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none transition-colors resize-y min-h-[120px]"
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        <CharCount current={description.length} max={DESCRIPTION_MAX} />
      </FieldGroup>

      {/* Screenshot */}
      <FieldGroup
        label="Screenshot"
        htmlFor="screenshot"
        error={errors.screenshot}
        hint="Optional. PNG, JPEG, or WebP. Max 5MB."
      >
        <div className="flex flex-col gap-3">
          {screenshotPreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotPreview}
                alt="Screenshot preview"
                className="rounded-md border border-zinc-200 dark:border-zinc-700 max-h-48 object-contain"
              />
              <button
                type="button"
                onClick={removeScreenshot}
                disabled={uploading || submitting}
                className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80 transition-colors disabled:opacity-50"
                aria-label="Remove screenshot"
              >
                <svg className="h-4 w-4" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                  <span className="text-white text-sm font-medium">Uploading...</span>
                </div>
              )}
            </div>
          ) : (
            <label
              htmlFor="screenshot"
              className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-8 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
            >
              <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Click to upload a screenshot
              </span>
            </label>
          )}
          <input
            ref={fileInputRef}
            id="screenshot"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={uploading || submitting}
            className="sr-only"
          />
        </div>
      </FieldGroup>

      {/* Tags */}
      <FieldGroup label="Tags" htmlFor="tags" error={errors.tags} hint="Optional. Comma-separated, max 10.">
        <TagInput tags={tags} onChange={setTags} disabled={submitting} />
      </FieldGroup>

      {/* Live URL */}
      <FieldGroup label="Live URL" htmlFor="liveUrl" required error={errors.liveUrl}>
        <input
          id="liveUrl"
          type="url"
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
          disabled={submitting}
          placeholder="https://myproject.example.com"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-black dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-500 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none transition-colors"
          aria-describedby={errors.liveUrl ? 'liveUrl-error' : undefined}
        />
      </FieldGroup>

      {/* Repo URL */}
      <FieldGroup label="Repository URL" htmlFor="repoUrl" error={errors.repoUrl} hint="Optional.">
        <input
          id="repoUrl"
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={submitting}
          placeholder="https://github.com/user/repo"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-black dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-500 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none transition-colors"
          aria-describedby={errors.repoUrl ? 'repoUrl-error' : undefined}
        />
      </FieldGroup>

      {/* Submit error */}
      {errors.submit && (
        <div
          role="alert"
          className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {errors.submit}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Project'}
      </button>
    </form>
  );
}

// ---- Helper sub-components ----

function FieldGroup({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  const over = current > max;
  return (
    <p className={`text-xs text-right ${over ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
      {current}/{max}
    </p>
  );
}

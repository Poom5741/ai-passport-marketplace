'use client';

import { useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

interface LoginFormDict {
  login: {
    emailLabel: string;
    passwordLabel: string;
    submit: string;
    submitting: string;
    noAccount: string;
    registerLink: string;
    errorMissing: string;
    errorInvalid: string;
    errorRateLimit: string;
    errorGeneric: string;
  };
}

interface FieldErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export function LoginForm({ dict }: { dict: LoginFormDict }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale;
  const t = dict.login;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email.trim() || !password) {
        setErrors({ submit: t.errorMissing });
        return;
      }

      setErrors({});
      setSubmitting(true);

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (res.status === 200) {
          router.push(`/${locale}`);
          return;
        }

        if (res.status === 429) {
          setErrors({ submit: t.errorRateLimit });
          return;
        }

        if (res.status === 401) {
          setErrors({ submit: t.errorInvalid });
          return;
        }

        const data = await res.json().catch(() => ({}));
        setErrors({ submit: data.error || t.errorGeneric });
      } catch {
        setErrors({ submit: t.errorGeneric });
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, t, router, locale],
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Email */}
      <FieldGroup
        label={t.emailLabel}
        htmlFor="email"
        required
        error={errors.email}
      >
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="email"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
      </FieldGroup>

      {/* Password */}
      <FieldGroup
        label={t.passwordLabel}
        htmlFor="password"
        required
        error={errors.password}
      >
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          autoComplete="current-password"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
      </FieldGroup>

      {/* Submit error */}
      {errors.submit && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
        >
          {errors.submit}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {submitting ? t.submitting : t.submit}
      </button>

      {/* Link to register */}
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t.noAccount}{' '}
        <a
          href={`/${locale}/register`}
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          {t.registerLink}
        </a>
      </p>
    </form>
  );
}

function FieldGroup({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
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
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

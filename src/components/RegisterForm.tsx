'use client';

import { useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

interface RegisterFormDict {
  register: {
    emailLabel: string;
    passwordLabel: string;
    displayNameLabel: string;
    submit: string;
    submitting: string;
    hasAccount: string;
    loginLink: string;
    emailHint: string;
    passwordHint: string;
    errorDuplicate: string;
    errorDomain: string;
    errorPassword: string;
    errorDisplayName: string;
    errorGeneric: string;
  };
}

interface FieldErrors {
  email?: string;
  password?: string;
  displayName?: string;
  submit?: string;
}

export function RegisterForm({ dict }: { dict: RegisterFormDict }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale;
  const t = dict.register;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback((): FieldErrors => {
    const errs: FieldErrors = {};
    if (!displayName.trim()) errs.displayName = t.errorDisplayName;
    if (!email.trim() || !email.endsWith('@ai-passport.go.th')) errs.email = t.errorDomain;
    if (!password || password.length < 8) errs.password = t.errorPassword;
    return errs;
  }, [email, password, displayName, t]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const clientErrors = validate();
      if (Object.keys(clientErrors).length > 0) {
        setErrors(clientErrors);
        return;
      }

      setErrors({});
      setSubmitting(true);

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            displayName: displayName.trim(),
          }),
        });

        if (res.status === 201) {
          router.push(`/${locale}`);
          return;
        }

        if (res.status === 409) {
          setErrors({ email: t.errorDuplicate });
          return;
        }

        const data = await res.json().catch(() => ({}));
        const msg = data.error || t.errorGeneric;

        if (msg.toLowerCase().includes('password')) {
          setErrors({ password: msg });
        } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('domain')) {
          setErrors({ email: msg });
        } else {
          setErrors({ submit: msg });
        }
      } catch {
        setErrors({ submit: t.errorGeneric });
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, displayName, validate, t, router, locale],
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Display Name */}
      <FieldGroup
        label={t.displayNameLabel}
        htmlFor="displayName"
        required
        error={errors.displayName}
      >
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={submitting}
          autoComplete="name"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          aria-describedby={errors.displayName ? 'displayName-error' : undefined}
        />
      </FieldGroup>

      {/* Email */}
      <FieldGroup
        label={t.emailLabel}
        htmlFor="email"
        required
        error={errors.email}
        hint={t.emailHint}
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
        hint={t.passwordHint}
      >
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          autoComplete="new-password"
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

      {/* Link to login */}
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {t.hasAccount}{' '}
        <a
          href={`/${locale}/login`}
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          {t.loginLink}
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

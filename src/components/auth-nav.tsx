'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

interface AuthNavProps {
  locale: Locale;
  dict: {
    nav: {
      submitProject: string;
      signIn: string;
      myProfile: string;
      signOut: string;
    };
  };
}

export function AuthNav({ locale, dict }: AuthNavProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.userId ?? null);
      } else {
        setUserId(null);
      }
    } catch {
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      setUserId(null);
      router.push(`/${locale}`);
    } catch {
      // ignore
    }
  };

  if (userId) {
    return (
      <div className="flex items-center gap-3">
        <a
          href={`/${locale}/projects/new`}
          className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {dict.nav.submitProject}
        </a>
        <a
          href={`/${locale}/users/${userId}`}
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {dict.nav.myProfile}
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {dict.nav.signOut}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href={`/${locale}/projects/new`}
        className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {dict.nav.submitProject}
      </a>
      <a
        href={`/${locale}/login`}
        className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {dict.nav.signIn}
      </a>
    </div>
  );
}

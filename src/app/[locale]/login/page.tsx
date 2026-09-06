import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '@/lib/i18n';
import { LoginForm } from '@/components/LoginForm';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (session) {
    redirect(`/${locale}`);
  }

  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-8 text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {dict.auth.login.title}
      </h1>
      <LoginForm dict={dict.auth} />
    </div>
  );
}

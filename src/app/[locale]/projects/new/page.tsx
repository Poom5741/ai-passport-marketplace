import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ProjectForm } from '@/components/ProjectForm';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '@/lib/i18n';

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login`);
  }
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 mb-8">
        {dict.submit.title}
      </h1>
      <ProjectForm dict={dict} />
    </div>
  );
}

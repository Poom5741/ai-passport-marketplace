import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { localeNames, locales, type Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/dictionaries';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { AuthNav } from '@/components/auth-nav';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return {
    title: dict.feed.title,
    description: dict.feed.subtitle,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}`]),
      ),
    },
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
              <a
                href={`/${locale}`}
                className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                {dict.nav.logo}
              </a>
              <nav className="hidden items-center gap-4 sm:flex" aria-label="Main navigation">
                <a
                  href={`/${locale}`}
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {dict.nav.feed}
                </a>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <AuthNav locale={locale as Locale} dict={dict} />
              <LocaleSwitcher />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              {dict.common.copyright}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

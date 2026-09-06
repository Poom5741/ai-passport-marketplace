import type { Locale } from './i18n';

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((m) => m.default),
  th: () => import('@/dictionaries/th.json').then((m) => m.default),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};

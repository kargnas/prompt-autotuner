import i18n, { type TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { SavedPrompt } from './types';
import { DEFAULT_LANGUAGE, resources, SUPPORTED_LANGUAGES, type Language } from './translations';

export const LANGUAGE_STORAGE_KEY = 'gemini-tuner-language';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  ko: 'KO',
  'zh-CN': 'SC',
  'zh-TW': 'TC',
};

export const isSupportedLanguage = (value: string): value is Language => (
  SUPPORTED_LANGUAGES.includes(value as Language)
);

const TRADITIONAL_CHINESE_ALIASES = [
  'zh-tw',
  'zh-hk',
  'zh-mo',
  'zh-hant',
  'zh-cht',
  'tw',
  'hk',
  'mo',
  'cht',
];

const SIMPLIFIED_CHINESE_ALIASES = [
  'zh',
  'zh-cn',
  'zh-sg',
  'zh-hans',
  'zh-chs',
  'cn',
  'c',
  'chs',
];

const normalizeLanguageToken = (value?: string | null) => {
  if (!value) {
    return null;
  }

  return value
    .split(',')[0]
    .split(';')[0]
    .trim()
    .replace(/_/g, '-')
    .toLowerCase();
};

const matchChineseVariant = (value?: string | null): Language | null => {
  const normalized = normalizeLanguageToken(value);

  if (!normalized) {
    return null;
  }

  if (TRADITIONAL_CHINESE_ALIASES.some(alias => normalized === alias || normalized.startsWith(`${alias}-`))) {
    return 'zh-TW';
  }

  if (SIMPLIFIED_CHINESE_ALIASES.some(alias => normalized === alias || normalized.startsWith(`${alias}-`))) {
    return 'zh-CN';
  }

  if (normalized.startsWith('zh-')) {
    return normalized.includes('hant') ? 'zh-TW' : 'zh-CN';
  }

  return null;
};

const canonicalizeLanguage = (value?: string | null): Language | null => {
  const chineseVariant = matchChineseVariant(value);
  if (chineseVariant) {
    return chineseVariant;
  }

  const normalized = normalizeLanguageToken(value);
  if (!normalized) {
    return null;
  }

  if (isSupportedLanguage(normalized)) {
    return normalized;
  }

  if (normalized.startsWith('en')) {
    return 'en';
  }

  if (normalized.startsWith('ko')) {
    return 'ko';
  }

  return null;
};

export const resolveLanguage = (value?: string | null): Language => {
  return canonicalizeLanguage(value) ?? DEFAULT_LANGUAGE;
};

const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const candidates = [
    ...(window.navigator.languages ?? []),
    window.navigator.language,
  ];

  for (const candidate of candidates) {
    const resolved = canonicalizeLanguage(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return DEFAULT_LANGUAGE;
};

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  try {
    const savedLanguage = canonicalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (savedLanguage) {
      return savedLanguage;
    }

    return detectBrowserLanguage();
  } catch (error) {
    console.error('Failed to load language from localStorage', error);
    return detectBrowserLanguage();
  }
};

const persistLanguage = (language: string) => {
  const resolved = resolveLanguage(language);

  if (typeof document !== 'undefined') {
    document.documentElement.lang = resolved;
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolved);
    } catch (error) {
      console.error('Failed to save language to localStorage', error);
    }
  }
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    returnNull: false,
  });

persistLanguage(getInitialLanguage());
i18n.on('languageChanged', persistLanguage);

export const getSavedPromptSourceLabel = (
  prompt: Pick<SavedPrompt, 'source' | 'sourceAttempt' | 'sourceLabel'>,
  t: TFunction,
) => {
  switch (prompt.source) {
    case 'initialPrompt':
      return t('saved.sourceInitialPrompt');
    case 'finalResult':
      return t('saved.sourceFinalResult');
    case 'attempt':
      return t('saved.sourceAttempt', { attempt: prompt.sourceAttempt ?? '?' });
    case 'legacy':
      return prompt.sourceLabel ?? t('saved.sourceFinalResult');
    default:
      return t('saved.sourceFinalResult');
  }
};

export default i18n;

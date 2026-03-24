import i18n, { type TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { SavedPrompt } from './types';
import { DEFAULT_LANGUAGE, resources, SUPPORTED_LANGUAGES, type Language } from './translations';

export const LANGUAGE_STORAGE_KEY = 'gemini-tuner-language';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  ko: 'KO',
  'zh-CN': 'ZH',
};

export const isSupportedLanguage = (value: string): value is Language => (
  SUPPORTED_LANGUAGES.includes(value as Language)
);

export const resolveLanguage = (value?: string | null): Language => {
  if (value && isSupportedLanguage(value)) {
    return value;
  }

  return DEFAULT_LANGUAGE;
};

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  try {
    return resolveLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch (error) {
    console.error('Failed to load language from localStorage', error);
    return DEFAULT_LANGUAGE;
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

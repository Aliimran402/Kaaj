import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { bn } from './bn';
import { en } from './en';

export const LANGUAGES = ['bn', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'kaaj.language';

function savedLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'bn';
  } catch {
    return 'bn'; // storage blocked: Bangla is the default
  }
}

void i18n.use(initReactI18next).init({
  resources: { bn: { translation: bn }, en: { translation: en } },
  lng: savedLanguage(),
  fallbackLng: 'bn',
  supportedLngs: LANGUAGES,
  nsSeparator: false,
  interpolation: { escapeValue: false }, // React escapes values already
  initAsync: false, // resources are bundled, so t() works right after this call
});

function applyLanguage(language: string) {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // the choice is then kept only until the page is reloaded
  }
}

applyLanguage(i18n.language);
i18n.on('languageChanged', applyLanguage);

/** The language the app is showing now: 'bn' or 'en'. */
export function currentLanguage(): Language {
  return i18n.resolvedLanguage === 'en' ? 'en' : 'bn';
}

export function setLanguage(language: Language) {
  void i18n.changeLanguage(language);
}

export default i18n;

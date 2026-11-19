import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage, type Language } from '../i18n';

/** বাংলা | English toggle. The choice is remembered in this browser. */
export function LanguageSwitch() {
  const { t, i18n } = useTranslation();
  const current: Language = i18n.resolvedLanguage === 'en' ? 'en' : 'bn';
  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="flex items-center rounded-full border border-line-strong bg-white p-0.5"
    >
      <Globe aria-hidden className="mx-1.5 hidden size-4 text-muted sm:block" />
      {LANGUAGES.map((language) => {
        const active = language === current;
        return (
          <button
            key={language}
            type="button"
            lang={language}
            aria-pressed={active}
            aria-label={t(`language.${language}`)}
            onClick={() => setLanguage(language)}
            className={`focus-ring min-h-11 min-w-11 rounded-full px-3 text-sm transition-colors ${
              active ? 'bg-brand-soft font-bold text-brand' : 'text-muted hover:text-ink'
            }`}
          >
            <span className="sm:hidden">{t(`language.${language}Short`)}</span>
            <span className="hidden sm:inline">{t(`language.${language}`)}</span>
          </button>
        );
      })}
    </div>
  );
}

import 'i18next';
import type { Messages } from './bn';

// Typed keys: t('auth.login.title') is checked against bn.ts at compile time.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Messages };
  }
}

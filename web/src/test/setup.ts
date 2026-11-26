import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import i18n from '../i18n';

// jsdom has no scrolling; React Router's ScrollRestoration calls these.
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

beforeEach(async () => {
  await i18n.changeLanguage('en'); // tests read the English texts
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
});

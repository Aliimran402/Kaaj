import { useEffect } from 'react';

/** Sets the browser tab title, so every page has its own (and screen readers announce it). */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Kaaj`;
  }, [title]);
}

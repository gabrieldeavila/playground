import { useEffect } from 'react';

/** Adds a stylesheet link to the page while the component is mounted (e.g. Google Fonts). */
export function useStylesheet(href: string | null) {
  useEffect(() => {
    if (!href) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    return () => link.remove();
  }, [href]);
}

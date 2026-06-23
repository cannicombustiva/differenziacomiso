'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook. Returns false on the server and on the first
 * client render, then updates after mount so layout-dependent rendering stays
 * hydration-consistent.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}

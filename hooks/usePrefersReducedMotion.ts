import { useEffect, useState } from 'react';

/**
 * Tracks the OS-level prefers-reduced-motion setting via matchMedia.
 *
 * SSR-safe: returns `false` on the server and on first client render, then
 * flips to the real value after mount. That brief mismatch is intentional —
 * the alternative (defaulting to `true`) would cause animations to never
 * fire on devices that don't actually have the setting on.
 *
 * Listens for changes so animations respect a toggle mid-session.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

'use client';

import { useEffect } from 'react';

/**
 * ScrollToTop component ensures the page always loads at the top position
 * Prevents scroll wheel from pushing the page down on startup
 */
export default function ScrollToTop() {
  useEffect(() => {
    // Deep link to a hash anchor — let page.tsx own scroll positioning;
    // stomping with scrollTo(0,0) here would interrupt the hash scroll.
    if (typeof window !== 'undefined' && window.location.hash) {
      return;
    }

    // Scroll to top immediately on mount
    window.scrollTo(0, 0);

    // Force scroll to top after a short delay to handle any layout shifts
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Also handle route changes in Next.js
  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return null; // This component doesn't render anything
}

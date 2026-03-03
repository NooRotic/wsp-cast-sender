'use client';

import { useEffect } from 'react';

/**
 * ScrollToTop component ensures the page always loads at the top position
 * Prevents scroll wheel from pushing the page down on startup
 */
export default function ScrollToTop() {
  useEffect(() => {
    // Scroll to top immediately on mount
    window.scrollTo(0, 0);
    
    // Force scroll to top after a short delay to handle any layout shifts
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    // Also handle page refresh scenarios
    const handleBeforeUnload = () => {
      window.scrollTo(0, 0);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
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

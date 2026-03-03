'use client';

import { useEffect } from 'react';

// Extend window type
declare global {
  interface Window {
    __castSDKInitialized?: boolean;
  }
}

export default function ClientScript() {
  useEffect(() => {
    // Prevent scroll restoration and ensure page starts at top
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    // Immediately scroll to top
    window.scrollTo(0, 0);

    // Global flag to track Cast SDK initialization
    window.__castSDKInitialized = false;

    // Override console.log to catch Cast SDK initialization messages
    const originalLog = console.log;
    console.log = function(...args) {
      const message = args.join(' ');
      if (message.includes('Cast Receiver already initialized globally')) {
        console.warn('Detected duplicate Cast initialization - this is expected in development');
        return;
      }
      originalLog.apply(console, args);
    };
  }, []);

  return null; // This component renders nothing
}

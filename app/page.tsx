'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import TimelineCallout from '@/components/TimelineCallout';
import { useAnimation } from '@/contexts/AnimationContext';

// Content sections — render via SSR/static export so crawlers, link-preview
// bots, and JS-disabled clients see real markup. Code-splitting via dynamic()
// still keeps each section in its own bundle chunk.
const HeroSection = dynamic(() => import('@/components/HeroSection'));
const SkillsShowcase = dynamic(() => import('@/components/SkillsShowcase'));
const ProjectsSection = dynamic(() => import('@/components/ProjectsSection'));
const ContactSection = dynamic(() => import('@/components/ContactSection'));

// Browser-only widgets — kept ssr:false because they depend on window APIs
// (Cast SDK state) or are currently unused dead code.
const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false, loading: () => null });
const CastConnectButton = dynamic(() => import('@/components/CastConnectButton'), { ssr: false, loading: () => null });

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const { heroAnimationsComplete, userHasScrolled, setUserHasScrolled } = useAnimation();
  const contentVisible = heroAnimationsComplete || userHasScrolled;

  // On mount: if landing on a hash (cross-route nav from /media-demo etc.),
  // reveal the below-fold and scroll to the target once its dynamic section
  // mounts. Otherwise, reset to top like a normal page load.
  useEffect(() => {
    if (typeof window === 'undefined') {
      setHasMounted(true);
      return;
    }

    const hash = window.location.hash;
    if (hash) {
      // Keep below-fold hidden during the polling so the user doesn't see
      // sections loading at the top before the jump. offsetHeight still
      // works against opacity:0 elements (layout is independent of paint),
      // so the stability check is unaffected. Once stable, jump instantly
      // and reveal in the same tick — user goes hero → contact, no flash.
      let lastHeight = 0;
      let stableCount = 0;
      const tryScroll = (attempts = 0) => {
        const el = document.querySelector(hash) as HTMLElement | null;
        const docHeight = document.documentElement.scrollHeight;
        if (el && el.offsetHeight > 0) {
          if (docHeight === lastHeight) {
            stableCount++;
            if (stableCount >= 3) {
              el.scrollIntoView({ behavior: 'auto' });
              setUserHasScrolled(true);
              return;
            }
          } else {
            stableCount = 0;
          }
        }
        lastHeight = docHeight;
        if (attempts < 50) {
          setTimeout(() => tryScroll(attempts + 1), 100);
        } else {
          // Fallback — reveal anyway so the user isn't stuck on a hero-only page
          setUserHasScrolled(true);
        }
      };
      tryScroll();
    } else {
      window.scrollTo(0, 0);
    }
    setHasMounted(true);
  }, [setUserHasScrolled]);

  const belowFoldStyle: React.CSSProperties = {
    opacity: contentVisible ? 1 : 0,
    transition: 'opacity 0.6s ease',
    pointerEvents: contentVisible ? 'auto' : 'none',
  };

  return (
    <main className="relative min-h-screen">

      {/* Persistent Cast Connect Button (bottom center) - pointer-events enabled so it's clickable.
          Wrapped in Suspense so its ssr:false bailout doesn't propagate up the tree and abort
          SSR of the rest of the page. */}
      <div className="fixed left-1/2 bottom-8 z-[9999] -translate-x-1/2 flex items-center justify-center select-none" style={{ width: '100%', maxWidth: '100vw' }}>
        <Suspense fallback={null}>
          <CastConnectButton />
        </Suspense>
      </div>

      {/* Google Cast Launcher positioned in top right corner - only render after mount */}
      {hasMounted && (
        <div className="fixed top-4 left-1 z-500 cast-launcher-wrapper hidden">
          <google-cast-launcher className="w-full h-full"></google-cast-launcher>
        </div>
      )}
      {hasMounted && (
        <Navigation />
      )}

      {/* Hero section — always visible, owns the intro animation */}
      <section id="home">
        <HeroSection />
        {/* TimelineCallout sits directly below the hero fold — hide until intro completes */}
        <div style={belowFoldStyle}>
          <TimelineCallout />
        </div>
      </section>

      {/* Below-fold sections hidden until hero animation completes or user scrolls.
          The inner components own their own <section id="..."> markup, so wrapping
          them here would create duplicate IDs. */}
      <div style={belowFoldStyle}>
        <ProjectsSection />
        <SkillsShowcase />
        <ContactSection />

        <footer className="pt-10 text-center text-gray-400 relative z-10 min-h-[200px] flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4">
            <p>&copy; 2025 WSP - Senior Software Engineer. All rights reserved.</p>
            <p className="m-2 text-sm">Built with Next.js, TypeScript, GSAP, and Tailwind CSS</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
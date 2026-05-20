'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';
import TimelineCallout from '@/components/TimelineCallout';
import { useAnimation } from '@/contexts/AnimationContext';

// Lazy-load heavier / background components to defer loading of videos and large bundles
const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false, loading: () => null });
const HeroSection = dynamic(() => import('@/components/HeroSection'), { ssr: false, loading: () => null });
const SkillsShowcase = dynamic(() => import('@/components/SkillsShowcase'), { ssr: false, loading: () => null });
const ProjectsSection = dynamic(() => import('@/components/ProjectsSection'), { ssr: false, loading: () => null });
const ContactSection = dynamic(() => import('@/components/ContactSection'), { ssr: false, loading: () => null });
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
      setUserHasScrolled(true);
      const tryScroll = (attempts = 0) => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else if (attempts < 20) {
          setTimeout(() => tryScroll(attempts + 1), 100);
        }
      };
      setTimeout(() => tryScroll(), 50);
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

      {/* Persistent Cast Connect Button (bottom center) - pointer-events enabled so it's clickable */}
      <div className="fixed left-1/2 bottom-8 z-[9999] -translate-x-1/2 flex items-center justify-center select-none" style={{ width: '100%', maxWidth: '100vw' }}>
        <CastConnectButton />
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

      {/* Below-fold sections hidden until hero animation completes or user scrolls */}
      <div style={belowFoldStyle}>
        <section id="projects"><ProjectsSection /></section>
        <section id="skills"><SkillsShowcase /></section>
        <section id="contact"><ContactSection /></section>

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
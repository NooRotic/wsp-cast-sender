'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/Navigation';

// Lazy-load heavier / background components to defer loading of videos and large bundles
const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false, loading: () => null });
const HeroSection = dynamic(() => import('@/components/HeroSection'), { ssr: false, loading: () => null });
const SkillsShowcase = dynamic(() => import('@/components/SkillsShowcase'), { ssr: false, loading: () => null });
const ProjectsSection = dynamic(() => import('@/components/ProjectsSection'), { ssr: false, loading: () => null });
const ContactSection = dynamic(() => import('@/components/ContactSection'), { ssr: false, loading: () => null });
const CastConnectButton = dynamic(() => import('@/components/CastConnectButton'), { ssr: false, loading: () => null });

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);

  // Ensure page starts at top on first render and track mounted state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    setHasMounted(true);
  }, []);

  // DRY: map sections to keep page concise and easier to maintain
  const sections: { id: string; Component: any }[] = [
    { id: 'home', Component: HeroSection },
    { id: 'projects', Component: ProjectsSection },
    { id: 'skills', Component: SkillsShowcase },
    { id: 'contact', Component: ContactSection },
  ];

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
      {sections.map(({ id, Component }) => (
        <section id={id} key={id}>
          <Component />
        </section>
      ))}

      {/* Defer background until after render to avoid video load on first paint */}
      {/* <ParticleBackground /> */}

      <footer className="pt-10 text-center text-gray-400 relative z-10 min-h-[200px] flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4">
          <p>&copy; 2025 WSP - Senior Software Engineer. All rights reserved.</p>
          <p className="m-2 text-sm">Built with Next.js, TypeScript, GSAP, and Tailwind CSS</p>
        </div>
      </footer>
    </main>
  );
}
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCast } from '@/contexts/CastContext';
import { Button } from '@/components/ui/button';
import { Cast } from 'lucide-react';

interface CastConnectButtonProps {
  className?: string;
}

const GOLD = '#E2A42B';


export const CastConnectButton: React.FC<CastConnectButtonProps> = ({ className = '' }) => {
  const { isConnected, isAvailable, connectionStatus, requestSession } = useCast();
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [delayReady, setDelayReady] = useState(false);
  const router = useRouter();
  const btnRef = useRef<HTMLDivElement>(null);
  // GSAP entrance and floating animation
  useEffect(() => {
    if (!btnRef.current) return;
    let tl: any;
    if (show) {
      import('gsap').then(({ gsap }) => {
        tl = gsap.timeline();
        tl.fromTo(
          btnRef.current,
          { y: 32, opacity: 0, scale: 0.7 },
          {
            y: 0,
            opacity: 1,
            scale: 0.85,
            duration: 0.95,
            ease: 'back.out(1.7)',
          }
        ).to(
          btnRef.current,
          {
            scale: 0.9,
            repeat: -1,
            yoyo: true,
            duration: 1.6,
            ease: 'sine.inOut',
          },
          '+=0.1'
        );
      });
    } else {
      import('gsap').then(({ gsap }) => {
        gsap.to(btnRef.current, {
          y: 32,
          opacity: 0,
          scale: 0.7,
          duration: 0.5,
          ease: 'power1.in',
        });
      });
    }
    return () => {
      if (tl) tl.kill();
    };
  }, [show]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Delay logic: wait 6s after cast is available before showing
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isAvailable && !isConnected) {
      setDelayReady(false);
      timer = setTimeout(() => setDelayReady(true), 10e3);
    } else {
      setDelayReady(false);
      if (timer) clearTimeout(timer);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [isAvailable, isConnected]);

  useEffect(() => {
    // Show button if cast devices are available, not connected, and delayReady
    if (mounted && isAvailable && !isConnected && delayReady) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [isAvailable, isConnected, mounted, delayReady]);

  const handleClick = async () => {
    // Navigate to /cast-demo, then trigger cast device chooser
    router.push('/cast-demo');
    setTimeout(() => {
      requestSession && requestSession();
    }, 400); // Give time for navigation
  };

  return (
    <div
      ref={btnRef}
      className={`fixed bottom-2 left-1/2 -translate-x-1/2 z-50 drop-shadow-xl ${className}`}
      style={{ pointerEvents: 'auto', display: show ? undefined : 'none', transform: 'translateX(-50%)' }}
    >
      <Button
        variant="outline"
        size="default"
        onClick={handleClick}
        className="flex items-center gap-2 font-bold border-2 border-[#E2A42B]/60 bg-black/80 text-[#E2A42B] hover:bg-[#E2A42B]/10 hover:text-[#E2A42B] shadow-lg shadow-[#E2A42B]/30 animate-cast-glow px-4 py-2 rounded-lg pointer-events-auto focus:ring-2 focus:ring-[#E2A42B] focus:ring-offset-2"
        style={{
          boxShadow: '0 0 16px 2px #E2A42B88, 0 2px 8px #0008',
          textShadow: '0 0 8px #E2A42B88',
        }}
        title="Connect to Cast Device"
        aria-label="Connect to Cast Device"
      >
        <Cast className="w-5 h-5 mr-1 text-[#E2A42B]" />
        <span>Casting Available!</span>
      </Button>
      <style jsx global>{`
        @keyframes cast-glow {
          0%, 100% { box-shadow: 0 0 16px 2px #E2A42B88, 0 2px 8px #0008; }
          50% { box-shadow: 0 0 32px 8px #E2A42Bcc, 0 2px 16px #E2A42B44; }
        }
        .animate-cast-glow {
          animation: cast-glow 4.8s infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default CastConnectButton;

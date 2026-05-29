'use client';

import { useEffect, useRef } from 'react';

// Site-wide animated background. Extracted from the StarfieldCanvas function
// that originally lived inside components/TimelineView.tsx so /timeline could
// have it. Now mounted at the layout level so every route shares the look.
//
// Pathname-aware routing lives in components/SiteBackground.tsx now. This
// component just renders the canvas at the requested opacity; the switcher
// decides what to mount where.
//
// Performance: 260 stars + 18 hero stars + 6 nebulae render in under 1ms
// per frame on a mid-tier laptop. Canvas 2D, no shaders, no textures. The
// useEffect mounts the RAF loop once on first client paint and tears it
// down on unmount; the canvas element itself is a sibling of the rest of
// the layout tree so route changes do not remount it.

interface Props {
  /** CSS opacity applied to the whole canvas. 0..1. Default 1.0. */
  opacity?: number;
}

export default function StarfieldBackground({ opacity = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let scrollY = 0;
    let frame = 0;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();

    type Star = { nx: number; ny: number; vx: number; vy: number; r: number; alpha: number; parallax: number; twinkle: number };
    const stars: Star[] = Array.from({ length: 260 }, () => ({
      nx: Math.random(),
      ny: Math.random(),
      vx: (Math.random() - 0.5) * 0.00011,
      vy: (Math.random() - 0.5) * 0.000075,
      r: Math.random() * 1.5 + 0.25,
      alpha: Math.random() * 0.55 + 0.12,
      parallax: Math.random() * 0.22 + 0.04,
      twinkle: Math.random() * Math.PI * 2,
    }));

    const heroStars: Star[] = Array.from({ length: 18 }, () => ({
      nx: Math.random(),
      ny: Math.random(),
      vx: (Math.random() - 0.5) * 0.00004,
      vy: (Math.random() - 0.5) * 0.000025,
      r: Math.random() * 1.8 + 1.2,
      alpha: Math.random() * 0.4 + 0.35,
      parallax: Math.random() * 0.06 + 0.01,
      twinkle: Math.random() * Math.PI * 2,
    }));

    type Nebula = { nx: number; ny: number; vx: number; vy: number; baseR: number; hue: number; alpha: number; pulseOffset: number };
    const nebulae: Nebula[] = [
      { nx: 0.12, ny: 0.28, vx:  0.000028, vy:  0.000018, baseR: 290, hue: 275, alpha: 0.052, pulseOffset: 0.0 },
      { nx: 0.78, ny: 0.52, vx: -0.000020, vy:  0.000012, baseR: 220, hue: 205, alpha: 0.042, pulseOffset: 1.2 },
      { nx: 0.42, ny: 0.82, vx:  0.000015, vy: -0.000022, baseR: 195, hue: 155, alpha: 0.038, pulseOffset: 2.5 },
      { nx: 0.88, ny: 0.14, vx: -0.000018, vy:  0.000030, baseR: 240, hue: 320, alpha: 0.048, pulseOffset: 3.8 },
      { nx: 0.28, ny: 0.62, vx:  0.000022, vy: -0.000015, baseR: 180, hue: 185, alpha: 0.033, pulseOffset: 5.1 },
      { nx: 0.55, ny: 0.35, vx: -0.000010, vy:  0.000008, baseR: 160, hue: 240, alpha: 0.028, pulseOffset: 0.7 },
    ];

    const drawAll = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      nebulae.forEach(b => {
        b.nx = (b.nx + b.vx + 1) % 1;
        b.ny = (b.ny + b.vy + 1) % 1;
        const pulse = 1 + 0.07 * Math.sin(b.pulseOffset + frame * 0.0025);
        const cx = b.nx * W;
        const cy = b.ny * H;
        const r = b.baseR * pulse;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `hsla(${b.hue}, 55%, 38%, ${b.alpha * pulse})`);
        grad.addColorStop(0.5, `hsla(${b.hue}, 45%, 25%, ${b.alpha * 0.4})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      const renderStars = (layer: Star[]) => {
        layer.forEach(s => {
          s.nx = (s.nx + s.vx + 1) % 1;
          s.ny = (s.ny + s.vy + 1) % 1;
          const scrollOffset = (scrollY * s.parallax * 0.00018) % 1;
          const drawX = s.nx * W;
          const drawY = ((s.ny - scrollOffset + 1) % 1) * H;
          const tw = s.alpha * (0.7 + 0.3 * Math.sin(s.twinkle + frame * 0.016));
          ctx.beginPath();
          ctx.arc(drawX, drawY, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${tw})`;
          ctx.fill();
        });
      };

      renderStars(stars);

      heroStars.forEach(s => {
        s.nx = (s.nx + s.vx + 1) % 1;
        s.ny = (s.ny + s.vy + 1) % 1;
        const scrollOffset = (scrollY * s.parallax * 0.00018) % 1;
        const drawX = s.nx * W;
        const drawY = ((s.ny - scrollOffset + 1) % 1) * H;
        const tw = s.alpha * (0.75 + 0.25 * Math.sin(s.twinkle + frame * 0.009));
        const glow = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, s.r * 4);
        glow.addColorStop(0, `rgba(200,220,255,${tw * 0.25})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(drawX, drawY, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(drawX, drawY, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,248,255,${tw})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(drawAll);
    };

    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    drawAll();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 0,
        opacity,
        transition: 'opacity 0.6s ease-in-out',
      }}
      aria-hidden="true"
    />
  );
}

'use client';

import { useEffect, useRef } from 'react';

// Matrix-rain canvas background. Vertical columns of falling glyphs with a
// fading trail effect. Brand neon green on near-black. Replaces the
// RainCode_sm.mp4 video that used to live in public/bgs/.
//
// Trail effect: instead of clearing the canvas each frame, we paint a thin
// translucent black sheet on top. The fillStyle alpha decides the fade rate.
// Lower alpha = longer trails. 0.05 produces the classic "ghost" length.
//
// Performance: ~60 columns × 1 char draw per frame = 60 draw calls. Plus the
// translucent black fill. Under 0.5 ms on a mid-tier laptop. Cheaper than
// the starfield.

const GLYPHS = 'アァカサタナハマヤラワABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
const FONT_SIZE = 12;
const FADE_ALPHA = 0.04;      // lower = longer trails
const SPAWN_RESET_CHANCE = 0.975; // higher = columns reset more rarely
const BRIGHT_HEAD = true;     // render the leading character in near-white

// Per-column fall speed range, in rows per frame at 60 fps. Uniform 1.0
// felt mechanical (all columns sliding in lockstep) and too fast (60 rows/s
// = ~720 px/s rip). Varied 0.2-0.6 reads closer to the original Wachowski
// cadence: faster columns are eye-catchers while slower ones build
// atmospheric depth in the background.
const SPEED_MIN = 0.2;
const SPEED_RANGE = 0.4;

// Internal alphas calibrated so the field reads cleanly at the
// SiteBackground SUBTLE_OPACITY multiplier (0.4 at time of writing):
//   body 0.92 * 0.4 = ~0.37 rendered, head 1.0 * 0.4 = 0.4 rendered.
const BODY_ALPHA = 0.92;
const HEAD_ALPHA = 1.0;

interface Props {
  /** CSS opacity applied to the whole canvas. 0..1. Default 1.0. */
  opacity?: number;
}

export default function MatrixRainBackground({ opacity = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    let columns = Math.floor(W / FONT_SIZE);
    // Each entry tracks y (row position, float for subpixel travel) and
    // speed (rows per frame). Per-column speed variance is what makes the
    // field feel alive instead of mechanically uniform.
    type Drop = { y: number; speed: number };
    const newDrop = (): Drop => ({
      y: Math.random() * -50,
      speed: SPEED_MIN + Math.random() * SPEED_RANGE,
    });
    let drops: Drop[] = Array(columns).fill(0).map(newDrop);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      columns = Math.floor(W / FONT_SIZE);
      // Preserve existing drops where possible; extend or trim.
      const next: Drop[] = Array(columns);
      for (let i = 0; i < columns; i++) {
        next[i] = drops[i] ?? newDrop();
      }
      drops = next;
    };
    resize();

    const draw = () => {
      // Translucent black sheet to fade the previous frame's glyphs.
      // Using the html bg color so the trail blends with the page.
      ctx.fillStyle = `rgba(10, 10, 10, ${FADE_ALPHA})`;
      ctx.fillRect(0, 0, W, H);

      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.textBaseline = 'top';

      for (let i = 0; i < drops.length; i++) {
        const char = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        const x = i * FONT_SIZE;
        const y = drops[i].y * FONT_SIZE;

        // Body glyph: brand neon green at the calibrated body alpha so
        // characters stay readable through the SiteBackground multiplier.
        ctx.fillStyle = `rgba(57, 255, 20, ${BODY_ALPHA})`;
        ctx.fillText(char, x, y);

        // Bright leading glyph: near-white, just above the body.
        if (BRIGHT_HEAD && drops[i].y > 0) {
          ctx.fillStyle = `rgba(220, 255, 220, ${HEAD_ALPHA})`;
          ctx.fillText(char, x, y - FONT_SIZE);
        }

        // Reset column to top when it scrolls off the bottom, but only
        // probabilistically so columns don't all reset in unison.
        if (y > H && Math.random() > SPAWN_RESET_CHANCE) {
          drops[i].y = 0;
        }
        drops[i].y += drops[i].speed;
      }

      raf = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
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

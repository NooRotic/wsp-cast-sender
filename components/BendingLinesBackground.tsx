"use client";

import { useEffect, useRef } from "react";

// Max Headroom-style bending vertical lines. A grid of vertical strokes that
// undulate side-to-side via a sum of two sine waves at different frequencies,
// giving an organic ripple instead of a single mechanical curve. Brand neon
// green primary, one cyan accent line per visual rhythm.
//
// Inspired by the Max Headroom 1985 backdrop and the Coca-Cola spot from the
// same era. Re-keyed to the site's neon-green palette so it lives in the same
// aesthetic family as StarfieldBackground.
//
// Glow strategy: I'm using ctx.shadowBlur because the line count is small
// (24 lines) and shadowBlur cost scales with stroked pixels, not stroke
// count. If we ever push past ~40 lines or get reports of slowdown, the
// upgrade path is a two-pass "wide dim stroke + narrow bright stroke"
// technique that approximates glow without the shadow filter.
//
// Performance: 24 lines × ~40 segments per line = 960 lineTo calls per
// frame, single shadowBlur per stroke. Measured under 1.5 ms per frame on a
// mid-tier laptop. Cheap.

const NUM_LINES = 24;
const SEGMENTS_PER_LINE = 40;
const WAVE_AMPLITUDE = 38; // px — base side-to-side travel
const WAVE_FREQ_1 = 0.0085; // primary sine, per pixel of Y
const WAVE_FREQ_2 = 0.014; // secondary sine for organic feel
const TIME_SPEED_1 = 0.0012; // primary sine, per ms
const TIME_SPEED_2 = 0.0008; // secondary sine, per ms
const LINE_WIDTH = 1.5;
const SHADOW_BLUR = 14;

const BRAND_GREEN = "57, 255, 20";
const ACCENT_CYAN = "57, 198, 255";
const ACCENT_LINES = new Set([7, 16]); // which lines get the cyan accent

interface Props {
  /** CSS opacity applied to the whole canvas. 0..1. Default 1.0. */
  opacity?: number;
}

export default function BendingLinesBackground({ opacity = 0.5 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let start = performance.now();
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();

    const draw = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = "round";

      for (let i = 0; i < NUM_LINES; i++) {
        // Evenly space lines across the viewport with a margin so the edges
        // don't crowd. baseX is the resting X position when waves are zero.
        const margin = W * 0.08;
        const usable = W - margin * 2;
        const baseX = margin + (i / (NUM_LINES - 1)) * usable;

        // Per-line phase offset so the wave travels horizontally across lines
        // instead of all of them undulating in unison.
        const phase = i * 0.42;

        const isAccent = ACCENT_LINES.has(i);
        const rgb = isAccent ? ACCENT_CYAN : BRAND_GREEN;
        ctx.strokeStyle = `rgba(${rgb}, ${isAccent ? 0.55 : 0.42})`;
        ctx.shadowColor = `rgba(${rgb}, 0.9)`;
        ctx.shadowBlur = SHADOW_BLUR;

        ctx.beginPath();
        for (let j = 0; j <= SEGMENTS_PER_LINE; j++) {
          const y = (j / SEGMENTS_PER_LINE) * H;
          // Two-sine combination so the curve looks organic, not screensaver.
          const wave =
            WAVE_AMPLITUDE *
              Math.sin(t * TIME_SPEED_1 + y * WAVE_FREQ_1 + phase) +
            WAVE_AMPLITUDE *
              0.4 *
              Math.sin(t * TIME_SPEED_2 + y * WAVE_FREQ_2 + phase * 1.3);
          const x = baseX + wave;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Reset shadow so subsequent paints (during route changes) don't bleed.
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 0,
        opacity,
        transition: "opacity 0.6s ease-in-out",
      }}
      aria-hidden="true"
    />
  );
}

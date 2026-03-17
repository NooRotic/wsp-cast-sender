"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import timelineData from '@/data/timeline.json';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TCategory {
  id: string;
  label: string;
  color: string;
  description: string;
}

interface TEra {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  color: string;
  description: string;
}

interface TNode {
  id: string;
  date: string;
  endDate?: string;
  category: string;
  title: string;
  shortTitle: string;
  description: string;
  isHighlight: boolean;
  tags: string[];
  logo?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "normal" spacing = 48px → 100%. Default compact = 24px → 50%.
const SPACING_NORMAL  = 48;
const SPACING_MIN     = 1;
const SPACING_MAX     = 220;
const SPACING_STEP    = 3;
const SPACING_DEFAULT = 24;

// Timeline zoom — scales the entire timeline body (Flash-style transform)
const ZOOM_DEFAULT = 1.00;
const ZOOM_MAX     = 2.50;
const ZOOM_MIN     = 0.0004;
const ZOOM_STEP    = 0.04;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  if (!month) return year;
  return `${MONTH_LABELS[parseInt(month)]} ${year}`;
}

function getEraForDate(dateStr: string, eras: TEra[]): TEra | undefined {
  const year = parseInt(dateStr.split('-')[0]);
  return eras.find(e => year >= e.startYear && year <= e.endYear);
}

/** Replace the last numeric group before ')' in an rgba() string */
function eraAlpha(color: string, alpha: number): string {
  return color.replace(/[\d.]+\)$/, `${alpha})`);
}

/** Strip alpha from rgba to get solid color */
function eraRgb(color: string): string {
  return color.replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')');
}

// ─── StarfieldCanvas — continuous drift, not scroll-only ─────────────────────

function StarfieldCanvas() {
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

    // Stars — normalized coords (0-1) + velocity for continuous drift
    type Star = { nx: number; ny: number; vx: number; vy: number; r: number; alpha: number; parallax: number; twinkle: number };
    const stars: Star[] = Array.from({ length: 260 }, () => ({
      nx: Math.random(),
      ny: Math.random(),
      // Very slow drift — gives a "floating adrift in space" feel
      vx: (Math.random() - 0.5) * 0.00011,
      vy: (Math.random() - 0.5) * 0.000075,
      r: Math.random() * 1.5 + 0.25,
      alpha: Math.random() * 0.55 + 0.12,
      parallax: Math.random() * 0.22 + 0.04, // scroll parallax depth
      twinkle: Math.random() * Math.PI * 2,
    }));

    // A handful of large "hero" stars — brighter, slower
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

    // Nebulae — slow drift + pulse
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

      // Nebulae — drift + breathe
      nebulae.forEach(b => {
        b.nx = (b.nx + b.vx + 1) % 1;
        b.ny = (b.ny + b.vy + 1) % 1;
        const pulse = 1 + 0.07 * Math.sin(b.pulseOffset + frame * 0.0025);
        const cx = b.nx * W;
        const cy = b.ny * H;
        const r  = b.baseR * pulse;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `hsla(${b.hue}, 55%, 38%, ${b.alpha * pulse})`);
        grad.addColorStop(0.5, `hsla(${b.hue}, 45%, 25%, ${b.alpha * 0.4})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render both star layers
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

      // Hero stars get a subtle glow
      heroStars.forEach(s => {
        s.nx = (s.nx + s.vx + 1) % 1;
        s.ny = (s.ny + s.vy + 1) % 1;
        const scrollOffset = (scrollY * s.parallax * 0.00018) % 1;
        const drawX = s.nx * W;
        const drawY = ((s.ny - scrollOffset + 1) % 1) * H;
        const tw = s.alpha * (0.75 + 0.25 * Math.sin(s.twinkle + frame * 0.009));
        // Glow halo
        const glow = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, s.r * 4);
        glow.addColorStop(0, `rgba(200,220,255,${tw * 0.25})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(drawX, drawY, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.beginPath();
        ctx.arc(drawX, drawY, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,248,255,${tw})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(drawAll);
    };

    const onScroll = () => { scrollY = window.scrollY; };
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
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

// ─── Floating Quotes ─────────────────────────────────────────────────────────

function FloatingQuotes({ quotes }: { quotes: { text: string; author: string }[] }) {
  const [visibleIdx, setVisibleIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setVisibleIdx(i => (i + 1) % quotes.length), 9000);
    return () => clearInterval(id);
  }, [quotes.length]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }} aria-hidden="true">
      {quotes.map((q, i) => (
        <div
          key={i}
          className="absolute italic text-sm leading-relaxed max-w-[260px]"
          style={{
            opacity: visibleIdx === i ? 0.16 : 0,
            color: '#8899aa',
            left: `${10 + (i * 17) % 52}%`,
            top: `${20 + (i * 11) % 58}%`,
            transform: `rotate(${-4 + (i % 3) * 3}deg)`,
            transition: 'opacity 2.8s ease-in-out',
          }}
        >
          &ldquo;{q.text}&rdquo;
          <div className="text-xs mt-1 not-italic opacity-60">— {q.author}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Sticky Filter Bar ────────────────────────────────────────────────────────

function StickyFilterBar({
  categories,
  active,
  onToggle,
}: {
  categories: TCategory[];
  active: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap px-4 py-3">
      {categories.map((c, i) => (
        <button
          key={c.id}
          onClick={() => onToggle(c.id)}
          className="filter-pill px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200 whitespace-nowrap"
          style={{
            borderColor: c.color,
            color: active.has(c.id) ? '#000' : c.color,
            background: active.has(c.id) ? c.color : 'transparent',
            opacity: active.has(c.id) ? 1 : 0.55,
            animationDelay: `${0.25 + i * 0.1}s`,
          }}
          title={c.description}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

// ─── Left Panel — Legend + Scale ─────────────────────────────────────────────

function LeftPanel({
  categories,
  active,
  nodeSpacing,
  onZoomIn,
  onZoomOut,
  onSpacingChange,
  timelineZoom,
  onTimelineZoomIn,
  onTimelineZoomOut,
  onTimelineZoomChange,
}: {
  categories: TCategory[];
  active: Set<string>;
  nodeSpacing: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSpacingChange: (v: number) => void;
  timelineZoom: number;
  onTimelineZoomIn: () => void;
  onTimelineZoomOut: () => void;
  onTimelineZoomChange: (v: number) => void;
}) {
  const spacingPercent = Math.round((nodeSpacing / SPACING_NORMAL) * 100);
  const zoomPercent    = Math.round(timelineZoom * 100);

  return (
    <div
      className="fixed left-2"
      style={{ top: 140, zIndex: 30, width: 156 }}
    >
      <div
        className="rounded-xl border"
        style={{
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(255,255,255,0.07)',
        }}
      >
        {/* Legend */}
        <div className="px-3 pt-3 pb-2">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#4a5568' }}>
            Legend
          </div>
          {categories.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-2 mb-1.5"
              style={{ opacity: active.has(c.id) ? 1 : 0.28 }}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  background: c.color,
                  boxShadow: active.has(c.id) ? `0 0 5px ${c.color}` : 'none',
                }}
              />
              <span className="text-xs truncate" style={{ color: active.has(c.id) ? '#ccc' : '#555' }}>
                {c.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bubble Spacing controls */}
        <div
          className="px-3 pb-2 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#4a5568' }}>
            Bubble Spacing
          </div>
          <input
            type="range"
            className="timeline-slider timeline-slider--green"
            min={SPACING_MIN} max={SPACING_MAX} step={SPACING_STEP}
            value={nodeSpacing}
            onChange={e => onSpacingChange(Number(e.target.value))}
          />
          <div className="flex items-center gap-1.5 mt-1.5">
            <button
              onClick={onZoomOut}
              disabled={nodeSpacing <= SPACING_MIN}
              className="w-8 h-8 rounded flex items-center justify-center text-base font-bold transition-all hover:opacity-80 disabled:opacity-25"
              style={{ background: 'rgba(57,255,20,0.12)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.25)' }}
              aria-label="Less spacing"
            >
              −
            </button>
            <span className="flex-1 text-center text-xs font-mono" style={{ color: '#39FF14' }}>
              {spacingPercent}%
            </span>
            <button
              onClick={onZoomIn}
              disabled={nodeSpacing >= SPACING_MAX}
              className="w-8 h-8 rounded flex items-center justify-center text-base font-bold transition-all hover:opacity-80 disabled:opacity-25"
              style={{ background: 'rgba(57,255,20,0.12)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.25)' }}
              aria-label="More spacing"
            >
              +
            </button>
          </div>
        </div>

        {/* Timeline Zoom — GSAP-scales the entire timeline body */}
        <div
          className="px-3 pb-3 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#4a5568' }}>
            Timeline Zoom
          </div>
          <input
            type="range"
            className="timeline-slider timeline-slider--cyan"
            min={ZOOM_MIN} max={ZOOM_MAX} step={ZOOM_STEP}
            value={timelineZoom}
            onChange={e => onTimelineZoomChange(Number(e.target.value))}
          />
          <div className="flex items-center gap-1.5 mt-1.5">
            <button
              onClick={onTimelineZoomOut}
              disabled={timelineZoom <= ZOOM_MIN}
              className="w-8 h-8 rounded flex items-center justify-center text-base font-bold transition-all hover:opacity-80 disabled:opacity-25"
              style={{ background: 'rgba(0,200,255,0.12)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.25)' }}
              aria-label="Zoom out timeline"
            >
              −
            </button>
            <span className="flex-1 text-center text-xs font-mono" style={{ color: '#00C8FF' }}>
              {zoomPercent}%
            </span>
            <button
              onClick={onTimelineZoomIn}
              disabled={timelineZoom >= ZOOM_MAX}
              className="w-8 h-8 rounded flex items-center justify-center text-base font-bold transition-all hover:opacity-80 disabled:opacity-25"
              style={{ background: 'rgba(0,200,255,0.12)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.25)' }}
              aria-label="Zoom in timeline"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Minimap Panel — Right side, full-height vertical scrubber ────────────────

function MinimapPanel({
  nodes,
  progress,
  viewportRatio,
  categoryMap,
}: {
  nodes: TNode[];
  progress: number;
  viewportRatio: number;
  categoryMap: Record<string, TCategory>;
}) {
  const scrollToNode = (idx: number) => {
    const els = document.querySelectorAll('[data-timeline-node]');
    els[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div
      className="fixed right-3 top-20 bottom-4 flex items-stretch justify-center pointer-events-none"
      style={{ zIndex: 30, width: 16 }}
    >
      <div className="relative flex-1 flex justify-center">
        {/* Rail */}
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{ width: 3, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.06)' }}
        >
          {/* Scrolled-past fill — subtle trail */}
          <div
            className="absolute top-0 left-0 w-full rounded-full"
            style={{
              height: `${progress * 100}%`,
              background: 'linear-gradient(to bottom, rgba(57,255,20,0.08), rgba(57,255,20,0.22))',
              transition: 'height 0.15s linear',
            }}
          />
        </div>

        {/* Viewport band — glowing window showing current view position */}
        {viewportRatio > 0 && viewportRatio < 1 && (
          <div
            className="absolute pointer-events-none"
            style={{
              top:    `${progress * (1 - viewportRatio) * 100}%`,
              height: `${viewportRatio * 100}%`,
              left: '50%',
              width: 11,
              transform: 'translateX(-50%)',
              background: 'rgba(57,255,20,0.14)',
              borderRadius: 3,
              border: '1px solid rgba(57,255,20,0.85)',
              boxShadow: [
                '0 0 4px  rgba(57,255,20,0.95)',   // tight inner glow
                '0 0 10px rgba(57,255,20,0.70)',   // mid bloom
                '0 0 20px rgba(57,255,20,0.40)',   // outer diffuse
                '0 0 32px rgba(57,255,20,0.18)',   // farthest halo
              ].join(', '),
              transition: 'top 0.12s linear',
            }}
          />
        )}

        {/* Clickable node dots — pointer-events re-enabled per-button */}
        {nodes.map((n, i) => {
          const cat = categoryMap[n.category];
          const pct = (i / Math.max(nodes.length - 1, 1)) * 100;
          const sz = n.isHighlight ? 5 : 2;
          return (
            <button
              key={n.id}
              onClick={() => scrollToNode(i)}
              className="absolute rounded-full focus:outline-none hover:scale-[2.2] transition-transform"
              style={{
                width: sz,
                height: sz,
                top: `${pct}%`,
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: cat?.color ?? '#888',
                boxShadow: n.isHighlight ? `0 0 4px ${cat?.color}` : 'none',
                pointerEvents: 'auto',
              }}
              title={n.shortTitle}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Year Marker ──────────────────────────────────────────────────────────────

function YearMarker({ year, nodeSpacing }: { year: number; nodeSpacing: number }) {
  const isDecade = year % 10 === 0;
  const pad      = Math.max(8, Math.round(nodeSpacing * 0.4));

  return (
    <div className="relative w-full" style={{ paddingTop: pad, paddingBottom: pad }}>
      {/* Horizontal rule behind the text — wide for decades, narrower otherwise */}
      <div
        className="absolute"
        style={{
          top: '50%',
          left:  isDecade ? '4%'  : '22%',
          right: isDecade ? '4%'  : '22%',
          height: 1,
          transform: 'translateY(-50%)',
          background: isDecade
            ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.14) 18%, rgba(255,255,255,0.14) 82%, transparent)'
            : 'linear-gradient(to right, transparent, rgba(255,255,255,0.05) 18%, rgba(255,255,255,0.05) 82%, transparent)',
        }}
      />
      {/* Year text — centered on spine, opaque bg masks the rule + spine line */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <span
          className="font-mono block text-center select-none"
          style={{
            fontSize:   isDecade ? 32 : 20,
            fontWeight: isDecade ? 800 : 500,
            color:      isDecade ? '#ffffff' : '#777',
            letterSpacing: '0.07em',
            lineHeight: 1,
            padding: '0 10px',
            background: 'rgba(0,0,0,0.88)',
            textShadow: isDecade
              ? '0 0 18px rgba(255,255,255,0.55), 0 0 36px rgba(255,255,255,0.22)'
              : 'none',
          }}
        >
          {year}
        </span>
      </div>
    </div>
  );
}

// ─── Era Banner ───────────────────────────────────────────────────────────────

function EraBanner({ era }: { era: TEra }) {
  const lineColor  = eraAlpha(era.color, 0.35);
  const textColor  = eraRgb(era.color);
  const borderColor = eraAlpha(era.color, 0.38);
  const bgColor    = eraAlpha(era.color, 0.07);

  return (
    <div className="relative flex items-center gap-3 my-6 select-none">
      <div className="flex-1 h-px" style={{ background: lineColor }} />
      <div
        className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border whitespace-nowrap"
        style={{ color: textColor, borderColor, background: bgColor, letterSpacing: '0.14em' }}
      >
        {era.label}
      </div>
      <div className="flex-1 h-px" style={{ background: lineColor }} />
    </div>
  );
}

// ─── Timeline Node ────────────────────────────────────────────────────────────

const WSP_CATEGORIES = new Set(['personal', 'career', 'education']);

function TimelineNode({
  node,
  side,
  category,
  isExpanded,
  nodeSpacing,
  onToggle,
}: {
  node: TNode;
  side: 'left' | 'right';
  category: TCategory;
  isExpanded: boolean;
  nodeSpacing: number;
  onToggle: () => void;
}) {
  const isYAH     = node.id === 'you-are-here';
  const isCompact = nodeSpacing < SPACING_NORMAL;
  const isWsp     = WSP_CATEGORIES.has(node.category);
  const dotSize   = node.isHighlight ? (isCompact ? 14 : 18) : (isCompact ? 8 : 11);
  const cardPad   = isCompact ? 'p-3' : 'p-5';

  return (
    <div
      className="relative flex items-start justify-between"
      data-timeline-node={node.id}
      style={{ marginBottom: nodeSpacing }}
    >
      {/* Connecting line — card box edge to spine dot center.
          With justify-between the two w-5/12 cards sit at 0–41.667% and 58.333–100%.
          Spine dot center = 50%. Line fills the gap between card edge and spine. */}
      <div
        className="absolute h-px pointer-events-none"
        style={{
          top: 10 + Math.round(dotSize / 2),
          ...(side === 'left'
            ? { left: 'calc(41.667% - 2rem)', right: 'calc(50% + 1px)' }
            : { left: 'calc(50% + 1px)',       right: 'calc(41.667% - 2rem)' }
          ),
          background: `${category.color}66`,
        }}
      />

      {/* Content card */}
      <div className={`w-5/12 ${side === 'right' ? 'pl-8 order-last' : 'pr-8'}`}>
        <div
          onClick={onToggle}
          className={`timeline-card rounded-xl ${cardPad} cursor-pointer border`}
          style={{
            '--glow-color': category.color,
            borderColor: isExpanded
              ? category.color
              : isWsp
              ? `${category.color}70`
              : `${category.color}30`,
            background: isExpanded ? `${category.color}0e` : 'rgba(4,4,8,0.72)',
            boxShadow: isExpanded
              ? `0 0 22px ${category.color}44`
              : isWsp
              ? `0 0 10px ${category.color}33`
              : 'none',
            textAlign: side === 'left' ? 'right' : 'left',
            animation: isWsp && !isExpanded ? 'wspGlow 3s ease-in-out infinite' : undefined,
          } as React.CSSProperties}
        >
          <div
            className="font-mono mb-0.5"
            style={{ fontSize: isCompact ? 13 : 16, color: category.color, opacity: 0.9 }}
          >
            {formatDate(node.date)}
            {node.endDate && !isCompact && ` – ${formatDate(node.endDate)}`}
          </div>

          {/* Title row — with inline logo in collapsed state */}
          <div
            className="flex items-center gap-1.5 leading-snug"
            style={{
              justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
              flexDirection: side === 'left' ? 'row-reverse' : 'row',
            }}
          >
            {node.logo && !isExpanded && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={node.logo}
                alt=""
                aria-hidden="true"
                style={{
                  width: isCompact ? 28 : 30,
                  height: isCompact ? 28 : 30,
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: 'invert(1)',
                  opacity: 0.60,
                }}
              />
            )}
            <span
              className="text-white"
              style={{
                fontSize: isCompact
                  ? (node.isHighlight ? 16 : 14)
                  : (node.isHighlight ? 22 : 18),
                fontWeight: isWsp ? 700 : 600,
                letterSpacing: isWsp ? '-0.01em' : undefined,
              }}
            >
              {node.title}
            </span>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-2" style={{ overflow: 'hidden' }}>
              {/* Logo floats so description text wraps around it */}
              {node.logo && (
                <div
                  className="rounded-lg p-2"
                  style={{
                    float: side === 'left' ? 'right' : 'left',
                    margin: side === 'left' ? '0 0 6px 13px' : '0 13px 6px 0',
                    background: `${category.color}12`,
                    border: `1px solid ${category.color}30`,
                    boxShadow: `0 0 12px ${category.color}22`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={node.logo}
                    alt=""
                    aria-hidden="true"
                    style={{
                      width: 55,
                      height: 55,
                      objectFit: 'contain',
                      filter: 'invert(1)',
                      opacity: 0.85,
                    }}
                  />
                </div>
              )}
              {node.endDate && (
                <div className="font-mono" style={{ fontSize: 12, color: category.color, opacity: 0.75 }}>
                  → {formatDate(node.endDate)}
                </div>
              )}
              <p
                className="leading-relaxed"
                style={{ fontSize: isWsp ? 16 : 15, color: isWsp ? '#d1d5db' : '#9ca3af' }}
              >
                {node.description}
              </p>
              {node.tags.length > 0 && (
                <div
                  className="flex flex-wrap gap-1 mt-2"
                  style={{ justifyContent: side === 'left' ? 'flex-end' : 'flex-start' }}
                >
                  {node.tags.map(t => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#777' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spine dot */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: 10 }}>
        <div
          className="rounded-full border-2 transition-all duration-300"
          style={{
            width: dotSize,
            height: dotSize,
            borderColor: category.color,
            background: isExpanded || isYAH ? category.color : '#000',
            boxShadow: isYAH
              ? `0 0 0 4px ${category.color}28, 0 0 0 8px ${category.color}12, 0 0 16px ${category.color}50`
              : isExpanded
              ? `0 0 12px ${category.color}80`
              : 'none',
          }}
        />
        {isYAH && (
          <div
            className="mt-1.5 font-bold px-2 py-0.5 rounded whitespace-nowrap animate-pulse"
            style={{
              fontSize: 10,
              color: category.color,
              border: `1px solid ${category.color}`,
              background: `${category.color}12`,
            }}
          >
            YOU ARE HERE
          </div>
        )}
      </div>

      {/* Spacer — keeps justify-between working now that year labels are on the spine */}
      <div className="w-5/12" aria-hidden="true" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TimelineView() {
  const containerRef     = useRef<HTMLDivElement>(null);
  const spineRef         = useRef<HTMLDivElement>(null);
  const timelineScaleRef = useRef<HTMLDivElement>(null);  // GSAP zoom target
  const leftPanelRef     = useRef<HTMLDivElement>(null);  // fade-in wrapper
  const minimapRef       = useRef<HTMLDivElement>(null);  // fade-in wrapper
  const heroRef          = useRef<HTMLDivElement>(null);  // fade-in wrapper
  const timelineFadeRef  = useRef<HTMLDivElement>(null);  // fade-in wrapper

  const [expandedId, setExpandedId]           = useState<string | null>(null);
  const [scrollProgress, setScrollProgress]   = useState(0);
  const [nodeSpacing, setNodeSpacing]         = useState(SPACING_DEFAULT);
  const [timelineZoom, setTimelineZoom]       = useState(ZOOM_DEFAULT);
  const [naturalHeight, setNaturalHeight]     = useState(0);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(timelineData.meta.categories.map(c => c.id))
  );

  const categoryMap = useMemo<Record<string, TCategory>>(
    () => Object.fromEntries(timelineData.meta.categories.map(c => [c.id, c])),
    []
  );

  // Fraction of timeline visible at once — re-derived whenever zoom or layout changes.
  // Using naturalHeight * timelineZoom (not document.scrollHeight) keeps it
  // scoped to the timeline section only, independent of hero/nav height.
  const viewportRatio = useMemo(() => {
    if (naturalHeight === 0 || typeof window === 'undefined') return 0;
    return Math.min(1, window.innerHeight / (naturalHeight * timelineZoom));
  }, [naturalHeight, timelineZoom]);

  const sortedNodes = useMemo<TNode[]>(
    () =>
      [...(timelineData.nodes as TNode[])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    []
  );

  const filteredNodes = useMemo(
    () => sortedNodes.filter(n => activeCategories.has(n.category)),
    [sortedNodes, activeCategories]
  );

  const annotatedNodes = useMemo(() => {
    let lastEraId = '';
    let lastYear  = '';
    const result: Array<
      | { type: 'era';  era: TEra }
      | { type: 'year'; year: number }
      | { type: 'node'; node: TNode; index: number }
    > = [];
    let nodeIdx = 0;
    filteredNodes.forEach(node => {
      const era = getEraForDate(node.date, timelineData.meta.eras as TEra[]);
      if (era && era.id !== lastEraId) {
        lastEraId = era.id;
        result.push({ type: 'era', era });
      }
      const year = node.date.split('-')[0];
      if (year !== lastYear) {
        lastYear = year;
        result.push({ type: 'year', year: Number(year) });
      }
      result.push({ type: 'node', node, index: nodeIdx++ });
    });
    return result;
  }, [filteredNodes]);

  // GSAP spine scroll-draw
  useEffect(() => {
    if (!spineRef.current || !containerRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      onUpdate: self => {
        setScrollProgress(self.progress);
        if (spineRef.current) {
          spineRef.current.style.transform = `scaleY(${self.progress})`;
        }
      },
    });
    return () => st.kill();
  }, []);

  // IntersectionObserver — node reveal
  useEffect(() => {
    const nodeEls = document.querySelectorAll('[data-timeline-node]');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'translateX(0)';
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    nodeEls.forEach((el, i) => {
      const isLeft = i % 2 === 0;
      const e = el as HTMLElement;
      e.style.opacity = '0';
      e.style.transform = `translateX(${isLeft ? -28 : 28}px)`;
      e.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredNodes]);

  const toggleCategory = (id: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const zoomIn  = () => setNodeSpacing(s => Math.min(s + SPACING_STEP, SPACING_MAX));
  const zoomOut = () => setNodeSpacing(s => Math.max(s - SPACING_STEP, SPACING_MIN));

  const timelineZoomIn  = () => setTimelineZoom(z => parseFloat(Math.min(z + ZOOM_STEP, ZOOM_MAX).toFixed(2)));
  const timelineZoomOut = () => setTimelineZoom(z => parseFloat(Math.max(z - ZOOM_STEP, ZOOM_MIN).toFixed(2)));

  // Measure natural height (at scale 1) before each zoom change so the
  // height-keeper wrapper stays in sync and scroll area shrinks correctly.
  useLayoutEffect(() => {
    const el = timelineScaleRef.current;
    if (!el) return;
    gsap.set(el, { scale: 1, immediateRender: true });
    setNaturalHeight(el.scrollHeight);
    gsap.set(el, { scale: timelineZoom, immediateRender: true });
  }, [filteredNodes, nodeSpacing]);

  // Smooth GSAP scale animation whenever timelineZoom changes
  useEffect(() => {
    const el = timelineScaleRef.current;
    if (!el || naturalHeight === 0) return;
    gsap.to(el, {
      scale: timelineZoom,
      transformOrigin: 'top center',
      duration: 0.45,
      ease: 'power2.out',
    });
  }, [timelineZoom, naturalHeight]);

  // Hero word-by-word GSAP sequence + side panel fade-in.
  // Pills animate via CSS @keyframes pillDrop — no GSAP needed for them.
  // Every other element starts at opacity:0 via inline JSX — no gsap.set needed.
  useEffect(() => {
    const lp = leftPanelRef.current;
    const mm = minimapRef.current;
    const tl = timelineFadeRef.current;
    if (!lp || !mm || !tl) return;

    // ── Timeline body slides up from below with heavy Flash-era ease
    gsap.fromTo(tl,
      { opacity: 0, y: 90 },
      { opacity: 1, y: 0, duration: 1.15, delay: 1.1, ease: 'power4.out' }
    );

    // ── Stage 1: name words stagger up (4 words × 0.09s = 0.36s window)
    gsap.fromTo('.hero-name-word',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.09, delay: 0.25, ease: 'power3.out' }
    );

    // ── Stage 2: subtitle fades in after last name word settles
    gsap.fromTo('.hero-subtitle',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.45, delay: 0.85, ease: 'power2.out' }
    );

    // ── Stage 3: "25 Years" — scale pop from slightly small
    gsap.fromTo('.hero-h1-line1',
      { opacity: 0, scale: 0.82, y: 6 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, delay: 1.35, ease: 'back.out(1.6)', transformOrigin: 'center center' }
    );

    // ── Stage 4: "in the Making" — words stagger in below
    gsap.fromTo('.hero-h1-word',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, delay: 1.85, ease: 'power2.out' }
    );

    // ── Stage 5: scroll hint
    gsap.fromTo('.hero-scroll',
      { opacity: 0 },
      { opacity: 1, duration: 0.5, delay: 2.25, ease: 'power2.out' }
    );

    // ── Stage 6: side panels slide in after hero finishes
    gsap.set(lp, { opacity: 0 });
    gsap.set(mm, { opacity: 0 });
    gsap.to(lp, { opacity: 1, duration: 0.65, delay: 2.4, ease: 'power2.out' });
    gsap.to(mm, { opacity: 1, duration: 0.65, delay: 2.6, ease: 'power2.out' });
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      {/* WSP node glow keyframe — color driven by --glow-color CSS var on each card */}
      <style>{`
        @keyframes wspGlow {
          0%,100% { box-shadow: 0 0 8px var(--glow-color), 0 0 0 1px color-mix(in srgb, var(--glow-color) 45%, transparent); }
          50%      { box-shadow: 0 0 22px var(--glow-color), 0 0 0 1.5px var(--glow-color), 0 0 38px color-mix(in srgb, var(--glow-color) 35%, transparent); }
        }
        .timeline-card {
          transition: box-shadow 0.22s ease, border-color 0.22s ease, transform 0.18s ease !important;
        }
        .timeline-card:hover {
          box-shadow: 0 0 32px var(--glow-color), 0 0 64px color-mix(in srgb, var(--glow-color) 18%, transparent) !important;
          border-color: var(--glow-color) !important;
          transform: scale(1.018);
        }
        .timeline-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          background: rgba(255,255,255,0.08);
        }
        .timeline-slider--green { accent-color: #39FF14; }
        .timeline-slider--green::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #39FF14;
          box-shadow: 0 0 6px rgba(57,255,20,0.8);
          cursor: pointer;
        }
        .timeline-slider--green::-webkit-slider-runnable-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(57,255,20,0.2);
        }
        .timeline-slider--cyan { accent-color: #00C8FF; }
        .timeline-slider--cyan::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #00C8FF;
          box-shadow: 0 0 6px rgba(0,200,255,0.8);
          cursor: pointer;
        }
        .timeline-slider--cyan::-webkit-slider-runnable-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(0,200,255,0.2);
        }
        @keyframes pillDrop {
          from { transform: translateY(-52px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .filter-pill {
          animation: pillDrop 0.65s cubic-bezier(0.34,1.56,0.64,1) backwards;
        }
      `}</style>

      {/* Z-0: starfield */}
      <StarfieldCanvas />

      {/* Z-1: floating quotes */}
      <FloatingQuotes quotes={timelineData.meta.quotes} />

      {/* Z-30: left panel — legend + bubble spacing + timeline zoom */}
      <div ref={leftPanelRef} style={{ opacity: 0 }}>
        <LeftPanel
          categories={timelineData.meta.categories as TCategory[]}
          active={activeCategories}
          nodeSpacing={nodeSpacing}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onSpacingChange={v => setNodeSpacing(v)}
          timelineZoom={timelineZoom}
          onTimelineZoomIn={timelineZoomIn}
          onTimelineZoomOut={timelineZoomOut}
          onTimelineZoomChange={v => setTimelineZoom(parseFloat(v.toFixed(2)))}
        />
      </div>

      {/* Z-30: right minimap — full-height vertical scrubber */}
      <div ref={minimapRef} style={{ opacity: 0 }}>
        <MinimapPanel
          nodes={filteredNodes}
          progress={scrollProgress}
          viewportRatio={viewportRatio}
          categoryMap={categoryMap}
        />
      </div>

      {/* ── Page content ─────────────────────────── */}

      {/* Words start opacity:0 individually — wrapper is visible from paint */}
      <div ref={heroRef} className="relative px-4 text-center" style={{ zIndex: 10, paddingTop: 66, paddingBottom: 32 }}>

        {/* Name — each word animates in with stagger */}
        <p className="font-mono mb-1 uppercase ml-6" style={{ fontSize: 28, letterSpacing: '0.2em', color: '#ffffff' }}>
          {['Walter', 'Steve', 'Pollard', 'Jr'].map(w => (
            <span key={w} className="hero-name-word" style={{ display: 'inline-block', opacity: 0, marginRight: '0.55em' }}>{w}</span>
          ))}
        </p>

        {/* Subtitle — single fade */}
        <p className="hero-subtitle font-mono mb-8 uppercase" style={{ fontSize: 15, color: '#6b7280', letterSpacing: '0.16em', opacity: 0 }}>
          Software Engineer&nbsp;·&nbsp;Video&nbsp;·&nbsp;Chromecast&nbsp;·&nbsp;AI
        </p>

        {/* h1 — two lines, each animates separately */}
        <h1 className="font-bold text-white mb-2" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', lineHeight: 1.08 }}>
          <span className="block">
            <span className="hero-h1-line1" style={{ color: '#39FF14', display: 'inline-block', opacity: 0 }}>
              25 Years
            </span>
          </span>
          <span className="block">
            {['in', 'the', 'Making'].map(w => (
              <span key={w} className="hero-h1-word" style={{ display: 'inline-block', opacity: 0, marginRight: '0.22em' }}>{w}</span>
            ))}
          </span>
        </h1>

        {/* Scroll hint */}
        <div className="hero-scroll mt-8 font-medium animate-bounce" style={{ fontSize: 15, color: '#4b5563', opacity: 0 }}>
          ↓ scroll to explore
        </div>
      </div>

      {/* Filter pills — scrolls with page, sits between hero and timeline */}
      <StickyFilterBar
        categories={timelineData.meta.categories as TCategory[]}
        active={activeCategories}
        onToggle={toggleCategory}
      />

      {/* Timeline — height-keeper shrinks with GSAP zoom so scroll area stays correct */}
      <div
        ref={timelineFadeRef}
        style={{
          position: 'relative',
          height: naturalHeight > 0 ? naturalHeight * timelineZoom : undefined,
          transition: 'height 0.45s cubic-bezier(0.25,0,0.25,1)',
          zIndex: 10,
          opacity: 0,
        }}
      >
        <div
          ref={timelineScaleRef}
          style={{
            position: naturalHeight > 0 ? 'absolute' : 'relative',
            top: 0, left: 0, right: 0,
            transformOrigin: 'top center',
          }}
        >
          <div
            ref={containerRef}
            className="relative mx-auto px-4 pt-8 pb-48"
            style={{ maxWidth: 860 }}
          >
            {/* Spine rail */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{ left: '50%', transform: 'translateX(-50%)', width: 2, background: 'rgba(57,255,20,0.07)' }}
            >
              <div
                ref={spineRef}
                style={{
                  width: '100%',
                  height: '100%',
                  background:
                    'linear-gradient(to bottom, transparent 0%, rgba(57,255,20,0.5) 15%, rgba(57,255,20,0.5) 85%, transparent 100%)',
                  transformOrigin: 'top center',
                  transform: 'scaleY(0)',
                }}
              />
            </div>

            {/* Nodes + era banners + year markers */}
            {annotatedNodes.map(item => {
              if (item.type === 'era') {
                return <EraBanner key={`era-${item.era.id}`} era={item.era} />;
              }
              if (item.type === 'year') {
                return <YearMarker key={`year-${item.year}`} year={item.year} nodeSpacing={nodeSpacing} />;
              }
              const { node, index } = item;
              const cat = categoryMap[node.category] ?? {
                color: '#888', label: 'Unknown', id: node.category, description: '',
              };
              return (
                <TimelineNode
                  key={node.id}
                  node={node}
                  side={index % 2 === 0 ? 'left' : 'right'}
                  category={cat}
                  isExpanded={expandedId === node.id}
                  nodeSpacing={nodeSpacing}
                  onToggle={() => setExpandedId(expandedId === node.id ? null : node.id)}
                />
              );
            })}

            {/* End cap */}
            <div className="flex flex-col items-center mt-14 gap-3">
              <div
                className="w-5 h-5 rounded-full border-2 animate-pulse"
                style={{ borderColor: '#39FF14', background: 'rgba(57,255,20,0.12)' }}
              />
              <p className="text-gray-600 text-xs italic">The story continues…</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

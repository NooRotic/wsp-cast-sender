"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
const SPACING_NORMAL = 48;
const SPACING_MIN    = 12;
const SPACING_MAX    = 96;
const SPACING_STEP   = 8;
const SPACING_DEFAULT = 24;

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
    <div
      className="sticky flex items-center justify-center gap-1.5 flex-wrap px-4 py-2"
      style={{
        top: 64, // below fixed nav (h-16)
        zIndex: 25,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(57,255,20,0.08)',
      }}
    >
      {categories.map(c => (
        <button
          key={c.id}
          onClick={() => onToggle(c.id)}
          className="px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200 whitespace-nowrap"
          style={{
            borderColor: c.color,
            color: active.has(c.id) ? '#000' : c.color,
            background: active.has(c.id) ? c.color : 'transparent',
            opacity: active.has(c.id) ? 1 : 0.55,
          }}
          title={c.description}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

// ─── Right Panel — Legend + Scale + Minimap ───────────────────────────────────

function RightPanel({
  categories,
  active,
  nodeSpacing,
  onZoomIn,
  onZoomOut,
  nodes,
  progress,
  categoryMap,
}: {
  categories: TCategory[];
  active: Set<string>;
  nodeSpacing: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  nodes: TNode[];
  progress: number;
  categoryMap: Record<string, TCategory>;
}) {
  const scrollToNode = (idx: number) => {
    const els = document.querySelectorAll('[data-timeline-node]');
    els[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scalePercent = Math.round((nodeSpacing / SPACING_NORMAL) * 100);

  return (
    <div
      className="fixed top-20 right-2 flex flex-col gap-2"
      style={{ zIndex: 30, width: 148, bottom: 16 }}
    >
      {/* Legend + Scale controls */}
      <div
        className="rounded-xl border flex-shrink-0"
        style={{
          background: 'rgba(0,0,0,0.78)',
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
                className="w-2 h-2 rounded-full flex-shrink-0"
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

        {/* Scale controls */}
        <div
          className="px-3 pb-3 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#4a5568' }}>
            Scale
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onZoomOut}
              disabled={nodeSpacing <= SPACING_MIN}
              className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-all hover:opacity-80 disabled:opacity-25"
              style={{ background: 'rgba(57,255,20,0.12)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.25)' }}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="flex-1 text-center text-xs font-mono" style={{ color: '#39FF14' }}>
              {scalePercent}%
            </span>
            <button
              onClick={onZoomIn}
              disabled={nodeSpacing >= SPACING_MAX}
              className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-all hover:opacity-80 disabled:opacity-25"
              style={{ background: 'rgba(57,255,20,0.12)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.25)' }}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Minimap — fills remaining vertical space */}
      <div className="flex-1 min-h-0 flex justify-center py-1">
        <div className="relative w-0.5 h-full rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 w-full rounded-full transition-all duration-100"
            style={{ height: `${progress * 100}%`, background: 'rgba(57,255,20,0.45)' }}
          />
          {/* Node dots */}
          {nodes.map((n, i) => {
            const cat = categoryMap[n.category];
            const pct = (i / Math.max(nodes.length - 1, 1)) * 100;
            return (
              <button
                key={n.id}
                onClick={() => scrollToNode(i)}
                className="absolute rounded-full focus:outline-none transition-transform hover:scale-[2.5]"
                style={{
                  width: n.isHighlight ? 6 : 3,
                  height: n.isHighlight ? 6 : 3,
                  top: `${pct}%`,
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: cat?.color ?? '#888',
                  boxShadow: n.isHighlight ? `0 0 3px ${cat?.color}` : 'none',
                }}
                title={n.shortTitle}
              />
            );
          })}
        </div>
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
  const cardPad   = isCompact ? 'p-2' : 'p-3';

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
          className={`rounded-xl ${cardPad} cursor-pointer border transition-all duration-300`}
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
            style={{ fontSize: isCompact ? 10 : 12, color: category.color, opacity: 0.9 }}
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
                  width: isCompact ? 14 : 16,
                  height: isCompact ? 14 : 16,
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: 'brightness(0) invert(1)',
                  opacity: 0.55,
                }}
              />
            )}
            <span
              className="text-white"
              style={{
                fontSize: isCompact
                  ? (node.isHighlight ? 13 : 11)
                  : (node.isHighlight ? 17 : 14),
                fontWeight: isWsp ? 700 : 600,
                letterSpacing: isWsp ? '-0.01em' : undefined,
              }}
            >
              {node.title}
            </span>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {/* Large logo in expanded state */}
              {node.logo && (
                <div
                  className="flex mb-3"
                  style={{ justifyContent: side === 'left' ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    className="rounded-lg p-2"
                    style={{
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
                        width: 44,
                        height: 44,
                        objectFit: 'contain',
                        filter: 'brightness(0) invert(1)',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              )}
              {node.endDate && (
                <div className="font-mono" style={{ fontSize: 12, color: category.color, opacity: 0.75 }}>
                  → {formatDate(node.endDate)}
                </div>
              )}
              <p
                className="leading-relaxed"
                style={{ fontSize: isWsp ? 13 : 12, color: isWsp ? '#d1d5db' : '#9ca3af' }}
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

      {/* Year label — opposite side of card */}
      <div
        className={`hidden md:flex w-5/12 items-start ${
          side === 'left' ? 'pl-8 md:pl-12' : 'pr-8 md:pr-12 justify-end order-first'
        }`}
        style={{ paddingTop: 10 }}
      >
        <span
          className="font-mono font-semibold"
          style={{
            fontSize: isCompact ? 12 : 15,
            color: isWsp ? `${category.color}cc` : '#505050',
            letterSpacing: '0.04em',
          }}
        >
          {node.date.split('-')[0]}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TimelineView() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const spineRef      = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [nodeSpacing, setNodeSpacing]     = useState(SPACING_DEFAULT);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(timelineData.meta.categories.map(c => c.id))
  );

  const categoryMap = useMemo<Record<string, TCategory>>(
    () => Object.fromEntries(timelineData.meta.categories.map(c => [c.id, c])),
    []
  );

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
    const result: Array<{ type: 'era'; era: TEra } | { type: 'node'; node: TNode; index: number }> = [];
    let nodeIdx = 0;
    filteredNodes.forEach(node => {
      const era = getEraForDate(node.date, timelineData.meta.eras as TEra[]);
      if (era && era.id !== lastEraId) {
        lastEraId = era.id;
        result.push({ type: 'era', era });
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

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      {/* WSP node glow keyframe — color driven by --glow-color CSS var on each card */}
      <style>{`
        @keyframes wspGlow {
          0%,100% { box-shadow: 0 0 8px var(--glow-color), 0 0 0 1px color-mix(in srgb, var(--glow-color) 45%, transparent); }
          50%      { box-shadow: 0 0 22px var(--glow-color), 0 0 0 1.5px var(--glow-color), 0 0 38px color-mix(in srgb, var(--glow-color) 35%, transparent); }
        }
      `}</style>

      {/* Z-0: starfield */}
      <StarfieldCanvas />

      {/* Z-1: floating quotes */}
      <FloatingQuotes quotes={timelineData.meta.quotes} />

      {/* Z-30: fixed right panel (legend + scale + minimap) */}
      <RightPanel
        categories={timelineData.meta.categories as TCategory[]}
        active={activeCategories}
        nodeSpacing={nodeSpacing}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        nodes={filteredNodes}
        progress={scrollProgress}
        categoryMap={categoryMap}
      />

      {/* ── Page content ─────────────────────────── */}

      {/* Hero */}
      <div className="relative pt-24 pb-8 px-4 text-center" style={{ zIndex: 10 }}>
        <p className="text-sm font-mono tracking-[0.28em] text-gray-500 mb-1 uppercase">
          Walter Steve Pollard Jr
        </p>
        <p className="text-base font-mono tracking-[0.22em] text-gray-400 mb-6 uppercase">
          Software Engineer&nbsp;·&nbsp;Video&nbsp;·&nbsp;Chromecast&nbsp;·&nbsp;AI
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-2">
          <span style={{ color: '#39FF14' }}>25 Years</span> in the Making
        </h1>
        <div className="mt-5 text-gray-600 text-xs animate-bounce">↓ scroll to explore</div>
      </div>

      {/* Sticky filter bar — sticks just below nav (top: 64px) */}
      <StickyFilterBar
        categories={timelineData.meta.categories as TCategory[]}
        active={activeCategories}
        onToggle={toggleCategory}
      />

      {/* Timeline */}
      <div
        ref={containerRef}
        className="relative mx-auto px-4 pt-8 pb-48"
        style={{ maxWidth: 860, zIndex: 10 }}
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

        {/* Nodes + era banners */}
        {annotatedNodes.map(item => {
          if (item.type === 'era') {
            return <EraBanner key={`era-${item.era.id}`} era={item.era} />;
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
  );
}

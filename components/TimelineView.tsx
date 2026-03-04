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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  if (!month) return year;
  return `${MONTH_LABELS[parseInt(month)]} ${year}`;
}

function getEraForDate(dateStr: string, eras: TEra[]): TEra | undefined {
  const year = parseInt(dateStr.split('-')[0]);
  return eras.find(e => year >= e.startYear && year <= e.endYear);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let scrollY = 0;
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.55 + 0.15,
      speed: Math.random() * 0.25 + 0.08,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    const nebulae = [
      { x: 0.15, y: 0.25, r: 260, hue: 280, alpha: 0.055 },
      { x: 0.75, y: 0.55, r: 200, hue: 200, alpha: 0.045 },
      { x: 0.45, y: 0.80, r: 180, hue: 150, alpha: 0.040 },
      { x: 0.85, y: 0.15, r: 220, hue: 320, alpha: 0.050 },
      { x: 0.30, y: 0.60, r: 170, hue: 180, alpha: 0.035 },
    ];

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nebulae.forEach(b => {
        const cx = b.x * canvas.width;
        const cy = ((b.y * canvas.height - scrollY * b.alpha * 8) % canvas.height + canvas.height) % canvas.height;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
        grad.addColorStop(0, `hsla(${b.hue}, 55%, 38%, ${b.alpha})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      stars.forEach(s => {
        const cy = ((s.y - scrollY * s.speed * 0.18) % canvas.height + canvas.height) % canvas.height;
        const twinkle = s.alpha * (0.72 + 0.28 * Math.sin(s.twinkleOffset + frame * 0.018 * s.speed));
        ctx.beginPath();
        ctx.arc(s.x, cy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
        ctx.fill();
      });

      animFrame = requestAnimationFrame(draw);
    };

    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    draw();

    return () => {
      cancelAnimationFrame(animFrame);
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

// ─────────────────────────────────────────────────────────────────────────────

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
          className="absolute italic text-sm leading-relaxed max-w-[280px]"
          style={{
            opacity: visibleIdx === i ? 0.18 : 0,
            color: '#8899aa',
            left: `${12 + (i * 19) % 55}%`,
            top: `${18 + (i * 13) % 62}%`,
            transform: `rotate(${-4 + (i % 3) * 3}deg)`,
            transition: 'opacity 2.5s ease-in-out',
          }}
        >
          &ldquo;{q.text}&rdquo;
          <div className="text-xs mt-1 not-italic opacity-70">— {q.author}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function CategoryLegend({
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
      className="fixed top-20 right-4 rounded-xl p-3 border"
      style={{
        zIndex: 30,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(255,255,255,0.08)',
        minWidth: 140,
      }}
    >
      <div className="text-xs font-semibold text-gray-500 mb-2 tracking-widest uppercase">Legend</div>
      {categories.map(c => (
        <button
          key={c.id}
          onClick={() => onToggle(c.id)}
          className="flex items-center gap-2 w-full text-left mb-1.5 hover:opacity-100 transition-opacity"
          style={{ opacity: active.has(c.id) ? 1 : 0.35 }}
          title={c.description}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: c.color, boxShadow: active.has(c.id) ? `0 0 6px ${c.color}` : 'none' }}
          />
          <span className="text-xs" style={{ color: active.has(c.id) ? '#ddd' : '#666' }}>
            {c.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Minimap({
  nodes,
  progress,
  categoryMap,
}: {
  nodes: TNode[];
  progress: number;
  categoryMap: Record<string, TCategory>;
}) {
  const scrollToNode = (idx: number) => {
    const els = document.querySelectorAll('[data-timeline-node]');
    els[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ zIndex: 30, height: '55vh' }}
    >
      <div className="relative w-0.5 h-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 w-full rounded-full transition-all duration-150"
          style={{ height: `${progress * 100}%`, background: 'rgba(57,255,20,0.5)' }}
        />
        {/* Node dots */}
        {nodes.map((n, i) => {
          const cat = categoryMap[n.category];
          const pct = (i / Math.max(nodes.length - 1, 1)) * 100;
          return (
            <button
              key={n.id}
              onClick={() => scrollToNode(i)}
              className="absolute rounded-full transition-transform hover:scale-[2] focus:outline-none"
              style={{
                width: n.isHighlight ? 6 : 4,
                height: n.isHighlight ? 6 : 4,
                top: `${pct}%`,
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: cat?.color ?? '#fff',
                boxShadow: n.isHighlight ? `0 0 4px ${cat?.color}` : 'none',
              }}
              title={n.shortTitle}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function EraBanner({ era }: { era: TEra }) {
  return (
    <div
      className="relative z-10 flex items-center gap-4 my-8 select-none"
      data-era={era.id}
    >
      <div className="flex-1 h-px" style={{ background: era.color.replace('0.12', '0.35') }} />
      <div
        className="text-xs font-bold tracking-widest uppercase px-4 py-1 rounded-full border"
        style={{
          color: era.color.replace('0.12', '1').replace('rgba', 'rgb').replace(', 0.12)', ')'),
          borderColor: era.color.replace('0.12', '0.4'),
          background: era.color.replace('0.12', '0.08'),
          letterSpacing: '0.15em',
        }}
      >
        {era.label}
      </div>
      <div className="flex-1 h-px" style={{ background: era.color.replace('0.12', '0.35') }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function TimelineNode({
  node,
  side,
  category,
  isExpanded,
  onToggle,
}: {
  node: TNode;
  side: 'left' | 'right';
  category: TCategory;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isYAH = node.id === 'you-are-here';

  return (
    <div
      className="relative flex items-start mb-12 md:mb-16"
      data-timeline-node={node.id}
    >
      {/* Content card — left side */}
      <div
        className={`w-5/12 ${side === 'left' ? 'pr-6 md:pr-10' : 'pl-6 md:pl-10 order-last'}`}
      >
        <div
          onClick={onToggle}
          className="rounded-xl p-4 cursor-pointer border transition-all duration-300"
          style={{
            borderColor: isExpanded ? category.color : `${category.color}35`,
            background: isExpanded ? `${category.color}10` : 'rgba(5,5,10,0.65)',
            boxShadow: isExpanded ? `0 0 24px ${category.color}25` : 'none',
            textAlign: side === 'left' ? 'right' : 'left',
          }}
        >
          <div className="text-xs font-mono mb-1" style={{ color: category.color }}>
            {formatDate(node.date)}
            {node.endDate && ` – ${formatDate(node.endDate)}`}
          </div>

          <div
            className={`font-semibold text-white leading-snug ${node.isHighlight ? 'text-base' : 'text-sm'}`}
          >
            {node.title}
          </div>

          {/* Expandable details */}
          {isExpanded && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-300 leading-relaxed">{node.description}</p>
              {node.tags.length > 0 && (
                <div
                  className="flex flex-wrap gap-1 mt-2"
                  style={{ justifyContent: side === 'left' ? 'flex-end' : 'flex-start' }}
                >
                  {node.tags.map(t => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#888' }}
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

      {/* Spine connector dot — always centered */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: 14 }}>
        {/* Connecting line to spine */}
        <div
          className={`absolute top-1/2 h-px -translate-y-1/2 ${side === 'left' ? 'right-full' : 'left-full'}`}
          style={{
            width: '24px',
            background: `${category.color}60`,
          }}
        />
        {/* Node dot */}
        <div
          className="rounded-full border-2 transition-all duration-300"
          style={{
            width: node.isHighlight ? 18 : 10,
            height: node.isHighlight ? 18 : 10,
            borderColor: category.color,
            background: isExpanded || isYAH ? category.color : '#000',
            boxShadow: isYAH
              ? `0 0 0 5px ${category.color}30, 0 0 0 10px ${category.color}15, 0 0 20px ${category.color}50`
              : isExpanded
              ? `0 0 14px ${category.color}80`
              : 'none',
          }}
        />
        {isYAH && (
          <div
            className="mt-2 text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap animate-pulse"
            style={{
              color: category.color,
              border: `1px solid ${category.color}`,
              background: `${category.color}15`,
            }}
          >
            YOU ARE HERE
          </div>
        )}
      </div>

      {/* Year label — opposite side (desktop hint) */}
      <div
        className={`hidden md:flex w-5/12 items-start ${side === 'left' ? 'pl-6 md:pl-10' : 'pr-6 md:pr-10 justify-end order-first'}`}
        style={{ paddingTop: 18 }}
      >
        <span className="text-xs font-mono text-gray-700">{node.date.split('-')[0]}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TimelineView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
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

  // Build era-annotated node list (era banners inserted before first node of each era)
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

  // GSAP spine draw
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

  // IntersectionObserver for node reveal animations
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-timeline-node]');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateX(0)';
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    nodes.forEach((el, i) => {
      const isLeft = i % 2 === 0;
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.transform = `translateX(${isLeft ? -32 : 32}px)`;
      (el as HTMLElement).style.transition = 'opacity 0.55s ease, transform 0.55s ease';
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

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      {/* Layer 0: starfield canvas */}
      <StarfieldCanvas />

      {/* Layer 1: floating background quotes */}
      <FloatingQuotes quotes={timelineData.meta.quotes} />

      {/* Fixed UI overlays */}
      <CategoryLegend
        categories={timelineData.meta.categories as TCategory[]}
        active={activeCategories}
        onToggle={toggleCategory}
      />
      <Minimap nodes={filteredNodes} progress={scrollProgress} categoryMap={categoryMap} />

      {/* Page hero */}
      <div className="relative pt-24 pb-16 px-4 text-center" style={{ zIndex: 10 }}>
        <p className="text-xs font-mono tracking-[0.3em] text-gray-500 mb-4 uppercase">
          Software Engineer · Video · Chromecast · AI
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
          <span style={{ color: '#39FF14' }}>25 Years</span> in the Making
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed">
          My career woven through the living history of the web — from ActionScript to AI,
          from Atari to Chromecast.
        </p>
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {timelineData.meta.categories.map(c => (
            <button
              key={c.id}
              onClick={() => toggleCategory(c.id)}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200"
              style={{
                borderColor: c.color,
                color: activeCategories.has(c.id) ? '#000' : c.color,
                background: activeCategories.has(c.id) ? c.color : 'transparent',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-6 text-gray-600 text-xs animate-bounce">↓ scroll to explore</div>
      </div>

      {/* Timeline container */}
      <div
        ref={containerRef}
        className="relative mx-auto px-4 pb-48"
        style={{ maxWidth: 900, zIndex: 10 }}
      >
        {/* Spine rail */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: '50%', transform: 'translateX(-50%)', width: 2, background: 'rgba(57,255,20,0.08)' }}
        >
          {/* Animated fill */}
          <div
            ref={spineRef}
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom, transparent 0%, rgba(57,255,20,0.55) 20%, rgba(57,255,20,0.55) 80%, transparent 100%)',
              transformOrigin: 'top center',
              transform: 'scaleY(0)',
            }}
          />
        </div>

        {/* Nodes and era banners */}
        {annotatedNodes.map((item, i) => {
          if (item.type === 'era') {
            return <EraBanner key={`era-${item.era.id}`} era={item.era} />;
          }
          const { node, index } = item;
          const cat = categoryMap[node.category] ?? { color: '#888', label: 'Unknown', id: node.category, description: '' };
          return (
            <TimelineNode
              key={node.id}
              node={node}
              side={index % 2 === 0 ? 'left' : 'right'}
              category={cat}
              isExpanded={expandedId === node.id}
              onToggle={() => setExpandedId(expandedId === node.id ? null : node.id)}
            />
          );
        })}

        {/* End cap */}
        <div className="flex flex-col items-center mt-16 gap-3 text-center">
          <div
            className="w-6 h-6 rounded-full border-2 animate-pulse"
            style={{ borderColor: '#39FF14', background: 'rgba(57,255,20,0.15)' }}
          />
          <p className="text-gray-500 text-sm italic">The story continues…</p>
        </div>
      </div>
    </div>
  );
}

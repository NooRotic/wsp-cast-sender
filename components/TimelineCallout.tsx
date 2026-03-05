"use client";

import Link from "next/link";

// Decorative mini-spine — gives a visual hint of what the timeline looks like
const DOTS = [
  { color: "#39FF14", size: 10, offset: "8%",  highlight: true  },
  { color: "#4ECDC4", size: 6,  offset: "18%", highlight: false },
  { color: "#FF6B6B", size: 6,  offset: "29%", highlight: false },
  { color: "#39FF14", size: 8,  offset: "41%", highlight: true  },
  { color: "#FFD700", size: 6,  offset: "53%", highlight: false },
  { color: "#4ECDC4", size: 6,  offset: "64%", highlight: false },
  { color: "#FF8C00", size: 8,  offset: "75%", highlight: true  },
  { color: "#39FF14", size: 10, offset: "88%", highlight: true  },
];

export default function TimelineCallout() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(3,8,3,0.96) 18%, rgba(3,8,3,0.96) 82%, rgba(0,0,0,0) 100%)",
        borderTop:    "1px solid rgba(57,255,20,0.07)",
        borderBottom: "1px solid rgba(57,255,20,0.07)",
      }}
    >
      {/* Ambient neon glow — background only */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 50% 50%, rgba(57,255,20,0.04) 0%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto px-6 py-14 flex flex-col items-center text-center" style={{ zIndex: 1 }}>

        {/* Eyebrow */}
        <p className="text-xs font-mono tracking-[0.3em] uppercase mb-4" style={{ color: "#39FF14", opacity: 0.7 }}>
          Interactive History
        </p>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
          25 Years{" "}
          <span style={{ color: "#39FF14" }}>in the Making</span>
        </h2>

        {/* Subline */}
        <p className="text-sm text-gray-400 mb-8 max-w-md leading-relaxed">
          Flash to Chromecast. Atari to AI. Every job, every tech shift, every era —
          mapped against the living history of the web.
        </p>

        {/* Mini timeline spine preview */}
        <div className="relative w-full max-w-sm h-6 mb-8" aria-hidden="true">
          {/* Rail */}
          <div
            className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2"
            style={{ background: "linear-gradient(to right, transparent, rgba(57,255,20,0.35) 15%, rgba(57,255,20,0.35) 85%, transparent)" }}
          />
          {/* Dots */}
          {DOTS.map((d, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
              style={{
                left: d.offset,
                width:  d.size,
                height: d.size,
                background: d.color,
                boxShadow: d.highlight ? `0 0 6px ${d.color}` : "none",
                opacity: d.highlight ? 1 : 0.55,
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/timeline"
          className="group inline-flex items-center gap-2.5 px-7 py-3 rounded-full font-semibold text-sm transition-all duration-300"
          style={{
            border:     "1px solid rgba(57,255,20,0.55)",
            color:      "#39FF14",
            background: "rgba(57,255,20,0.06)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(57,255,20,0.14)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 18px rgba(57,255,20,0.18)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(57,255,20,0.06)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
          }}
        >
          Explore the Timeline
          <span
            className="transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        </Link>

      </div>
    </div>
  );
}

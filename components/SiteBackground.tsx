'use client';

import { usePathname } from 'next/navigation';
import StarfieldBackground from './StarfieldBackground';
import MatrixRainBackground from './MatrixRainBackground';
import BendingLinesBackground from './BendingLinesBackground';

// Per-route background switcher. Each variant is a self-contained canvas
// component; this file just picks which one to mount based on pathname and
// passes a single opacity prop. Adding a new variant or rerouting a section
// is a one-line change here.
//
// Opacity philosophy: "very slightly visible" everywhere except /timeline,
// which gets the full prominent treatment because (a) the canvas-starfield
// blog post explicitly points readers at /timeline as the showcase, and
// (b) the timeline page has fewer competing UI elements so the background
// can carry more weight without distracting.

const SUBTLE_OPACITY = 0.4;
const PROMINENT_OPACITY = 1.0;

export default function SiteBackground() {
  const pathname = usePathname() ?? '/';

  // /timeline keeps the starfield at full strength — signature look,
  // also what the blog post about the canvas-starfield references.
  if (pathname.startsWith('/timeline')) {
    return <StarfieldBackground opacity={PROMINENT_OPACITY} />;
  }

  // Cast routes get the matrix rain — fits the dev-tool/debug aesthetic.
  if (pathname.startsWith('/cast-')) {
    return <MatrixRainBackground opacity={SUBTLE_OPACITY} />;
  }

  // Media and twitch routes get the Max Headroom-style bending lines.
  if (
    pathname.startsWith('/media-') ||
    pathname.startsWith('/twitch-') ||
    pathname.startsWith('/unified-player')
  ) {
    return <BendingLinesBackground opacity={SUBTLE_OPACITY} />;
  }

  // Default for /, /now, /blog, /blog/[slug], and anything else.
  return <StarfieldBackground opacity={SUBTLE_OPACITY} />;
}

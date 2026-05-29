'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import StarfieldBackground from './StarfieldBackground';
import MatrixRainBackground from './MatrixRainBackground';
import BendingLinesBackground from './BendingLinesBackground';

// Picks one of three canvas backgrounds at random per page load, mirroring
// the behavior of the old ParticleBackground (which randomly picked an MP4
// from public/bgs/). Variety between visits, consistency within a visit.
//
// Why random rather than per-route assignment: each visitor sees the site
// differently from the last, the way the original MP4 system did. Per-route
// assignment is "logical" but fixes the look in a way the original system
// did not.
//
// /timeline is the one exception. The canvas-starfield blog post points at
// /timeline as the showcase, so we always give it prominent opacity (1.0)
// regardless of which variant got picked. Every other route gets the subtle
// 0.4 variant.

const VARIANTS = ['starfield', 'matrix', 'bending'] as const;
type Variant = (typeof VARIANTS)[number];

const SUBTLE_OPACITY = 0.4;
const PROMINENT_OPACITY = 1.0;

export default function SiteBackground() {
  const pathname = usePathname() ?? '/';
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    // Pick the random variant on client mount. Doing this during render
    // would diverge between SSR and the first client paint and trigger a
    // hydration mismatch warning, so we render null on first paint and let
    // the canvas drop in once the variant is chosen. With opacity 0.4 the
    // sub-100ms gap is imperceptible against the html background.
    setVariant(VARIANTS[Math.floor(Math.random() * VARIANTS.length)]);
  }, []);

  if (!variant) return null;

  const isTimeline = pathname.startsWith('/timeline');
  const opacity = isTimeline ? PROMINENT_OPACITY : SUBTLE_OPACITY;

  if (variant === 'matrix') return <MatrixRainBackground opacity={opacity} />;
  if (variant === 'bending') return <BendingLinesBackground opacity={opacity} />;
  return <StarfieldBackground opacity={opacity} />;
}

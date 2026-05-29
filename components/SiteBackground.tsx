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
// /timeline is the one deterministic exception. The starfield's nebulae +
// drifting stars + scroll parallax match the page's "scrolling through 25
// years of space" frame better than the matrix or bending-line variants
// would. The canvas-starfield blog post also points at /timeline as the
// showcase, so the route is pinned to starfield at full opacity regardless
// of which variant the random roll picked for the rest of the session.

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

  // /timeline is always the prominent starfield — deterministic, no random
  // roll consulted. Renders on first paint with no null gap because the
  // outcome doesn't depend on client-only state.
  if (pathname.startsWith('/timeline')) {
    return <StarfieldBackground opacity={PROMINENT_OPACITY} />;
  }

  // Everywhere else: render the rolled variant at subtle opacity once mount
  // has chosen one. Same variant persists across in-app navigation because
  // SiteBackground lives in the layout and useState survives route changes.
  if (!variant) return null;
  if (variant === 'matrix') return <MatrixRainBackground opacity={SUBTLE_OPACITY} />;
  if (variant === 'bending') return <BendingLinesBackground opacity={SUBTLE_OPACITY} />;
  return <StarfieldBackground opacity={SUBTLE_OPACITY} />;
}

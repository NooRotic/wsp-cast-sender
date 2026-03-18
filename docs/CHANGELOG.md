# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — feature/timeline-visual-polish (PR #7)

### Added
- **Timeline page** (`/timeline`) — full 25-year interactive career timeline
  - Alternating left/right bubble cards with era banners, year markers on spine (decades bold/white/larger)
  - Starfield canvas background with drifting nebulae and parallax stars
  - Floating motivational quotes
  - LeftPanel: legend, bubble spacing slider + −/+ buttons, timeline zoom slider + −/+ buttons
  - MinimapPanel: fixed right-rail with glowing viewport band (now **draggable** via pointer capture)
  - Filter pills with CSS `@keyframes pillDrop` bounce-in (hidden from first paint, staggered at 2.5s)
  - GSAP word-by-word hero sequence: name → subtitle → "25 Years" scale-pop → "in the Making" stagger
  - Filter bar scrolls with page (between hero and timeline, not fixed)
- **Timeline zoom** — Flash-style GSAP full-body scale with height-keeper wrapper; ZOOM_MIN = 10%
- **Category colors** — LGBTQ pride flag rainbow: red, orange, yellow, green, blue, indigo, violet
- **Expanded bubble logos** — CSS float so description text wraps around the icon
- **Console ownership nodes** — personal category: Atari, NES, Dreamcast, PS2, Xbox, etc.

### Changed
- **Navigation** — pure flexbox layout; resume button is an inline flex item, cast buttons anchored far-right via `flex-1` spacer; no absolute positioning → zoom-resilient at any browser scale
- `ResumeDownloadButton` — removed absolute wrapper, now a normal flex child; smooth max-width expand/collapse via inline style
- Nav menu items: `font-size: 1rem`; cast button labels: `font-size: 0.875rem`
- Media demo page renamed to "Adaptive Media Player"; duplicate cast send bug fixed

### Fixed
- Timeline bubbles all showing on left side (restore `w-5/12` spacer after year label removal)
- Hero GSAP sequence blocked by null `filterBarRef` guard — removed stale ref from guard check
- Pills visible before animation — switched from GSAP `set()` (post-paint) to CSS `fill-mode: backwards` (pre-paint)

---

## [1.0.0] - 2025-07-05

### Added

- Initial release of Senior Software Engineer Portfolio
- Modern Next.js 13.5 application with TypeScript
- Responsive design with Tailwind CSS
- GSAP animations with ScrollTrigger
- Interactive Hero section with typing animation
- Skills showcase with proficiency levels
- Projects portfolio with detailed metrics
- Contact form section
- Particle background effects
- Professional navigation with smooth scrolling
- SEO optimization with comprehensive meta tags
- shadcn/ui component library integration
- Mobile-responsive design
- Dark theme with neon green accents

### Technical Features

- Next.js App Router architecture
- TypeScript for type safety
- Tailwind CSS for styling
- GSAP for animations
- Radix UI components
- Lucide React icons
- Vercel deployment ready
- ESLint configuration
- Professional project structure

### Content

- Comprehensive skills data structure
- Portfolio projects with achievements
- Professional metadata and SEO
- Contact information and forms

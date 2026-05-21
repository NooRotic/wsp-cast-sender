# Site Review — Quick Wins List

**Date:** 2026-05-20
**Reviewer:** indeed_me handoff (read-only code review of the wsp-sender repo)
**Companion docs:**
- `docs/portfolio-expansion-research-2026-05-20.md` — new-pages strategy
- `docs/specs/2026-05-20-blog-and-now-pages.md` — /blog + /now spec

> **Brief:** Walter asked for a list of negative things that stand out about `walter.pollardjr.com` that can be quickly addressed. This is the result of a static code review across `app/`, `components/`, `next.config.js`, and `app/layout.tsx`. Items are ranked by fix-effort. Many are tiny but impactful; a few are real architectural smells worth flagging.

---

## 🔴 Critical / instant wins (each under 30 min)

### 1. Broken LinkedIn URL in ContactSection

**File:** `components/ContactSection.tsx:86`

```typescript
{ icon: Linkedin, label: 'LinkedIn', value: 'linkedin.com/in/walterpollardjr',
  href: 'www.linkedin.com/in/walterpollardjr' }   // ← missing https://
```

Without the protocol, browsers treat it as a relative path and navigate to `walter.pollardjr.com/www.linkedin.com/in/walterpollardjr` (404). **Every recruiter who clicks this gets a dead link.** Fix: `href: 'https://www.linkedin.com/in/walterpollardjr'`.

### 2. SEO/social meta tags missing OG image

**File:** `app/layout.tsx:17-22`

```typescript
openGraph: {
  title: '...',
  description: '...',
  type: 'website',
  locale: 'en_US',
  // no images!
}
```

LinkedIn / Twitter / Slack / Discord previews all render blank thumbnails. **For a site whose whole strategy is re-sharing, this is the highest-impact miss.** Fix: add `public/og/default.png` (1200x630) and reference it in the openGraph block + add a Twitter card stanza.

### 3. Inter font preconnected but never loaded

**File:** `app/layout.tsx:50-54`

```typescript
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
// ... but no <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter...">
// ... and body uses style={{ fontFamily: 'Inter, sans-serif' }} which falls back to system sans
```

The preconnect hints cost a TCP/TLS handshake to a service that's never used. Either remove the preconnects OR actually load Inter via `next/font/google` (the App Router pattern). The latter is preferred since the design intent appears to be Inter.

### 4. Voice rule violation in `<title>`

**File:** `app/layout.tsx:13`

```typescript
title: 'Walter S. Pollard Jr | JavaScript & Streaming Video Expert',
```

"Expert" violates Walter's published voice rules (see `feedback_cover_letter_standard.md` §4 — no slick-pitch vocabulary). Cover letters say "Subject Matter Expert" only when claiming a specific Comcast credential. Suggestion: `'Walter S. Pollard Jr. — Senior Software Engineer'` (matches signoff pattern with period after Jr).

### 5. Outdated copy in ContactSection lead paragraph

**File:** `components/ContactSection.tsx:138-139`

```jsx
<p className="text-gray-400">
  Available for freelance projects and full-time opportunities
</p>
```

But the pill row immediately below (`:142-150`) shows **Remote Work / Contract / Full-time**. Walter is actively pursuing contract work (Endure/OpenSesame at $125/hr W2 in flight). Fix the lead paragraph to include contract:

```jsx
Available for contract engagements and full-time opportunities, remote.
```

### 6. ESLint silently disabled during builds

**File:** `next.config.js:17-19`

```javascript
eslint: { ignoreDuringBuilds: true },
```

Means lint errors never block a release. Hidden tech debt accumulates. Now that the codebase is reasonably mature, flip this back on (`ignoreDuringBuilds: false` or remove the key) and fix whatever errors surface. The fix-cycle is the point — one-time cleanup, then ongoing hygiene.

---

## 🟡 High-impact (1-2 hours each)

### 7. SSR is disabled on the entire home page → bots see nothing

**File:** `app/page.tsx:10-15`

```typescript
const HeroSection = dynamic(() => import('@/components/HeroSection'), { ssr: false, loading: () => null });
const SkillsShowcase = dynamic(() => import('@/components/SkillsShowcase'), { ssr: false, loading: () => null });
const ProjectsSection = dynamic(() => import('@/components/ProjectsSection'), { ssr: false, loading: () => null });
const ContactSection = dynamic(() => import('@/components/ContactSection'), { ssr: false, loading: () => null });
```

With `ssr: false`, search engines and link-preview bots fetch a literally empty home page. **The portfolio is invisible to anyone whose first interaction is non-JS rendering** (LinkedIn unfurls, Google indexing, archive.org, screen readers in some modes, slow-JS connections).

Suggested fix: remove `ssr: false`. The components already use `'use client'` and `useEffect`-gated GSAP, which means SSR will render the static markup and GSAP will take over on hydration. If hydration-mismatch errors surface, fix them with `useIsomorphicLayoutEffect` and CSS-driven initial-hidden states rather than killing SSR entirely.

This is the single highest-leverage SEO + accessibility fix in the whole codebase.

### 8. Hover animations are unreachable on touch devices

**File:** `components/ProjectsSection.tsx:108-138, 155-178`

Project cards have a green glow + scale + border highlight, but it's bound entirely to `onMouseEnter`/`onMouseLeave` GSAP handlers. Mobile users tap a card and see no feedback — the card just navigates. The animation that's supposed to communicate "this is interactive" never fires for ~half of visitors.

Fix: add a CSS `:hover` baseline + `:focus-visible` state in `globals.css` so the visual signal exists at all viewport sizes / input types. Keep GSAP as enhancement.

### 9. Cast SDK loaded synchronously on every route

**File:** `app/layout.tsx:52`

```html
<script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
```

Synchronous, blocking, no `async`/`defer`, no per-route gating. Once `/blog`, `/now`, `/uses` exist as routes where users come to read (not cast), every one of them pays this script's tax.

Fix options:
- Add `defer` attribute (cheapest)
- Or only inject the script when `CastProvider` mounts (proper fix; matches CLAUDE.md's "Cast SDK script is loaded synchronously in `<head>`" comment which Walter inherited from the original setup)

### 10. Below-fold content hidden until hero animation completes

**File:** `app/page.tsx:35-39, 65-76`

```typescript
const belowFoldStyle: React.CSSProperties = {
  opacity: contentVisible ? 1 : 0,
  pointerEvents: contentVisible ? 'auto' : 'none',
};
```

`contentVisible = heroAnimationsComplete || userHasScrolled`. If GSAP fails to fire `setHeroAnimationsComplete(true)` (errored timeline, plugin not registered, etc.) the entire below-fold page is invisible AND non-interactive. Users with motion sensitivity or assistive tech get the same fate.

Fix:
- Default `opacity: 1` and only fade-in via animation, never fade-out on load
- Respect `prefers-reduced-motion: reduce` — skip the hero gate entirely for those users

### 11. `prefers-reduced-motion` not respected anywhere

**Multiple files** — `HeroSection.tsx`, `ContactSection.tsx`, `ProjectsSection.tsx`, all `gsap.fromTo` / `gsap.to` calls.

GSAP doesn't auto-honor the user preference. Per WCAG SC 2.3.3 (Animation from Interactions), users who set "Reduce motion" in their OS should get static content. Currently they get the full GSAP show.

Fix at minimum:
- Wrap ALL animation init code in `if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) { ... }`
- Or use a context that exposes `prefersReducedMotion` and short-circuits animations everywhere

This is also an accessibility-audit blocker for recruiters who scan for this. Lighthouse will flag it.

### 12. HeroSection.tsx is 37 KB — splitting candidate

**File:** `components/HeroSection.tsx`

Single component, 37 KB minified-ish source. Imports GSAP + TextPlugin + SplitType + animation context. Worth investigating with `ANALYZE=true npm run build` whether the home-page payload is bloated by this one file.

Easy wins inside the file:
- Move the entire `showContentImmediately()` helper out as a standalone util
- Lazy-load `SplitType` only when actually needed (it's heavy)
- Split the "animation timeline" code into a hook (`useHeroTimeline()`)

Not a one-day fix but worth a focused half-day refactor.

### 13. No canonical URL or sitemap

**File:** `app/layout.tsx` (and missing files)

- No `<link rel="canonical">` in head → search engines might index `https://walter.pollardjr.com/`, `https://www.walter.pollardjr.com/`, and trailing-slash variants as separate pages
- No `app/sitemap.ts` → Google can't auto-discover all routes
- No `app/robots.ts` → robots.txt only gets the defaults

Three small files fix all three. Each is ~10 lines. Big SEO upside.

### 14. Demos dropdown lacks a11y wiring

**File:** `components/Navigation.tsx:99-124`

```typescript
<button onClick={() => setIsDemoDropdownOpen(!isDemoDropdownOpen)}>
  <span>Demos</span>
  <ChevronDown ... />
</button>
{isDemoDropdownOpen && (
  <div className="absolute ...">
    ...
  </div>
)}
```

Missing:
- `aria-expanded={isDemoDropdownOpen}` on the button
- `aria-haspopup="menu"` on the button
- `role="menu"` on the dropdown div
- `role="menuitem"` on each `<Link>` inside
- Escape key handler to close (currently only click-outside)
- Focus management — focus doesn't return to the button on close

Screen readers can't tell what this is. Keyboard users can't escape it.

---

## 🟢 Nice-to-have / cleanup (deferred, but list while we're here)

### 15. `Navigation.tsx` computes pathname manually

**File:** `components/Navigation.tsx:13`

```typescript
const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
```

The file already imports `usePathname` from `next/navigation` on line 4 (then aliases the return as `router`). Replace the manual computation with the imported hook. Two-line change.

### 16. Unused import in `app/layout.tsx`

**File:** `app/layout.tsx:6`

```typescript
import ResumeDownloadButton from '@/components/ResumeDownloadButton';
```

Never used in this file (the button only renders inside `Navigation.tsx`). Dead import.

### 17. No `aria-current` on nav links

**File:** `components/Navigation.tsx:96, mobile drawer entries`

Active page should have `aria-current="page"` on its link. Currently no visual or programmatic distinction between the active page and any other nav item. Particularly important once `/now`, `/blog`, `/uses` exist — users need to know where they are.

### 18. Developer name fallback inconsistency

**File:** `components/HeroSection.tsx:26` and `app/layout.tsx:13`

- HeroSection: `'Walter S. Pollard Jr'` (no period)
- layout.tsx title: `'Walter S. Pollard Jr | ...'` (no period)
- Cover letter signoff: `'Walter S. Pollard Jr.'` (with period)
- README docs: mixed

Pick one. Walter's canonical signoff per `feedback_cover_letter_standard.md` is "Walter S. Pollard Jr." (with the period). Make the site match.

### 19. `globals.css` is 26 KB

**File:** `app/globals.css`

Worth a focused review pass — almost certainly contains dead rules accumulated across builds. Suggest running PurgeCSS analysis or just hand-auditing for unused selectors. Could halve the file size with no functional impact.

### 20. Custom image loader needs an audit

**File:** `next.config.js:21-25`, `js/utils/image-loader.js`

```javascript
images: {
  unoptimized: true,
  loader: 'custom',
  loaderFile: './js/utils/image-loader.js'
}
```

`unoptimized: true` is required for static export, but the custom loader is doing something — confirm it actually adds value or remove it. If it does nothing useful, simpler is better.

### 21. No `<noscript>` fallback content

Combined with item #7 (SSR disabled), users with JS disabled OR slow JS OR script-blocking extensions see literally nothing on the home page. Even just a `<noscript>` tag with a simple intro paragraph + link to the resume PDF would salvage that case.

---

## 🆕 Found during Batch 1 implementation (2026-05-20)

These items surfaced while shipping the Batch 1 PR. Filed here so the next review session has them in scope.

### 22. Duplicate `id=` attributes on home-page sections

**Files:** `app/page.tsx:100-102`, `components/ProjectsSection.tsx:93`, `components/SkillsShowcase.tsx:164`, `components/ContactSection.tsx:105`

```typescript
// app/page.tsx
<section id="projects"><ProjectsSection /></section>
<section id="skills"><SkillsShowcase /></section>
<section id="contact"><ContactSection /></section>

// each inner component also declares the same id
// ProjectsSection.tsx:93   → <section id="projects" ref={sectionRef} className="py-5 px-4 ...">
// SkillsShowcase.tsx:164  → <section id="skills" className="py-6 px-4 ...">
// ContactSection.tsx:105  → <section id="contact" ref={sectionRef} className="py-5 px-4 ...">
```

Three IDs each declared twice in the same document. HTML spec requires IDs to be unique; `document.querySelector('#contact')` returns the FIRST match by document order — the empty outer wrapper in `page.tsx`, not the inner section with the actual content. Screen readers landing on two "contact" landmarks get confused navigation. `id="home"` is the only clean one (declared once on the hero wrapper).

**Fix:** Remove the IDs from the outer wrappers in `page.tsx`. Their purpose is the `belowFoldStyle` visibility gate, not anchor targeting — they can be plain `<div>`s. The inner components already own the IDs and use them as animation refs.

Discovered while debugging the deep-link `/#contact` scroll behavior (Batch 1 follow-up commits).

### 23. Scroll-to-top logic scattered across three independent mechanisms

**Files:** `components/ScrollToTop.tsx`, `components/ClientScript.tsx`, `app/page.tsx`

Three components race to scroll the page on mount:

| Source | What it does |
|---|---|
| `ScrollToTop.tsx` | Immediate `scrollTo(0,0)` + a second one at 100ms "to handle layout shifts" |
| `ClientScript.tsx` | Immediate `scrollTo(0,0)` + sets `history.scrollRestoration = 'manual'` |
| `app/page.tsx` | Immediate `scrollTo(0,0)` OR a hash-based deep-link scroll |

The 100ms-delayed scroll in `ScrollToTop` was the root cause of the deep-link hash bug fixed in this PR — it interrupted the smooth hash scroll mid-animation, snapping the page back to top. The current resolution adds hash-awareness to `ScrollToTop`, but the architectural duplication remains as a latent source of regressions any time someone touches scroll behavior.

**Fix:** Consolidate to a single source of truth — likely `ScrollToTop.tsx`, since it's the dedicated component. Move the hash-detection logic from `app/page.tsx` there. Reduce `ClientScript.tsx` to just the `scrollRestoration` setting (its only non-redundant responsibility). After #7 (`ssr: false` removal) also lands, the polling-for-layout-stability dance in the hash handler can be deleted entirely — Next.js + browser will handle hash anchors natively against statically-rendered markup.

Tightly coupled with #7.

### 24. Deep-link hash navigation works via polling, not Next.js primitives

**Files:** `app/page.tsx:29-52`, `components/Navigation.tsx:57-69`

Today's PR ships a working hash-scroll mechanism, but it's a workaround for the dynamic-imports-with-`ssr: false` architecture, not a clean solution. The polling loop waits up to 5 seconds for `document.documentElement.scrollHeight` to stabilize before scrolling — necessary today because parallel dynamic imports shift the target's position as they mount.

**Fix:** Resolving #7 (remove `ssr: false`) replaces this entire pattern with natural Next.js anchor scrolling. The polling + history.pushState code in `app/page.tsx` and `Navigation.tsx` becomes deletable. Tracked here so it's not forgotten when #7 lands.

---

## 🆕 Found during Batch 2 smoke test (2026-05-20 → 2026-05-21)

### 25. No loading feedback when clicking Timeline from root

**Files:** none yet — needs `app/timeline/loading.tsx`

Clicking the Timeline link from the home page causes a route transition that downloads the `/timeline` bundle (the heaviest route at ~23.7 kB plus its component tree). During the transition the browser stays on the current page with no visible feedback that something is loading — users wonder if their click registered.

**Fix:** Create `app/timeline/loading.tsx` exporting a default React component. Next.js App Router automatically renders it as the suspense fallback while the route's chunks load. A small centered spinner with the brand neon green is sufficient. Same pattern would help on any other heavy route (e.g., `/cast-demo` if its bundle grows).

Discovered during PR #11 smoke testing.

### 26. Active-nav underline snaps instantly between items (polish)

**Files:** `components/Navigation.tsx`, `app/globals.css`

The aria-current="page" underline (shipped in #17) uses `text-decoration: underline` which snaps between nav items with no transition. This is correct a11y behavior — screen-reader users want immediate feedback. But for sighted users a sliding indicator feels more polished and gives a visual hint about which section is active even when peripherally noticed.

**Fix:** Replace the text-decoration underline with a separate absolutely-positioned bar (`<span aria-hidden="true">`) under the active nav item, animated with FLIP-style transforms when the active item changes. Keep the aria-current attribute for screen readers regardless.

Low priority — current implementation is fully accessible. Treat as polish, not a bug.

Discovered during PR #11 smoke testing.

---

## Recommended fix order

If Walter wants to ship these in batches:

**Batch 1 — same-day quick wins (under 2 hours total):**
- #1 LinkedIn URL
- #2 OG image
- #3 Inter font (remove preconnects or load it)
- #4 Title voice fix
- #5 Contact copy
- #6 ESLint enable
- #15 usePathname
- #16 unused import
- #18 name consistency

**Batch 2 — SEO + accessibility (one focused day):**
- #7 Remove `ssr: false` *(also kills the workarounds in #23 and #24)*
- #8 CSS hover baseline for project cards
- #11 prefers-reduced-motion
- #13 canonical + sitemap + robots
- #14 dropdown a11y
- #17 aria-current
- #21 noscript fallback
- #22 duplicate IDs on home-page sections *(new — found in Batch 1)*

**Batch 3 — performance + cleanup (separate session):**
- #9 Cast SDK defer/conditional
- #10 below-fold accessibility
- #12 HeroSection split
- #19 globals.css audit
- #20 image loader audit
- #23 consolidate scroll-to-top logic *(new — found in Batch 1)*
- #24 delete hash-scroll polling once #7 lands *(new — found in Batch 1)*
- #25 loading.tsx for /timeline route *(new — found in Batch 2 smoke)*
- #26 sliding active-nav indicator (polish, not bug) *(new — found in Batch 2 smoke)*

---

## How to use this list

This is review output, not an implementation plan. When the wsp-sender build session starts:

1. Read this list end-to-end
2. Decide with Walter which batch to tackle first (likely Batch 1 — it's 9 items but each is small)
3. For Batch 2 and 3, write actual implementation plans (use the `superpowers:writing-plans` pattern from indeed_me as reference)
4. The `/blog` + `/now` work (specs/2026-05-20-blog-and-now-pages.md) is independent of these fixes — you can interleave or sequence them as Walter prefers

Items #2 (OG image) and #7 (SSR enabled) are the two most important for the re-share strategy that `/blog` + `/now` are designed around. Worth doing those BEFORE shipping the new routes so the new pages launch with working previews and indexable HTML.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

This is the **Sender** side of a two-part Google Chromecast system. It is a Next.js portfolio website for Walter S. Pollard Jr. that doubles as a Chromecast sender app — allowing a connected TV (via the Receiver at `../skills-jet-receiver`) to display portfolio data and stream media controlled from the browser.

The companion **Receiver** lives at: `C:\Dev\projects\skills-2025\skills-jet-receiver`

## Commands

```bash
# Development
npm run dev           # Start dev server (dynamic mode, no static export)
npm run lint          # Run ESLint

# Testing
npm test                      # Run all Jest tests
npm run test:watch            # Watch mode
npm run test:coverage         # With coverage report
# Run a single test file:
npx jest tests/pages/home.test.tsx

# Production build (static export)
npm run build:production      # NODE_ENV=production next build → generates /out
npm run deploy:build          # lint + build:production + fix-absolute-paths.js
npm run deploy:static         # deploy:build (static files ready in /out for SFTP)
npm run deploy:clean          # Remove .next/ and out/

# Bundle analysis
ANALYZE=true npm run build
```

## Architecture

### Build Modes

`next.config.js` switches behavior based on `NODE_ENV`:

- **Development** (`npm run dev`): Standard Next.js dynamic mode with HMR and source maps. No static export.
- **Production** (`npm run build:production`): `output: 'export'` generates a fully static `/out` directory. After export, `js/build/fix-absolute-paths.js` rewrites absolute `/_next/` asset paths to relative paths so files work on subdirectory-hosted static servers.

Deployment is manual SFTP upload of `/out` contents to the web host.

### Provider / Context Tree

`app/layout.tsx` establishes the global provider tree for every page:

```
<ClientAnimationProvider>   ← GSAP animation context
  <CastProvider>            ← Google Cast SDK state (contexts/CastContext.tsx)
    <KeyboardShortcutHandler />
    {children}              ← page content
    <MediaPanel />          ← global floating Cast media control panel
  </CastProvider>
</ClientAnimationProvider>
```

The Google Cast SDK script is loaded synchronously in `<head>` (layout.tsx:52). The `__onGCastApiAvailable` callback in `CastContext` initializes the CAF framework.

### Chromecast / CAF Layer

The Cast integration is the core differentiator of this codebase. It spans:

| File | Role |
|------|------|
| `contexts/CastContext.tsx` | SDK init, session lifecycle, message bus, acknowledgment tracking |
| `hooks/useCastIntegration.ts` | Higher-level CAF patterns: typed message senders, heartbeat, session health |
| `lib/sessionStorage.ts` | Persists Cast session ID to localStorage (4-hour TTL) |
| `global.d.ts` | TypeScript types for `window.cast`, `window.__onGCastApiAvailable`, and `<google-cast-launcher>` custom element |

Cast namespace: `urn:x-cast:com.nrx.cast.skills`
Cast App ID: `44453EED` (set in `.env` as `NEXT_PUBLIC_CAST_APP_ID`)

Message types sent to receiver: `PORTFOLIO_DATA`, `PROJECT_SHOWCASE`, `SKILLS_SHOWCASE`, `CONTACT_INFO`, `NOTIFICATION`, `CAF_HEARTBEAT`.

### Media / Player Layer

`UnifiedPlayer` (`components/UnifiedPlayer.tsx`) is the canonical player component. It uses `lib/urlDetection.ts` to classify a URL and route it to the right sub-player:

- **Video.js** → HLS (`.m3u8`), MP4
- **Dash.js** (`components/DashJSPlayer.tsx`) → DASH (`.mpd`)
- **ReactPlayer** → Twitch URLs (live streams, VODs, clips)

All three sub-players use `next/dynamic` with `ssr: false` to avoid hydration issues in the static export.

`MediaPanel` (`components/MediaPanel.tsx`) is a global floating panel (rendered in layout) that houses `VideoControl` and `MediaStatusDisplay` for Cast-connected playback.

### Portfolio Data

Static JSON drives the portfolio content:

- `data/projects.json` — project cards
- `data/skills.json` — skill categories with proficiency levels

Primary color: `#39FF14` (neon green). Dark theme throughout.

### Page Routes

| Route | Purpose |
|-------|---------|
| `/` | Main portfolio (Hero, Projects, Skills, Contact) |
| `/cast-debug` | Live Cast session debugger |
| `/cast-demo` | Cast feature demonstration |
| `/media-demo` | Video.js / HLS/DASH player demo |
| `/media-twitch-support` | ReactPlayer Twitch demo |
| `/media-twitch-dashboard` | Twitch dashboard (MediaTwitchDashboard component) |
| `/twitch-glazer` | Twitch-specific player experience |
| `/unified-player-test` | UnifiedPlayer test harness |

### Testing

Tests live in `tests/` and follow the pattern `tests/pages/<page>.test.tsx`. Jest is configured in `jest.config.js` using `next/jest` with `jsdom` environment and the `@/` path alias mapping to the repo root.

### Path Alias

`@/` maps to the repo root. Configured in both `jest.config.js` (moduleNameMapper) and Next.js (tsconfig paths).

## Known Cruft / Active Cleanup Debt

Several duplicates and leftovers exist — do not use them as canonical references:

All previously identified cruft has been removed. The canonical player chain is:
`UnifiedPlayer` → `VideoJSPlayer.tsx` (wrapper) → `VideoJSPlayer.client.tsx` (Video.js impl)

Do not remove `VideoJSPlayer.client.tsx` — it is the active Video.js engine used by UnifiedPlayer.

## Environment Variables

Defined in `.env`:

```
NEXT_PUBLIC_CAST_APP_ID=44453EED
NEXT_PUBLIC_CAST_NAMESPACE=urn:x-cast:com.nrx.cast.skills
NEXT_PUBLIC_BASE_URL=https://walter.pollardjr.com
```

All `NEXT_PUBLIC_` variables are inlined at build time by Next.js.

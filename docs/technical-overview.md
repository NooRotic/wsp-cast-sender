# Technical Overview — Walter S. Pollard Jr. Portfolio

A full-stack engineering reference covering architecture, technology choices, and implementation highlights for the portfolio site and Chromecast sender application.

---

## Project Summary

This is a **Next.js 15 portfolio site** that doubles as a **Google Chromecast Sender application** — part one of a two-part Chromecast ecosystem. The site presents professional portfolio content while enabling a connected TV (via a companion Receiver app) to display that content and stream media controlled from the browser.

**Live:** `https://walter.pollardjr.com`
**Repo:** `github.com/NooRotic/project-jet-sender`
**Companion Receiver:** `github.com/NooRotic/project-jet-receiver`

---

## Tech Stack

### Frontend Framework

**Next.js 15** with **TypeScript** — chosen for its hybrid rendering model. The site runs in dynamic mode during development (HMR, fast iteration) and switches to `output: 'export'` for production, generating a fully static site with no server-side runtime dependency. This makes it deployable to any static host while retaining the full Next.js component model and file-based routing during development.

**Tailwind CSS** — utility-first styling with a consistent dark theme and a signature neon green (`#39FF14`) accent throughout. Responsive from mobile-first with breakpoints handling the complex hero layout (single-column mobile, two-column desktop).

### Animation Layer

**GSAP (GreenSock)** with **SplitType** — the hero section runs a sequenced GSAP timeline that:
- Types the developer name character by character (TextPlugin)
- Cycles through three identity phrases before settling
- Splits subtitle text into words/characters for staggered entrance animations
- Floats skill cards with independent yoyo loops on separate stagger timings
- Kills the timeline and shows content immediately if the user scrolls before it completes

The animation system is gated behind an `AnimationContext` — navigation items stay hidden until `heroAnimationsComplete` is set, preventing UI flash during the intro sequence.

Timeline labels (`title-intro`, `title-cycle`, `title-return`, `subtitles`, `skills`) are anchored throughout the GSAP timeline chain for maintainability.

### Video Player Architecture

The canonical player is **UnifiedPlayer** — a single component that accepts a `url` prop and internally routes to the right playback engine based on URL detection:

```
UnifiedPlayer (url)
    │
    ├── lib/urlDetection.ts  →  detectURLType(url)
    │
    ├── HLS / MP4            →  VideoJSPlayer (Video.js)
    ├── MPEG-DASH (.mpd)     →  DashJSPlayer (Dash.js)
    └── Twitch URLs          →  ReactPlayer
```

All three sub-players are loaded with `next/dynamic` and `ssr: false` — these libraries directly access `window` and `document` and cannot run server-side. The dynamic import also keeps them out of the initial bundle.

`lib/urlDetection.ts` covers:
- HLS streams (`.m3u8`, common CDN patterns)
- MPEG-DASH manifests (`.mpd`)
- MP4 direct files
- Twitch channels, VODs, and clip URLs (regex-matched)
- Unknown fallback (defaults to Video.js)

This architecture solved the "many agentic iterations" problem of trying to maintain one monolithic player that handled every protocol — instead, each engine is isolated, independently upgradeable, and only loaded when needed.

### Chromecast / Cast Application Framework (CAF)

The Cast integration is the core differentiator of this project. The Cast SDK is loaded synchronously in `<head>` and initializes via the `__onGCastApiAvailable` global callback.

**Cast namespace:** `urn:x-cast:com.nrx.cast.skills`
**Cast App ID:** `44453EED`

The integration spans several layers:

| File | Responsibility |
|---|---|
| `contexts/CastContext.tsx` | SDK init, session lifecycle, message bus, acknowledgment tracking |
| `hooks/useCastIntegration.ts` | Higher-level CAF patterns: typed message senders, heartbeat, session health monitoring |
| `lib/sessionStorage.ts` | Persists Cast session ID in localStorage with a 4-hour TTL for reconnection |
| `global.d.ts` | TypeScript types for `window.cast`, `window.__onGCastApiAvailable`, `<google-cast-launcher>` |

Message types sent to the Receiver: `PORTFOLIO_DATA`, `PROJECT_SHOWCASE`, `SKILLS_SHOWCASE`, `CONTACT_INFO`, `NOTIFICATION`, `CAF_HEARTBEAT`.

`MediaPanel` is a global floating component rendered in `app/layout.tsx` that provides Cast-connected playback controls across all pages — volume, seek, play/pause — without coupling those controls to any specific page.

The two-part architecture (Sender + Receiver) is what makes this project stand out as a Chromecast engineering showcase rather than a standard portfolio site.

### Provider / Context Tree

```
app/layout.tsx
└── ClientAnimationProvider     GSAP animation gating (nav visibility)
    └── CastProvider            Cast SDK state, session, message bus
        ├── KeyboardShortcutHandler
        ├── {children}          Page content
        └── MediaPanel          Global Cast media controls (floating)
```

Each provider is narrow in responsibility and composable independently.

---

## Architecture Decisions

### Static Export on Shared Hosting

The site generates a fully static `/out` directory — zero Node.js, zero server runtime in production. This was a deliberate constraint: IONOS shared hosting is static-only, which pushed the architecture toward static export early and kept deployment simple (SCP file upload, no process management).

The challenge with Next.js static exports is that asset paths are generated as absolute `/_next/...` references, which break when served from a subdirectory. A custom post-build script (`js/build/fix-absolute-paths.js`) walks every HTML file and rewrites paths to relative (`../_next/` for nested routes, `./_next/` for root). This makes the build portable to any subdirectory without nginx rewrites.

### Build Mode Switching

`next.config.js` checks `NODE_ENV` at config load time:

```js
const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
  output: isProduction ? 'export' : undefined,
  ...
};
```

Development runs in full dynamic Next.js mode with HMR. CI and production builds run with `output: 'export'`. This single config handles both use cases without maintaining separate config files.

### Lazy Loading at Scale

`VideoLibrary` handles potentially hundreds of video sources (HLS streams, VODs) in a grid layout. Rather than rendering all cards at once:

1. Initial render shows first 50 items
2. A `setTimeout(100ms)` loop progressively adds 50 more per tick
3. Each `LazyVideoCard` uses `IntersectionObserver` to defer thumbnail loading until the card enters the viewport

This keeps the initial render fast even with very large playlists. `LazyVideoCard` accepts a typed `VideoCardColors` interface for theming — the border, text, background, and indicator colors are all passed in, making the card reusable across different playlist contexts with different visual treatments.

---

## CI/CD Pipeline

Three GitHub Actions workflows manage the full release lifecycle:

### `ci.yml` — PR Gate
Runs on every pull request and non-protected branch push. Blocks bad code from reaching shared branches.
```
Lint (ESLint) → Test (Jest, 146 tests) → Build check (static export)
```

### `deploy-staging.yml` — Staging Auto-Deploy
Triggers automatically on every merge to `staging`. Runs the full test suite before building and deploying to `staging.walter.pollardjr.com`.
```
Lint → Test → Build (staging URL baked in) → SCP to staging server
```

### `deploy-ssh.yml` — Production Manual Deploy
**Manual trigger only** (`workflow_dispatch`). Never auto-deploys on push. The operator reviews staging, confirms it's ready, then explicitly triggers the production deploy from GitHub Actions or via `gh workflow run`.
```
Lint → Test → Build (prod URL baked in) → SCP to production server
```

### Environment Variable Injection Pattern

`.env` is gitignored. All `NEXT_PUBLIC_*` variables are stored in a single GitHub Secret (`ENV_FILE`) containing the full `.env` file content. Each workflow writes it to disk before building:

```yaml
- name: Write .env from secret
  env:
    ENV_FILE: ${{ secrets.ENV_FILE }}
  run: printf '%s' "$ENV_FILE" > .env
```

`NEXT_PUBLIC_BASE_URL` is then overridden per-environment at the build step level so each environment gets the correct URL baked into its static export. This solved a subtle issue: since Next.js inlines `NEXT_PUBLIC_*` values at compile time, staging and production builds needed to produce genuinely different outputs from the same source code.

### IONOS Shared Hosting Constraint

IONOS shared hosting supports password-based SSH authentication only — SSH key authentication is a Cloud/VPS feature. This was discovered during CI setup when key auth consistently failed at handshake despite a valid key format. The solution was switching `appleboy/ssh-action` from `key:` to `password:` and adding `SSH_PASSWORD` to GitHub Secrets. The SCP file transfer uses the same password approach.

---

## Testing

**Jest** with **@testing-library/react** and **jsdom** — 146 tests across:

| Test location | Coverage |
|---|---|
| `tests/pages/` | All 8 page components render correctly, key UI elements present |
| `tests/unit/urlDetection.test.ts` | 43 tests — all URL detection functions, edge cases, round-trip integration |

The `@/` path alias maps to the repo root in both TypeScript (`tsconfig.json`) and Jest (`jest.config.js` `moduleNameMapper`) so import paths are consistent between source and tests.

Tests run in every CI pipeline before any build or deploy step — a failing test blocks deployment at both staging and production.

---

## Portfolio Data

Static JSON drives the portfolio content:
- `data/projects.json` — project cards with tech tags, descriptions, links
- `data/skills.json` — skill categories with proficiency levels and icons

No CMS or database — intentionally. The portfolio content is version-controlled alongside the code, making updates a PR like any other change, with the same CI gate and staged rollout.

---

## Page Routes

| Route | Purpose |
|---|---|
| `/` | Main portfolio — Hero, Projects, Skills, Contact |
| `/cast-debug` | Live Cast session debugger for development |
| `/cast-demo` | Cast feature demonstration |
| `/media-demo` | Multi-format video player demo (HLS, DASH, MP4) |
| `/media-twitch-support` | ReactPlayer Twitch integration demo |
| `/media-twitch-dashboard` | Twitch dashboard view |
| `/twitch-glazer` | Twitch-specific player experience |
| `/unified-player-test` | UnifiedPlayer test harness |

The Cast debug and media demo pages are engineering tools that ship in the same build — they serve as live documentation and debugging surfaces for the Cast integration.

---

## Engineering Highlights for Discussion

### "Why a Chromecast sender in a portfolio site?"
Chromecast CAF development is a niche skill. Building it into the portfolio itself is the demonstration — the TV becomes a second screen that mirrors and extends the web experience. It shows full-stack thinking: browser SDK, message protocol design, companion app architecture, and the UX challenge of controlling a non-interactive TV screen from a touch/mouse interface.

### "How does the video player handle so many formats?"
URL detection drives player selection — the URL is the schema. `detectURLType()` returns a typed enum value that UnifiedPlayer maps to the right engine. Adding a new video format means adding a detection rule and a player component; nothing else changes. This is a small-scale plugin pattern.

### "Why static export instead of SSR or ISR?"
The content is a personal portfolio — it doesn't change per-user and doesn't need server-side data fetching. Static export gives maximum portability (any CDN or static host), zero cold-start latency, and eliminates an entire class of runtime errors. The trade-off is manual redeploy on content changes, which is acceptable given the deployment pipeline is a 2-minute automated process.

### "How do you handle secrets in CI?"
A single `ENV_FILE` GitHub Secret holds the full `.env` content. Workflows write it to disk with `printf '%s'` (not `echo`, to preserve special characters), then the build reads it normally. Per-environment overrides (like the base URL) are applied at the build step level via `env:`, which takes precedence over `.env` file values. This avoids maintaining separate secret sets for each environment while still producing environment-correct builds.

### "What was the hardest part of the CI setup?"
Two things: First, IONOS shared hosting's SSH key auth restriction — discovering that only password auth was supported required adding a diagnostic workflow to inspect the key format and connection handshake before realizing the constraint was at the hosting tier, not the configuration. Second, the `ENV_FILE` shell injection bug — injecting a GitHub Secret directly into a `printf` command caused a shell syntax error when the secret contained parentheses. The fix was passing the secret as an environment variable (`env: ENV_FILE: ${{ secrets.ENV_FILE }}`) and referencing it as `$ENV_FILE` in the shell — a subtle but important distinction in how GitHub Actions evaluates expressions vs. shell execution.

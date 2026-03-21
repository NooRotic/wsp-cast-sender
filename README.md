# wsp-cast-sender

**Part 1 of 2 — Google Chromecast Sender Application**

> A Next.js 15 portfolio site that doubles as a Chromecast sender app, enabling a connected TV to display portfolio content and stream media controlled from the browser.

**Live:** [walter.pollardjr.com](https://walter.pollardjr.com) &nbsp;|&nbsp; **Companion Receiver:** wsp-cast-receiver *(coming soon — currently private)*

---

## The Two-Part System

This project is one half of a complete Chromecast ecosystem built from the ground up:

```
┌─────────────────────────────────┐         ┌──────────────────────────────────┐
│         wsp-cast-sender         │         │        wsp-cast-receiver         │
│   (this repo — browser/web)     │         │      (Chromecast device/TV)      │
│                                 │         │                                  │
│  • Next.js 15 portfolio site    │  Cast   │  • Custom CAF Receiver app       │
│  • Google Cast SDK (sender)     │ ──────► │  • Displays portfolio content    │
│  • Typed message protocol       │  API    │  • Streams cast media on TV      │
│  • Session management           │         │  • Responds to typed messages    │
│  • Media playback controls      │         │  • Heartbeat acknowledgment      │
└─────────────────────────────────┘         └──────────────────────────────────┘
       walter.pollardjr.com                        Chromecast device (TV)
```

**Cast namespace:** `urn:x-cast:com.nrx.cast.skills`
**Cast App ID:** `44453EED`

The browser controls the TV. Portfolio content visible on screen can be sent to and displayed on a Chromecast-connected television, and all media playback is remotely controlled from the sender interface.

---

## Why This Architecture

Chromecast Application Framework (CAF) development is a niche but real engineering discipline. It spans browser-side SDK integration, a custom message protocol, companion app architecture, and the UX challenge of controlling a non-interactive display from a touch or mouse interface.

Building this into the portfolio itself is the demonstration. The TV becomes a second screen that mirrors and extends the web experience — showing full-stack thinking across two coordinated applications with a typed, acknowledged message bus between them.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, TypeScript |
| Styling | Tailwind CSS — dark theme, `#39FF14` neon accent |
| Animation | GSAP + SplitType — hero timeline, typewriter, staggered card floats |
| Cast SDK | Google Cast Application Framework (CAF) |
| Video — HLS / MP4 | Video.js |
| Video — MPEG-DASH | Dash.js |
| Video — Twitch | ReactPlayer |
| UI Components | shadcn/ui, Radix UI |
| Testing | Jest + @testing-library/react |
| CI/CD | GitHub Actions — PR gate, staging auto-deploy, manual prod deploy |
| Hosting | IONOS shared hosting — fully static export, deployed via SCP |

---

## Architecture

### Provider Tree

Every page is wrapped in a composable provider tree defined in `app/layout.tsx`:

```
ClientAnimationProvider    ← GSAP gating — nav hidden until hero intro completes
  └── CastProvider         ← Cast SDK state, session lifecycle, message bus
        ├── KeyboardShortcutHandler
        ├── {children}     ← page content
        └── MediaPanel     ← global floating Cast playback controls (all pages)
```

### Cast Integration

The Cast layer spans four files with distinct responsibilities:

| File | Role |
|---|---|
| `contexts/CastContext.tsx` | SDK init, session lifecycle, message bus, acknowledgment tracking |
| `hooks/useCastIntegration.ts` | Typed message senders, heartbeat, session health monitoring |
| `lib/sessionStorage.ts` | Cast session persistence in localStorage — 4-hour TTL |
| `global.d.ts` | TypeScript types for `window.cast`, `window.__onGCastApiAvailable`, `<google-cast-launcher>` |

Message types sent to the receiver: `PORTFOLIO_DATA`, `PROJECT_SHOWCASE`, `SKILLS_SHOWCASE`, `CONTACT_INFO`, `NOTIFICATION`, `CAF_HEARTBEAT`.

### Video Player Architecture

`UnifiedPlayer` accepts a URL and internally routes to the right engine via `lib/urlDetection.ts`:

```
UnifiedPlayer (url)
    │
    ├── lib/urlDetection.ts  →  detectURLType(url)
    │
    ├── HLS / MP4            →  VideoJSPlayer  (Video.js)
    ├── MPEG-DASH (.mpd)     →  DashJSPlayer   (Dash.js)
    └── Twitch URLs          →  ReactPlayer
```

All three sub-players load via `next/dynamic` with `ssr: false` — isolated, independently upgradeable, only bundled when needed. Adding a new format means adding a detection rule and a player component; nothing else changes.

### Static Build System

`next.config.js` switches on `NODE_ENV`:
- **Development** — standard dynamic Next.js with HMR and source maps
- **Production** — `output: 'export'` generates a fully static `/out` directory

A post-build script (`js/build/fix-absolute-paths.js`) rewrites `/_next/` absolute references to relative paths so the static export works correctly on subdirectory-hosted servers without nginx rewrites.

---

## Page Routes

| Route | Purpose |
|---|---|
| `/` | Main portfolio — Hero, Projects, Skills, Contact |
| `/cast-debug` | Live Cast session debugger (engineering tool) |
| `/cast-demo` | Cast feature demonstration |
| `/media-demo` | HLS / DASH / MP4 player demo with VideoLibrary |
| `/media-twitch-support` | ReactPlayer Twitch integration demo |
| `/media-twitch-dashboard` | Twitch dashboard view |
| `/twitch-glazer` | Twitch-specific player experience |
| `/unified-player-test` | UnifiedPlayer test harness |

The Cast debug and media demo pages ship in the same build — they serve as live documentation and debugging surfaces for the Cast integration.

---

## Local Development

```bash
# Install dependencies
npm install

# Dev server — dynamic mode, HMR at localhost:3000
npm run dev

# Lint
npm run lint

# Tests
npm test
npm run test:watch
npm run test:coverage

# Production static export → /out
npm run build:production

# Full deploy build: lint + build + fix asset paths
npm run deploy:build
```

Copy `.env.example` to `.env` and fill in your values before running. See `.env.example` for all required variables.

---

## CI/CD Pipeline

Three GitHub Actions workflows manage the full release lifecycle:

| Workflow | Trigger | Action |
|---|---|---|
| `ci.yml` | Every PR + branch push | Lint → Test → Build check — no deploy |
| `deploy-staging.yml` | Push to `staging` branch | Lint → Test → Build (staging URL) → SCP to staging server |
| `deploy-ssh.yml` | Manual `workflow_dispatch` only | Lint → Test → Build (prod URL) → SCP to production server |

All `NEXT_PUBLIC_*` variables are stored as a single `ENV_FILE` GitHub Secret, written to disk at build time with `printf '%s' "$ENV_FILE" > .env`. `NEXT_PUBLIC_BASE_URL` is overridden per environment so each build gets the correct URL baked into the static export.

See [`deploy_walkthrough.md`](./deploy_walkthrough.md) for the full step-by-step release process, GitHub Secrets reference, and rollback instructions.

---

## Companion Receiver

The receiver application: **NooRotic/wsp-cast-receiver** *(coming soon — currently private)*

It handles the TV side — receiving typed messages from this sender, rendering portfolio content on the Chromecast screen, managing media playback, and sending acknowledgments back through the Cast message bus.

Both repos are required for the full Chromecast experience. The sender controls; the receiver displays. The receiver repo will be published once cleanup and rebranding are complete.

---

## License

MIT

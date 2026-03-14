# Twitch Glazer — Page Review

**Branch:** `feature/demo-pages-audit-and-new-page` → fixes landed in `feature/twitch-dashboard-fixes`
**Date:** 2026-03-04 (updated 2026-03-13)
**Pages in scope:** `/twitch-glazer`, `/media-twitch-support`
**Components in scope:** `MediaTwitchDashboard`, `TwitchPlayer`, `lib/twitchApi.ts`, `lib/urlDetection.ts` (Twitch paths)

---

## What the Page Does

`/twitch-glazer` is a two-part Twitch exploration interface:

1. **MediaTwitchDashboard** — OAuth-authenticated Twitch channel explorer. Fetches clips, videos, follower counts, stream status, game data, and runs analytics (top clippers, view totals, timeline).
2. **TwitchPlayer** — A simple iframe-based Twitch embed that accepts a channel name or clip URL and plays it inline.

Auth uses Twitch's **Implicit Grant Flow** (correct for static exports — no backend required). Token stored in `localStorage`.

---

## Pros

- **URL detection is solid** — `urlDetection.ts` correctly handles clips (`clips.twitch.tv/...`), VODs (`/videos/\d+`), and live streams with regex fallback chain; no known edge case failures
- **SSR-safe** — both components use `"use client"` + `dynamic({ ssr: false })`; localStorage calls are guarded with `typeof window !== 'undefined'`
- **OAuth flow is correct** — Implicit Grant redirect, token extracted from URL fragment, stored and reused across API calls
- **ClipStats analytics are sophisticated** — memoized computation ranks clippers by count, total views, total seconds clipped, and earliest/latest activity; bar chart rendering is included
- **UnifiedPlayer Twitch support works** — routes Twitch URLs to ReactPlayer with correct `parent` parameter for embed compliance
- **Channel history / autocomplete** — localStorage-backed, up to 10 recent channels surfaced as suggestions

---

## Bugs

| # | Location | Issue | Status |
|---|----------|-------|--------|
| 1 | `MediaTwitchDashboard.tsx` | **Auto-login on mount** — `loginWithTwitch()` fires immediately if no token exists, redirecting the user away before they can interact. | ✅ Fixed in PR #3 |
| 2 | `MediaTwitchDashboard.tsx` | **Clip stats rendered twice** — the stats block appears once in the 3-column grid and again at full width below it. Duplicate data, wasted space. | ✅ Fixed in PR #3 |
| 3 | `MediaTwitchDashboard.tsx` | **Bar chart inconsistency** — grid stats use `Math.round((views / maxViews) * 100)` for width %; the second render uses a hardcoded `/2` divisor. Different bars, same data. | ✅ Fixed in PR #3 (duplicate block removed) |
| 4 | `MediaTwitchDashboard.tsx` | **No token expiry handling** — Implicit Grant tokens expire (~60 days). Expired tokens cause silent 401 failures on every API call with no user feedback. | ✅ Fixed in PR #3 (`assertNotUnauthed` + `handleExpiredToken`) |
| 5 | `TwitchPlayer.tsx` | **No iframe `onError` handler** — if the embed fails (private channel, region lock, embed disabled), the user sees a blank area with no message. | ✅ Fixed in PR #3 |
| 6 | `MediaTwitchDashboard.tsx` | **Possible `clip.duration` crash** — `clipStats` sums `clip.duration` with no null check; undefined duration breaks the accumulator silently. | ✅ Guarded via `if (clip.duration)` check in `useMemo` |

---

## Issues / Gaps

### Functional
- **`parent` parameter** is derived from `window.location.hostname` at runtime. On localhost this is `localhost` — Twitch requires the domain to be allowlisted in the app's developer console. Not a code bug but a deploy-time requirement that needs documenting.
- **Request limits hardcoded** to 50 clips / 50 videos — no pagination, no "load more".
- **Generic error messages** — "Failed to load channel data" gives no indication whether the cause is a network error, invalid channel name, expired token, or rate limit.
- **No logout confirmation** — single click bottom-right clears the session token; easy to mis-tap.
- **Autocomplete suggestions** show full history regardless of input value rather than filtering to matching prefixes.

### UI / UX
- The page currently has **no top-level heading or context** explaining what "Twitch Glazer" is to a new visitor — just drops straight into the dashboard.
- **Stats buried** below a long clips grid — most visitors won't scroll to the analytics.
- **No copy-to-clipboard** on clip URLs, channel links, or embed codes.
- **No "open on Twitch" link** in the TwitchPlayer component (UnifiedPlayer has this; TwitchPlayer does not).
- **Loading state blocks the whole dashboard** — user can't browse previously loaded data while a new channel fetch is in progress.
- **No keyboard shortcut** to trigger search (Enter in the channel input does submit, but there's no `/` shortcut to focus the input).

### Accessibility
- Buttons in MediaTwitchDashboard lack `aria-label` attributes (icon-only buttons are not screen-reader-friendly).
- Profile images have alt text but no `title` attributes.
- Color contrast on the terminal-style output sections should be verified against WCAG AA.

### Code Quality
- ~~`TwitchPlayer` default channel is hardcoded to `'nooroticx'`~~ ✅ Fixed in PR #3
- ~~`fetchAll()` makes 6 sequential API calls~~ ✅ Fixed in `feature/twitch-dashboard-fixes` — calls 2–6 now run in parallel via `Promise.all`
- ~~`require()` inside `useEffect` and `login()`~~ ✅ Fixed in `feature/twitch-dashboard-fixes` — converted to top-level imports
- ~~`assertNotUnauthed` only handles 401, not 403/429~~ ✅ Fixed in `feature/twitch-dashboard-fixes` — `!res.ok` guard added
- ~~`catch` block could overwrite session-expired error~~ ✅ Fixed in `feature/twitch-dashboard-fixes` — `SessionExpiredError` class used; catch skips re-setting on session errors
- `twitchApi.ts` silently swallows error bodies — should at minimum `console.warn` the raw response.

---

## Recommendations (Priority Order)

1. **Fix the auto-login redirect** (P0) — gate `loginWithTwitch()` behind a user-initiated "Connect Twitch" button. This is the root cause of the broken nav link and is blocking the page from being publicly linked.
2. **Add token expiry detection** (P1) — on 401 response, clear the stored token and prompt re-login with a visible message.
3. **Remove duplicate stats block** (P1) — keep the full-width analytics section, remove the abbreviated copy from the 3-column grid.
4. **Add iframe `onError` fallback in TwitchPlayer** (P1) — show a message + direct link when embed fails.
5. **Fix bar chart width calculation** (P2) — use the percentage method consistently in both render locations.
6. **Add page intro / hero text** (P2) — one sentence explaining what the page is for.
7. **Parallelise `fetchAll()` API calls** (P2) — `Promise.all([userReq, clipsReq, videosReq, ...])`.
8. **Add null guard on `clip.duration`** (P2).
9. **Filter autocomplete suggestions** by current input value (P3).
10. **Add logout confirmation** (P3).

---

## Player Chain — Twitch URL Support Summary

| URL format | Detected as | Player used | Works? |
|------------|-------------|-------------|--------|
| `twitch.tv/channelname` | `twitch-stream` | ReactPlayer | ✅ |
| `twitch.tv/videos/123456` | `twitch-video` | ReactPlayer | ✅ |
| `clips.twitch.tv/ClipSlug` | `twitch-clip` | ReactPlayer | ✅ |
| `twitch.tv/channel/clip/Slug` | `twitch-clip` | ReactPlayer | ✅ |
| Bare channel name (no domain) | Not detected | — | ❌ needs guard |

**Note:** ReactPlayer requires `parent: [hostname]` in its Twitch config — this is correctly set in `UnifiedPlayer.tsx` from `window.location.hostname`.

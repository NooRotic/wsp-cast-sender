# Portfolio Expansion Research — 2026-05-20

> Cross-project handoff from the `indeed_me` job search project. Walter asked for new-page ideas to give him a reason to re-plug `walter.pollardjr.com` more often. The `/timeline` page generated meaningful engagement, so the brief was: do that again, but spread the surface area.

## State of the site (as of 2026-05-20)

**Stack:** Next.js 14+ App Router, static export at production, TypeScript, Tailwind, GSAP, custom dark theme with neon green `#39FF14` accent. Doubles as a Chromecast sender app paired with `skills-jet-receiver`.

**Existing routes:**

| Route | Purpose |
|---|---|
| `/` | Home — hero + projects + skills + contact sections, GSAP intro animation |
| `/timeline` | 25-year career timeline visualization (recent addition, getting traction) |
| `/cast-demo`, `/cast-debug` | Chromecast sender demos |
| `/media-demo`, `/media-twitch-dashboard`, `/media-twitch-support` | Media player demos |
| `/twitch-glazer`, `/unified-player-test` | Misc demos |

**Navigation today:** Home / Skills / Projects / Contact / Timeline / Demos dropdown / Cast buttons.

**What's missing for re-share economics:** the site is currently static. Once someone has seen it, there's no reason for them to come back, and there's no reason for Walter to re-share. The timeline page worked precisely because it was new content — re-share friction was low. Same trick works repeatedly only if there's a stream of new things to point to.

---

## 5 page ideas, ranked by re-plug economics

### 1. `/now` — indie-web "What I'm doing now" page ⭐ recommended

**The pattern:** [nownownow.com](https://nownownow.com/) standard. Single page describing what you're doing right now: current job-search state, current projects, current reading. Updated whenever priorities shift. Each update is a fresh re-share moment with a low-friction hook ("My `/now` just changed").

**For Walter specifically:**
- "Interviewing for senior video / AI-native roles. Currently in late stages with X / open to conversations with Y."
- "Currently building [active project]. Currently shipping `applications/...` from the JobTrackr pipeline."
- "Reading / watching / learning [thing]."
- Last-updated date prominent at top.

**Re-plug economics:** Highest. Cheap to update, low expectations on length, naturally generates LinkedIn / Twitter / cold-email talking points whenever it changes.

**Implementation cost:** Low. Single MDX or inline TSX page. ~1 day to ship.

---

### 2. `/blog` — long-form writing ⭐ Walter's explicit ask

**The hook:** Walter has 25 years of stories that aren't written down anywhere. Chromecast CAF gotchas. Debugging tooling philosophy from the Comcast Xfinity Stream era. The AI-slop reframe. StreamCaC. DRM token failures on Safari/Firefox. The shift from Polymer to React. The Justin.tv → Twitch era as a user.

**What each post is worth:**
- A re-share moment when published
- A linkable artifact in cover letters and recruiter conversations ("I wrote about this here")
- Permanent SEO surface for the niche keywords nobody else owns ("Chromecast CAF heartbeat", "DAI vs SSAI in production", "AI-slop generation")
- A natural off-ramp from /timeline (timeline links to relevant posts)

**Starter post candidates:**
1. "How I built debugging tooling that 100+ engineers used at Comcast" — the in-player debug panel + StreamCaC story
2. "Chromecast CAF: the heartbeat pattern that took a year to get right"
3. "Breaking through AI-slop: project-backed prompts and world-building" — the cover-letter voice signature, expanded
4. "13 years as the Xfinity Stream video player SME, in 13 lessons"
5. "From Flash to Lit: the production stacks that disappeared under my feet"

**Implementation cost:** Medium. MDX content, post listing, post detail, RSS feed, OG image generation. ~2-3 days to ship the platform; posts are content work after that.

---

### 3. `/uses` — indie-web stack page

**The pattern:** [uses.tech](https://uses.tech/) standard. A list of every tool, editor, hardware piece, and AI workflow component Walter uses daily. Recruiters and engineers click through this stuff because it's a fast credibility signal — "they really do use this."

**For Walter specifically:**
- Hardware (machine, monitor, keyboard, headphones)
- Editor stack (Zed, VSCode, terminal)
- AI tooling (Claude Code as primary, GitHub Copilot, Gemini)
- Daily browsers, extensions
- Audio / video / streaming tools (OBS, video.js, etc.)
- The local-resume + cover-letter generation pipeline (puppeteer, marked, themed `.mjs` files)

**Re-plug economics:** Medium. Re-shares once a quarter when the stack actually changes; lower frequency than `/now` but higher trust signal.

**Implementation cost:** Very low. One static page. ~Half a day.

---

### 4. `/projects/{slug}` — per-project case study pages

**The gap:** The current home-page `<ProjectsSection />` is a card grid. Each card is a one-line teaser. There's nowhere for a hiring manager to dig deeper without leaving the site to GitHub.

**What case studies enable:**
- Architecture diagrams + decisions for JobTrackr, RipTheAI, walter.pollardjr.com itself (very meta), the Chromecast sender/receiver pair
- Debug screenshots — Walter's strongest visual differentiator
- "What I broke and how I fixed it" sections — engineering authenticity
- Linkable in cover letters: "I wrote about the architecture for that here"

**Re-plug economics:** Medium. Each new case study is re-share-able once. Permanent SEO surface.

**Implementation cost:** Medium-high. New route + per-project content. Could share infrastructure with `/blog` (both are slug-based content pages).

---

### 5. `/feed` — auto-aggregated changelog

**The idea:** A single chronological stream pulling together /blog posts, /now updates, GitHub activity (public repo pushes), and any other update vector. A "build in public" surface that anyone can subscribe to via RSS.

**Why it matters:** Walter doesn't have to remember to post on social. The feed becomes the canonical "what's Walter up to" surface, and the rest of the site (LinkedIn / Twitter / email signature) just links to it.

**Re-plug economics:** High once `/blog` + `/now` exist. Standalone, the page has nothing to aggregate.

**Implementation cost:** Low if `/blog` and `/now` are already shipped. Just pulls their data + GitHub API at build time. ~Half a day after the others.

---

## Recommended build order

1. **`/now`** first. Cheapest, highest re-plug frequency, lowest content debt.
2. **`/blog`** second. Higher cost but the highest-value re-plug surface long-term.
3. **`/uses`** third. Cheap one-off that ships in a day.
4. **`/feed`** fourth, after `/blog` and `/now` have content to aggregate.
5. **`/projects/{slug}`** last. Highest content cost (each case study is a real writing project), best done after the simpler pages are live.

The first three (`/now`, `/blog`, `/uses`) can ship in roughly a week of focused work and give Walter three fresh re-plug hooks instantly.

---

## Voice consistency note for the next session

Whoever builds these should read `~/.claude/projects/C--Dev-projects-indeed-me/memory/feedback_cover_letter_standard.md` (especially §4 voice rules) and `user_walter.md` first. Walter's public-facing voice should match his cover-letter voice:

- Zero em dashes
- No "X, not Y" antithesis
- No slick-pitch vocabulary (playbook, toolkit, wheelhouse, unlock, magic)
- Humble + technically specific
- "shipped" reserved for Comcast-era language; "built / launched / carried / delivered" for personal projects

The timeline page already nails this tone. New pages should match it.

---

## Companion spec

The formal architectural spec for `/blog` + `/now` lives at `docs/specs/2026-05-20-blog-and-now-pages.md`. That's the file to hand off to the next build session.

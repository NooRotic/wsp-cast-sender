# Blog and Now Pages — Architecture Spec

> **Goal:** Add two new public-facing routes to `walter.pollardjr.com` that generate ongoing re-share moments. `/now` is the indie-web "what I'm doing right now" pattern. `/blog` is long-form technical writing with RSS.

> **Companion doc:** `docs/portfolio-expansion-research-2026-05-20.md` — the why behind these pages.

---

## Architecture

### Build mode constraint

The site uses `output: 'export'` in production (`next.config.js`). Every route must be statically generatable. No runtime API routes, no server components reading databases at request time. All content must be readable at build time from the filesystem.

### Tech choices (locked)

- **Content format:** MDX for blog posts, plain TSX for `/now`. MDX gives Walter code blocks + embedded components in posts; plain TSX is simpler for `/now` where updates are small and direct.
- **MDX library:** `next-mdx-remote/rsc` (App Router + RSC + static export support). Alternative `@next/mdx` works too but ties Walter to file-as-route which is the wrong fit for `content/blog/`. The implementing engineer can pick the final lib during build; both produce equivalent output.
- **Frontmatter parsing:** `gray-matter`.
- **GitHub-flavored markdown:** `remark-gfm` (tables, strikethrough, task lists).
- **Syntax highlighting:** `rehype-pretty-code` with the `github-dark` theme to match the site's existing dark palette. Alternative: Shiki via `@shikijs/rehype`.
- **RSS feed:** `feed` library (npm), generated at build time via a postbuild script writing `out/feed.xml`. Not a runtime route handler — the build-time approach is friendlier to `output: 'export'`.

### File structure

**New files to create:**

```
content/
  blog/
    2026-05-20-hello-world.mdx          ← seed post; can be replaced
    .gitkeep
app/
  now/
    page.tsx                            ← /now (inline content, lastUpdated constant)
  blog/
    page.tsx                            ← /blog (list view)
    [slug]/
      page.tsx                          ← /blog/{slug} (post detail)
lib/
  blog.ts                               ← getAllPosts, getPostBySlug, frontmatter types
  mdx-components.tsx                    ← custom MDX renderers (code, links, images)
components/
  blog/
    BlogPostCard.tsx                    ← list item card
    BlogPostHeader.tsx                  ← post title + date + reading time
    NowLastUpdated.tsx                  ← /now header badge
scripts/
  build-rss.mjs                         ← generates out/feed.xml at postbuild time
```

**Files to modify:**

```
next.config.js                          ← add MDX config (page extensions or rehype plugins)
components/Navigation.tsx               ← add /now and /blog menu items (desktop + mobile)
package.json                            ← add scripts.postbuild = "node scripts/build-rss.mjs"
                                        ← add deps: next-mdx-remote, gray-matter, remark-gfm,
                                          rehype-pretty-code, feed, reading-time
```

### Data model

**Blog post frontmatter (in MDX file):**

```yaml
---
title: "How I built debugging tooling that 100+ engineers used at Comcast"
description: "The in-player debug panel and StreamCaC story, told from the production side."
date: "2026-05-22"           # ISO YYYY-MM-DD, used for sort + RSS
tags: ["debugging", "comcast", "chromecast"]   # optional, surfaced under title
draft: false                  # if true, excluded from production list + RSS
ogImage: "/og/streamcac.png"  # optional override; otherwise default OG image
---
```

**TypeScript shape (in `lib/blog.ts`):**

```typescript
export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  draft?: boolean;
  ogImage?: string;
  readingMinutes: number;     // computed via reading-time
}

export interface BlogPost extends BlogPostMeta {
  content: string;            // raw MDX source for rendering
}

export function getAllPosts(): BlogPostMeta[];       // sorted desc by date, drafts filtered in prod
export function getPostBySlug(slug: string): BlogPost;
export function getAllSlugs(): string[];             // for generateStaticParams
```

**/now content shape:**

Single TSX file `app/now/page.tsx`. Content lives inline as JSX with a `LAST_UPDATED` constant at top:

```typescript
const LAST_UPDATED = '2026-05-20';

export default function NowPage() {
  return (
    <main>
      <NowLastUpdated date={LAST_UPDATED} />
      <article>
        <h1>What I'm doing now</h1>
        <section>
          <h2>Job search</h2>
          <p>...</p>
        </section>
        <section>
          <h2>Building</h2>
          <p>...</p>
        </section>
        <section>
          <h2>Reading / learning</h2>
          <p>...</p>
        </section>
      </article>
    </main>
  );
}
```

Walter updates this file directly when his now changes. No content management system, no DB — just a code edit and a deploy. The `LAST_UPDATED` constant should be eyeballed and updated every time the file changes.

### Static generation pattern (blog detail)

`app/blog/[slug]/page.tsx`:

```typescript
export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  return {
    title: `${post.title} — Walter S. Pollard Jr.`,
    description: post.description,
    openGraph: { /* ... */ }
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  return (
    <main>
      <BlogPostHeader title={post.title} date={post.date} readingMinutes={post.readingMinutes} />
      <MDXRemote source={post.content} components={mdxComponents} options={{ /* remark/rehype */ }} />
    </main>
  );
}
```

### RSS feed

`scripts/build-rss.mjs` runs as a postbuild step. Reads all non-draft posts from `content/blog/`, generates RFC-822 XML, writes to `out/feed.xml`. The site head should include `<link rel="alternate" type="application/rss+xml" href="/feed.xml" />` so feed readers auto-discover.

Phase 1 RSS: titles + descriptions + dates + canonical URLs. Phase 2 (optional): full post content in the feed for inline readers.

### Navigation update

`components/Navigation.tsx` `menuItems` array currently: `Home / Skills / Projects / Contact` (all anchor links into the home page) + `Timeline` (separate page) + `Demos` dropdown.

Add two new items as separate page links (not anchor scrolls), placed between `Contact` and `Timeline`:

```typescript
// after the existing menuItems map:
<Link href="/now" className="nav-menu-item">Now</Link>
<Link href="/blog" className="nav-menu-item">Blog</Link>
<Link href="/timeline" className="nav-menu-item">Timeline</Link>
```

Same treatment in the mobile drawer below the existing `<Link href="/timeline">`.

### Visual treatment

**Both pages should match the existing dark + neon-green theme but lean readable.** Long-form content needs more vertical breathing room than the home page's animation-heavy hero.

- Background: same `#000` or near-black as elsewhere
- No `ParticleBackground` on these routes — distracting for reading
- Body type: same sans-serif as the rest of the site, but with `font-size: 17-18px` and `line-height: 1.7` for long-form readability
- Code blocks: dark with neon green accent on language tag; code text in light gray
- Links: `#39FF14` on hover, underline on hover, subtle in body
- `/now` last-updated badge: small chip in neon green at top, e.g. "Last updated: 2026-05-20"
- Max content width: ~680px for blog post body, ~700px for /now (readable line length)

No GSAP intro animations on these routes — they're content pages, not the marketing hero.

### SEO + OG

- Each blog post: `generateMetadata` returns `title`, `description`, `openGraph.images` (per-post override or default), `twitter.card: 'summary_large_image'`
- `/now`: standard `title: "Now — Walter S. Pollard Jr."`, description from a constant at top of file
- Default OG image at `public/og/default.png` (already exists or create — Walter can hand-make one); per-post override via frontmatter
- Phase 2 (deferred): runtime OG image generation via `next/og` route — incompatible with `output: 'export'` unless pre-generated, skip for now

### What's NOT in scope (Phase 2 candidates)

- Tag pages (`/blog/tag/{tag}`)
- Search
- Comments
- View counts
- Author bios (Walter is the only author)
- Per-post OG image auto-generation
- Webmentions
- Newsletter subscribe form

These can all be added later. The Phase 1 surface is: read MDX, render it, list it, RSS it.

---

## Acceptance criteria (Phase 1)

- [ ] `bun run dev` or `npm run dev` starts cleanly with /now and /blog routes accessible
- [ ] `/now` renders inline content with `lastUpdated` badge
- [ ] `/blog` lists posts sorted by date descending, drafts hidden in production
- [ ] `/blog/{slug}` renders MDX with code highlighting, GFM tables, custom link/image components
- [ ] Navigation shows Now + Blog entries on desktop and mobile
- [ ] `npm run build:production` exports static files for all blog slugs
- [ ] `out/feed.xml` exists after postbuild and validates as RFC-822 RSS
- [ ] Site head includes `<link rel="alternate" type="application/rss+xml" href="/feed.xml" />`
- [ ] One seed post exists in `content/blog/` so the list isn't empty on first deploy
- [ ] Voice rules from `feedback_cover_letter_standard.md` §4 followed in the seed post (no em dashes, no slick-pitch, no "X, not Y")
- [ ] Lighthouse scores: Performance ≥ 90, Accessibility ≥ 95 on `/blog` and a sample post

## Out of scope for this spec

- The `/uses` page (lower priority, separate one-day task)
- The `/feed` aggregated changelog (depends on /blog and /now being live first)
- Per-project case study pages `/projects/{slug}` (separate spec when ready)

---

## Implementation handoff

The next session in this repo should:

1. Read this spec end to end
2. Read `docs/portfolio-expansion-research-2026-05-20.md` for context
3. Read `~/.claude/projects/C--Dev-projects-indeed-me/memory/feedback_cover_letter_standard.md` (especially §4) and `user_walter.md` for Walter's public-facing voice rules — these apply to the seed blog post and to /now content
4. Write a TDD-style implementation plan if helpful (the `indeed_me` project's `docs/superpowers/plans/` pattern), OR proceed directly to subagent-driven implementation if the scope is clear
5. Ship Phase 1 acceptance criteria
6. Hand back to Walter with a single seed post + /now skeleton he can fill in

Estimated effort: 2-3 focused days for the platform; content (Walter's actual writing) is separate work.

---

## Resolved decisions (Walter, 2026-05-20)

All 5 spec questions are resolved. Build session can proceed without further clarification.

### 1. Slug format → `date-title`

Use `YYYY-MM-DD-post-title` (e.g. `2026-05-22-debugging-tooling-at-comcast.mdx`). Filesystem sorts chronologically, URLs read as `walter.pollardjr.com/blog/2026-05-22-debugging-tooling-at-comcast`. Slug field in frontmatter is NOT needed — derive from filename.

### 2. Drafts → dev only

`draft: true` frontmatter posts render in `npm run dev` but are filtered out by `getAllPosts()` and `getAllSlugs()` when `process.env.NODE_ENV === 'production'`. The build itself should NOT generate static pages for draft slugs (otherwise their HTML lands in `out/` and is discoverable).

### 3. `/now` default sections → confirmed as-spec

Three sections: **Job search**, **Building**, **Reading / learning**. Walter can add new sections by editing the TSX directly when his now expands (e.g. "Listening", "Watching", "Travel").

### 4. RSS → full content

Phase 1 feed should include full rendered MDX content in each `<item>`, not just descriptions. This lets feed readers like NetNewsWire, Feedly, and email-based readers (Buttondown, Substack imports) show the entire post inline without users having to click through. Walter explicitly chose this for re-share economics — make it as easy as possible to consume the writing.

Implementation note: Shiki/rehype-pretty-code output is HTML, so the feed `<item><description>` (or `<content:encoded>` for proper full-content RSS) should contain rendered HTML wrapped in `<![CDATA[...]]>`. Use the `content:encoded` extension namespace per RSS 2.0 conventions.

### 5. Code-block theme → custom Shiki theme, dark base with burgundy red tinting

Walter requested "Zed dark theme? dark tinting towards burgundy red." None of Shiki's bundled themes match this exact aesthetic, and the site brand uses neon green `#39FF14` as the accent — so a **custom Shiki theme** is the right call.

**Proposed palette (build session to fine-tune in `lib/shiki-walter-burgundy.json`):**

```jsonc
{
  "name": "walter-burgundy",
  "type": "dark",
  "colors": {
    "editor.background": "#1f0e10",        // dark burgundy/wine base
    "editor.foreground": "#e8dcdc"         // soft warm gray text
  },
  "tokenColors": [
    { "scope": ["keyword", "storage"], "settings": { "foreground": "#39FF14" } },   // neon green keywords — site brand match
    { "scope": "string", "settings": { "foreground": "#f4a78a" } },                 // warm coral strings (Hume AI palette echo)
    { "scope": "comment", "settings": { "foreground": "#7a4f55", "fontStyle": "italic" } },  // muted burgundy comments
    { "scope": "constant.numeric", "settings": { "foreground": "#ffb088" } },       // peach numbers
    { "scope": "variable", "settings": { "foreground": "#e8dcdc" } },               // default
    { "scope": "entity.name.function", "settings": { "foreground": "#ffd07b" } },   // warm gold functions
    { "scope": "entity.name.tag", "settings": { "foreground": "#ff6f8a" } },        // rose tags (JSX/HTML)
    { "scope": "support.class", "settings": { "foreground": "#c889f5" } }           // muted violet types
  ]
}
```

Load via `rehype-pretty-code` config:

```typescript
import walterBurgundy from '@/lib/shiki-walter-burgundy.json';

const rehypePrettyCodeOptions = {
  theme: walterBurgundy,
  keepBackground: true,
};
```

Implementation freedom: build session can adjust the exact hex values during iteration. The principle is locked: **dark burgundy background, neon green for keywords (site brand match), warm/coral accents elsewhere.** It should feel cohesive with the rest of the site, not a generic syntax-highlight drop-in.

#!/usr/bin/env node

// Build-time RSS generator. Runs AFTER `npm run build:production` so it can
// write out/feed.xml alongside the rest of the static export. The spec
// (docs/specs/2026-05-20-blog-and-now-pages.md) chose the build-time
// approach over a runtime route handler because it's friendlier to
// `output: 'export'`.
//
// Phase 1: descriptions-only feed (frontmatter description per item).
// Phase 2 follow-up: render full MDX body to HTML and emit via
// <content:encoded>. The seed posts have descriptions, so MVP works
// today even without the full-content upgrade.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { Feed } from 'feed';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const OUT_DIR = path.join(ROOT, 'out');
const OUT_PATH = path.join(OUT_DIR, 'feed.xml');

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://walter.pollardjr.com';

function readPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => {
      const slug = name.replace(/\.mdx$/, '');
      const raw = fs.readFileSync(path.join(BLOG_DIR, name), 'utf8');
      const { data } = matter(raw);
      return {
        slug,
        title: String(data.title ?? slug),
        description: String(data.description ?? ''),
        date: String(data.date ?? slug.slice(0, 10)),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        draft: Boolean(data.draft ?? false),
      };
    })
    .filter((post) => !post.draft) // never include drafts in the public feed
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error(`[build-rss] out/ directory not found at ${OUT_DIR}. Run \`npm run build:production\` first.`);
    process.exit(1);
  }

  const posts = readPosts();

  const feed = new Feed({
    title: 'Walter S. Pollard Jr. | Blog',
    description: 'Long-form writing on streaming video, Chromecast CAF, AI-native development, and 25 years of building for the web.',
    id: `${BASE}/`,
    link: `${BASE}/`,
    language: 'en',
    favicon: `${BASE}/favicon.ico`,
    copyright: `Walter S. Pollard Jr. ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${BASE}/feed.xml`,
    },
    author: {
      name: 'Walter S. Pollard Jr.',
      email: 'walter@pollardjr.com',
      link: BASE,
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${BASE}/blog/${post.slug}/`,
      link: `${BASE}/blog/${post.slug}/`,
      description: post.description,
      author: [{ name: 'Walter S. Pollard Jr.', email: 'walter@pollardjr.com' }],
      date: new Date(post.date),
      category: post.tags.map((name) => ({ name })),
    });
  }

  const xml = feed.rss2();
  fs.writeFileSync(OUT_PATH, xml, 'utf8');
  console.log(`[build-rss] Wrote ${posts.length} post${posts.length === 1 ? '' : 's'} to ${path.relative(ROOT, OUT_PATH)}`);
}

main();

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

// Build-time only — this file reads from the filesystem and is never
// included in the client bundle. Imported by app/blog/page.tsx and
// app/blog/[slug]/page.tsx, both of which run at build time under
// `output: 'export'`.

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export interface BlogPostMeta {
  /** Slug derived from filename (e.g., "2026-05-21-hello-world"). */
  slug: string;
  title: string;
  description: string;
  /** ISO YYYY-MM-DD — used for sort + RSS pubDate. */
  date: string;
  tags?: string[];
  draft?: boolean;
  ogImage?: string;
  /** Computed from the post body via reading-time. */
  readingMinutes: number;
}

export interface BlogPost extends BlogPostMeta {
  /** Raw MDX source for rendering via next-mdx-remote/rsc. */
  content: string;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function readPostFile(filename: string): BlogPost {
  const slug = filename.replace(/\.mdx$/, '');
  const filePath = path.join(BLOG_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ''),
    date: String(data.date ?? slug.slice(0, 10)),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    draft: Boolean(data.draft ?? false),
    ogImage: data.ogImage ? String(data.ogImage) : undefined,
    readingMinutes: Math.max(1, Math.ceil(stats.minutes)),
    content,
  };
}

/**
 * Returns all post metadata (no body), sorted by date descending.
 * Drafts are filtered out in production builds.
 */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const filenames = fs.readdirSync(BLOG_DIR).filter((name) => name.endsWith('.mdx'));

  const posts = filenames.map((name) => {
    const post = readPostFile(name);
    // strip content from the listing shape
    const { content: _omit, ...meta } = post;
    return meta;
  });

  const filtered = isProduction() ? posts.filter((p) => !p.draft) : posts;

  return filtered.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Returns the full post including raw MDX body. Throws if the slug
 * doesn't resolve to a file — App Router's generateStaticParams should
 * prevent that, but defensive throw catches drift.
 */
export function getPostBySlug(slug: string): BlogPost {
  const filename = `${slug}.mdx`;
  const filePath = path.join(BLOG_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Blog post not found: ${slug}`);
  }
  return readPostFile(filename);
}

/**
 * Slug list used by generateStaticParams to pre-render every detail page
 * at build time. Drafts are excluded in production so they don't ship.
 */
export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

/**
 * Convert an ISO date to a human-readable form for headers and cards.
 * "2026-05-21" → "May 21, 2026". Kept here so list + detail render
 * the same format without each page reimplementing it.
 */
export function formatPostDate(iso: string): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const [year, month, day] = iso.split('-');
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

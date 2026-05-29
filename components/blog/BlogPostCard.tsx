import Link from 'next/link';
import type { BlogPostMeta } from '@/lib/blog';
import { formatPostDate } from '@/lib/blog';

export default function BlogPostCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block bg-black/80 backdrop-blur-sm border border-gray-700/50 hover:border-[#39FF14]/40 rounded-lg p-6 transition-all duration-300 hover:bg-black/60 group"
    >
      <article>
        <div className="flex items-baseline gap-3 mb-3 flex-wrap">
          <time
            dateTime={post.date}
            className="text-sm text-[#39FF14] font-medium"
          >
            {formatPostDate(post.date)}
          </time>
          <span className="text-xs text-gray-500" aria-hidden="true">·</span>
          <span className="text-xs text-gray-500">{post.readingMinutes} min read</span>
          {post.draft && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
              DRAFT
            </span>
          )}
        </div>
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-2 group-hover:text-[#39FF14] transition-colors">
          {post.title}
        </h2>
        <p className="text-gray-400 mb-3" style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>
          {post.description}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded bg-[#39FF14]/10 text-[#39FF14]/80 border border-[#39FF14]/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}

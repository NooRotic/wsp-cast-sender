import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog';
import BlogPostCard from '@/components/blog/BlogPostCard';

export const metadata: Metadata = {
  title: 'Blog | Walter S. Pollard Jr.',
  description: 'Long-form writing on streaming video, Chromecast CAF, AI-native development, and 25 years of building for the web.',
  openGraph: {
    title: 'Blog | Walter S. Pollard Jr.',
    description: 'Long-form writing on streaming video, Chromecast CAF, AI-native development, and 25 years of building for the web.',
    type: 'website',
    url: '/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Walter S. Pollard Jr.',
    description: 'Long-form writing on streaming video, Chromecast CAF, AI-native development, and 25 years of building for the web.',
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="relative min-h-screen pt-24 pb-20 px-6">
      <article className="max-w-[760px] mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Blog</h1>
          <p className="text-gray-400" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
            Long-form writing on streaming video, Chromecast CAF, AI-native development, and 25 years of building for the web.
            {' '}
            <a
              href="/feed.xml"
              className="text-[#39FF14] hover:underline"
            >
              RSS feed
            </a>
            .
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-gray-400 italic">No posts yet. Check back soon.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </article>
    </main>
  );
}

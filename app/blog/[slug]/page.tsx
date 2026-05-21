import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import { getAllSlugs, getPostBySlug } from '@/lib/blog';
import { mdxComponents } from '@/lib/mdx-components';
import BlogPostHeader from '@/components/blog/BlogPostHeader';
import walterBurgundy from '@/lib/shiki-walter-burgundy.json';

// Pre-render every published post at build time. Drafts are filtered
// out by getAllSlugs() when NODE_ENV === 'production', so they never
// land in out/ and aren't discoverable via deploy.
export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPostBySlug(slug);
    return {
      title: `${post.title} | Walter S. Pollard Jr.`,
      description: post.description,
      openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        publishedTime: post.date,
        url: `/blog/${post.slug}`,
        ...(post.ogImage ? { images: [post.ogImage] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.description,
        ...(post.ogImage ? { images: [post.ogImage] } : {}),
      },
    };
  } catch {
    return { title: 'Post not found | Walter S. Pollard Jr.' };
  }
}

const rehypePrettyCodeOptions = {
  theme: walterBurgundy,
  keepBackground: true,
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <main className="relative min-h-screen pt-24 pb-20 px-6">
      <article className="max-w-[700px] mx-auto">
        <BlogPostHeader
          title={post.title}
          date={post.date}
          readingMinutes={post.readingMinutes}
          tags={post.tags}
        />
        <div className="prose-walter">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
              },
            }}
          />
        </div>
        <footer className="mt-16 pt-8 border-t border-gray-700/40">
          <a
            href="/blog"
            className="text-[#39FF14] hover:underline text-sm"
          >
            ← Back to all posts
          </a>
        </footer>
      </article>
    </main>
  );
}

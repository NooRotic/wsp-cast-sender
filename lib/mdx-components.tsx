import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';

// Custom renderers for MDX content. Map standard markdown elements to
// brand-aligned components. next-mdx-remote/rsc accepts this object
// via the `components` prop on MDXRemote.

function isInternalLink(href: string | undefined): boolean {
  if (!href) return false;
  return href.startsWith('/') || href.startsWith('#');
}

export const mdxComponents: MDXComponents = {
  // Internal links use next/link for SPA navigation; external get target=_blank + safety rel.
  a({ href, children, ...rest }: ComponentPropsWithoutRef<'a'>) {
    if (isInternalLink(href)) {
      return (
        <Link href={href ?? '#'} className="text-[#39FF14] underline underline-offset-2 hover:text-white transition-colors">
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#39FF14] underline underline-offset-2 hover:text-white transition-colors"
        {...rest}
      >
        {children}
      </a>
    );
  },

  h1({ children, ...rest }: ComponentPropsWithoutRef<'h1'>) {
    return <h1 className="text-3xl md:text-4xl font-bold text-white mt-12 mb-4 leading-tight" {...rest}>{children}</h1>;
  },

  h2({ children, ...rest }: ComponentPropsWithoutRef<'h2'>) {
    return <h2 className="text-2xl md:text-3xl font-semibold text-[#39FF14] mt-10 mb-3 leading-tight" {...rest}>{children}</h2>;
  },

  h3({ children, ...rest }: ComponentPropsWithoutRef<'h3'>) {
    return <h3 className="text-xl md:text-2xl font-semibold text-white mt-8 mb-3 leading-snug" {...rest}>{children}</h3>;
  },

  p({ children, ...rest }: ComponentPropsWithoutRef<'p'>) {
    return <p className="text-gray-200 my-5" style={{ fontSize: '1.0625rem', lineHeight: 1.75 }} {...rest}>{children}</p>;
  },

  ul({ children, ...rest }: ComponentPropsWithoutRef<'ul'>) {
    return <ul className="text-gray-200 my-5 ml-6 list-disc space-y-2" style={{ fontSize: '1.0625rem', lineHeight: 1.7 }} {...rest}>{children}</ul>;
  },

  ol({ children, ...rest }: ComponentPropsWithoutRef<'ol'>) {
    return <ol className="text-gray-200 my-5 ml-6 list-decimal space-y-2" style={{ fontSize: '1.0625rem', lineHeight: 1.7 }} {...rest}>{children}</ol>;
  },

  blockquote({ children, ...rest }: ComponentPropsWithoutRef<'blockquote'>) {
    return (
      <blockquote
        className="border-l-4 border-[#39FF14]/60 pl-4 my-6 text-gray-300 italic"
        style={{ fontSize: '1.0625rem', lineHeight: 1.75 }}
        {...rest}
      >
        {children}
      </blockquote>
    );
  },

  // Inline code (not fenced) — fenced code is handled by rehype-pretty-code
  // via the <pre><code> output, which we let pass through unstyled here.
  code({ children, className, ...rest }: ComponentPropsWithoutRef<'code'>) {
    // rehype-pretty-code adds `language-*` class — let it through untouched.
    if (className?.includes('language-')) {
      return <code className={className} {...rest}>{children}</code>;
    }
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-[#1f0e10] text-[#f4a78a] border border-[#3a2024]"
        style={{ fontSize: '0.95em' }}
        {...rest}
      >
        {children}
      </code>
    );
  },

  hr() {
    return <hr className="border-gray-700/40 my-10" />;
  },

  strong({ children, ...rest }: ComponentPropsWithoutRef<'strong'>) {
    return <strong className="text-white font-semibold" {...rest}>{children}</strong>;
  },

  em({ children, ...rest }: ComponentPropsWithoutRef<'em'>) {
    return <em className="italic" {...rest}>{children}</em>;
  },

  table({ children, ...rest }: ComponentPropsWithoutRef<'table'>) {
    return (
      <div className="my-6 overflow-x-auto">
        <table className="w-full text-left border-collapse" {...rest}>{children}</table>
      </div>
    );
  },

  th({ children, ...rest }: ComponentPropsWithoutRef<'th'>) {
    return <th className="border-b border-gray-700 px-3 py-2 text-[#39FF14] font-semibold" {...rest}>{children}</th>;
  },

  td({ children, ...rest }: ComponentPropsWithoutRef<'td'>) {
    return <td className="border-b border-gray-800 px-3 py-2 text-gray-200" {...rest}>{children}</td>;
  },
};

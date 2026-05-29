import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CastProvider } from '@/contexts/CastContext';
import ClientAnimationProvider from '@/components/ClientAnimationProvider';
import ScrollToTop from '@/components/ScrollToTop';
import KeyboardShortcutHandler from '@/components/KeyboardShortcutHandler';
import MediaPanel from '@/components/MediaPanel';
import ClientScript from '@/components/ClientScript';
import Navigation from '@/components/Navigation';
import StarfieldBackground from '@/components/StarfieldBackground';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://walter.pollardjr.com'),
  title: 'Walter S. Pollard Jr. | Senior Software Engineer',
  description: 'Senior software engineer specializing in JavaScript, streaming video technologies, and modern web development. View my portfolio and projects.',
  keywords: 'senior software engineer, senior web developer, javascript, typescript, streaming video, web development, portfolio',
  authors: [{ name: 'Walter S. Pollard Jr.' }],
  openGraph: {
    title: 'Walter S. Pollard Jr. | Senior Software Engineer',
    description: 'Senior software engineer specializing in JavaScript and streaming video technologies.',
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'walter.pollardjr.com',
    // images intentionally omitted — Next.js auto-populates from
    // app/opengraph-image.tsx via the file-based metadata convention.
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Walter S. Pollard Jr. | Senior Software Engineer',
    description: 'Senior software engineer specializing in JavaScript and streaming video technologies.',
    // images intentionally omitted — Twitter falls back to og:image when
    // twitter:image isn't set, so the same generated PNG serves both.
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};

export const viewport = {
  width: 'device-width, initial-scale=1',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth scroll-pt-20">
      <head>
        <script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
      </head>
      <body className={`${inter.className} antialiased`}>
        <noscript>
          <div style={{
            padding: '2rem',
            maxWidth: '40rem',
            margin: '4rem auto',
            color: '#e5e5e5',
            backgroundColor: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(57,255,20,0.3)',
            borderRadius: '0.5rem',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.6,
          }}>
            <h1 style={{ color: '#39FF14', marginBottom: '1rem' }}>
              Walter S. Pollard Jr.
            </h1>
            <p style={{ marginBottom: '1rem' }}>
              Senior Software Engineer with 25+ years building for the web,
              13 years at Comcast on the Xfinity Stream video player. This
              portfolio uses JavaScript for its interactive features.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              For a static view of my background:
              <br />
              <a href="/resume/WalterSPollardJrResume.pdf" style={{ color: '#39FF14', textDecoration: 'underline' }}>
                Download Resume (PDF)
              </a>
            </p>
            <p>
              Or contact me directly:{' '}
              <a href="mailto:walter@pollardjr.com" style={{ color: '#39FF14', textDecoration: 'underline' }}>
                walter@pollardjr.com
              </a>
            </p>
          </div>
        </noscript>
        <ClientScript />
        <ScrollToTop />
        <ClientAnimationProvider>
          <CastProvider>
            <KeyboardShortcutHandler />
            <StarfieldBackground />
            <Navigation />
            <div className="portfolio-bg">
              {children}
            </div>
            <MediaPanel />
          </CastProvider>
        </ClientAnimationProvider>
      </body>
    </html>
  );
}

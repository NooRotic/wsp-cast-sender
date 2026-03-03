import './globals.css';
import type { Metadata } from 'next';
import { CastProvider } from '@/contexts/CastContext';
import ClientAnimationProvider from '@/components/ClientAnimationProvider';
import ScrollToTop from '@/components/ScrollToTop';
import ResumeDownloadButton from '@/components/ResumeDownloadButton';
import KeyboardShortcutHandler from '@/components/KeyboardShortcutHandler';
import MediaPanel from '@/components/MediaPanel';
import ClientScript from '@/components/ClientScript';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://walter.pollardjr.com'),
  title: 'Walter S. Pollard Jr | JavaScript & Streaming Video Expert',
  description: 'Experienced senior software engineer specializing in JavaScript, streaming video technologies, and modern web development. View my portfolio and projects.',
  keywords: 'senior software engineer, senior web developer, javascript, typescript, streaming video, web development, portfolio',
  authors: [{ name: 'Walter S. Pollard Jr' }],
  openGraph: {
    title: 'Walter S. Pollard Jr - Senior Video Software Engineer Portfolio',
    description: 'Experienced senior software engineer specializing in JavaScript and streaming video technologies.',
    type: 'website',
    locale: 'en_US',
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
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
      </head>
      <body className="antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
        <ClientScript />
        <ScrollToTop />
        <ClientAnimationProvider>
          <CastProvider>
            <KeyboardShortcutHandler />
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
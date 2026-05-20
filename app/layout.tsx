import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CastProvider } from '@/contexts/CastContext';
import ClientAnimationProvider from '@/components/ClientAnimationProvider';
import ScrollToTop from '@/components/ScrollToTop';
import KeyboardShortcutHandler from '@/components/KeyboardShortcutHandler';
import MediaPanel from '@/components/MediaPanel';
import ClientScript from '@/components/ClientScript';

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
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'Walter S. Pollard Jr. — Senior Software Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Walter S. Pollard Jr. | Senior Software Engineer',
    description: 'Senior software engineer specializing in JavaScript and streaming video technologies.',
    images: ['/og/default.png'],
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
        <script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
      </head>
      <body className={`${inter.className} antialiased`}>
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

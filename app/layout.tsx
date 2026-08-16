import '../src/index.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import { header, body, display } from './font';

const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE ?? "外贸跨境电商独立站";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export const metadata = {
  title: siteTitle,
  description: 'E-commerce shop demo',
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml'
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png'
      },
      {
        url: '/favicon.ico',
        type: 'image/x-icon'
      }
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      translate="no"
      className={`notranslate ${header.variable} ${body.variable} ${display.variable}`}
      style={{
      backgroundColor: '#fff',
      color: 'rgba(0, 0, 0, 0.85)'
    }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '!function(){try{var w=Math.min(screen.width||9999,innerWidth||9999,(visualViewport&&visualViewport.width)||9999);document.documentElement.classList.toggle("is-narrow",w<768);}catch(e){}}();',
          }}
        />
        {/* alicdn/1688 returns 403 when Referer is our domain — required for overseas image load */}
        <meta name="referrer" content="no-referrer" />
        {/* Self-hosted Outfit (see app/(frontend)/theme-style.css @font-face) — no Google Fonts runtime */}
        <link
          rel="preload"
          href="/fonts/outfit/outfit-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className={`${body.className} antialiased`}>
        <Providers>
          <Toaster position="top-center" richColors offset="100px" />
          {/* Null fallback avoids a blank stuck "Loading..." paint if streaming stalls */}
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}

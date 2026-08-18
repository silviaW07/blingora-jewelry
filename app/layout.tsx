import '../src/index.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';
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
      suppressHydrationWarning
      className={`notranslate ${header.variable} ${body.variable} ${display.variable}`}
      style={{
      backgroundColor: '#fff',
      color: 'rgba(0, 0, 0, 0.85)'
    }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '!function(){try{var d=document.documentElement;function cssW(){var sw=screen.width||0,sh=screen.height||0,dpr=window.devicePixelRatio||1;var short=Math.min(sw,sh)||sw;if(short>540&&dpr>1)short=Math.round(short/dpr);if(short>=280&&short<=540)return short;if(dpr>1){var a=Math.round((Math.min(sw,sh)||sw)/dpr);if(a>=280&&a<=540)return a;}return short;}function isPhone(){var w=cssW();if(w>=280&&w<=540)return true;return !!(window.matchMedia&&window.matchMedia("(max-device-width: 512px)").matches);}function apply(){var n=isPhone()||(window.innerWidth||0)<1024;d.classList.toggle("is-narrow",n);if(n){d.style.overflowX="hidden";d.style.maxWidth="100%";d.style.width="100%";d.style.webkitTextSizeAdjust="100%";}}apply();window.addEventListener("resize",apply);function onEvt(e){var t=e.target;if(!t||!t.closest)return;if(t.closest("button,[data-no-hard-nav],input,select,textarea,label"))return;var a=t.closest("a[data-hard-nav]");if(!a||!a.href||!window.__storefrontNav)return;e.preventDefault();e.stopImmediatePropagation();window.__storefrontNav(a.href);}document.addEventListener("click",onEvt,true);}catch(e){}}();',
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
          {children}
        </Providers>
      </body>
    </html>
  );
}

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
              '!function(){try{var d=document.documentElement,h=document.head||d;var m=document.querySelector(\'meta[name="viewport"]\');if(!m){m=document.createElement("meta");m.setAttribute("name","viewport");h.insertBefore(m,h.firstChild);}m.setAttribute("content","width=device-width,initial-scale=1,viewport-fit=cover");function apply(){var n=!!(window.matchMedia&&window.matchMedia("(max-width: 1023px)").matches||(window.innerWidth||9999)<1024);d.classList.toggle("is-narrow",n);if(n){d.style.overflowX="hidden";d.style.maxWidth="100%";}else{d.style.removeProperty("overflow-x");d.style.removeProperty("max-width");}}apply();window.addEventListener("resize",apply);window.visualViewport&&window.visualViewport.addEventListener("resize",apply);var last={h:"",t:0};function go(a,e){if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;if(typeof e.button==="number"&&e.button>0)return;var href=a.href;if(!href)return;var now=Date.now();if(last.h===href&&now-last.t<500){e.preventDefault();e.stopImmediatePropagation();return;}last={h:href,t:now};e.preventDefault();e.stopImmediatePropagation();location.assign(href);}function onEvt(e){var t=e.target;if(!t||!t.closest)return;var a=t.closest("a[data-hard-nav]");if(!a)return;go(a,e);}document.addEventListener("click",onEvt,true);document.addEventListener("pointerup",onEvt,true);}catch(e){}}();',
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

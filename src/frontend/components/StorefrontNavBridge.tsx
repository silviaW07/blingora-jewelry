'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { notifyStorefrontUrl } from '@/frontend/utils/hardNavigate'
import { lockStorefrontViewport } from '@/frontend/utils/isNarrowViewport'

function toAppPath(href: string): string | null {
  try {
    const url = new URL(href, window.location.origin)
    if (url.origin !== window.location.origin) return null
    return `${url.pathname}${url.search}${url.hash}` || '/'
  } catch {
    return href || '/'
  }
}

function samePath(a: string, b: string) {
  const na = a.replace(/\/+$/, '') || '/'
  const nb = b.replace(/\/+$/, '') || '/'
  return na === nb
}

/**
 * Same-origin tab/page switches use the App Router (keeps bottom nav mounted).
 * Full `location.assign` reloads made Chrome Android feel much slower than other browsers.
 */
export function StorefrontNavBridge() {
  const router = useRouter()

  useEffect(() => {
    lockStorefrontViewport()
    const nav = (href: string) => {
      const next = toAppPath(href)
      if (!next) {
        window.location.assign(href)
        return
      }
      const cur = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/'
      if (samePath(cur, next) && window.location.search === new URL(next, window.location.origin).search) {
        return
      }
      router.push(next)
      notifyStorefrontUrl()
      window.setTimeout(notifyStorefrontUrl, 0)
    }

    window.__storefrontNav = nav
    const later = window.setTimeout(() => {
      ;['/', '/categories/', '/cart/', '/account/profile/', '/checkout/'].forEach((href) => {
        try {
          router.prefetch(href)
        } catch {
          /* ignore */
        }
      })
    }, 1200)

    const relock = () => lockStorefrontViewport()
    window.addEventListener('pageshow', relock)
    window.addEventListener('orientationchange', relock)

    return () => {
      window.clearTimeout(later)
      window.removeEventListener('pageshow', relock)
      window.removeEventListener('orientationchange', relock)
      if (window.__storefrontNav === nav) delete window.__storefrontNav
    }
  }, [router])

  const pathname = usePathname()
  useEffect(() => {
    notifyStorefrontUrl()
  }, [pathname])

  return null
}

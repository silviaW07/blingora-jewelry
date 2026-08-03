/** Alicdn/1688 image helpers: same-origin proxy + size suffix for overseas speed. */

const ALICDN_HOSTS = new Set([
  'cbu01.alicdn.com',
  'cbu02.alicdn.com',
  'gw.alicdn.com',
  'img.alicdn.com',
])

/** Already has `_400x400q80.jpg` (or similar) size suffix */
const HAS_SIZE_SUFFIX = /_\d+x\d+q?\d*\.(jpe?g|png|webp)$/i

/**
 * Append Taobao/1688 CDN resize suffix before proxying.
 * Full ~280KB JPEG → `_400x400q80.jpg` ~25KB (verified via img-proxy).
 */
export function withAlicdnSize(url: string, width = 800, quality = 80): string {
  const raw = String(url || '').trim()
  if (!raw || width <= 0) return raw
  if (HAS_SIZE_SUFFIX.test(raw.split('?')[0] || '')) return raw

  const [pathPart, query = ''] = raw.split('?')
  const q = query ? `?${query}` : ''

  // /img-proxy/cbu01/...jpg  or absolute alicdn ...jpg
  if (/\.(jpe?g|png|webp)$/i.test(pathPart)) {
    return `${pathPart}_${width}x${width}q${quality}.jpg${q}`
  }
  return raw
}

function proxyPathForHost(host: string, pathname: string, search: string): string | null {
  if (host === 'cbu01.alicdn.com') return `/img-proxy/cbu01${pathname}${search}`
  if (host === 'cbu02.alicdn.com') return `/img-proxy/cbu02${pathname}${search}`
  if (host === 'gw.alicdn.com' || host === 'img.alicdn.com') {
    return `/img-proxy/cbu01${pathname}${search}`
  }
  return null
}

export type ProxiedImageOptions = {
  /** Longest edge in px for alicdn resize (default 800). Use 220 for thumbs, 400 for cards, 960 for detail hero. */
  width?: number
  quality?: number
}

/** Optional public CDN (Cloudflare R2 custom domain), e.g. https://img.sourcingjewelry.com */
const IMAGE_CDN_BASE = String(process.env.NEXT_PUBLIC_IMAGE_CDN_BASE || '')
  .trim()
  .replace(/\/$/, '')

/**
 * Rewrite 1688 CDN URLs to same-origin nginx proxy + optional resize.
 * If NEXT_PUBLIC_IMAGE_CDN_BASE is set, prefer R2/CDN path with the same key layout as /img-proxy.
 * Cache-friendly: resized URLs are distinct cache keys.
 */
export function toProxiedImageUrl(
  url?: string | null,
  options: ProxiedImageOptions = {},
): string {
  const raw = String(url || '').trim()
  if (!raw) return ''

  const width = options.width ?? 800
  const quality = options.quality ?? 80

  // Already on our CDN — apply size suffix if missing
  if (IMAGE_CDN_BASE && raw.startsWith(IMAGE_CDN_BASE)) {
    return withAlicdnSize(raw, width, quality)
  }

  // Already proxied — still apply size if missing
  if (raw.startsWith('/img-proxy/')) {
    const sized = withAlicdnSize(raw, width, quality)
    if (IMAGE_CDN_BASE) {
      // /img-proxy/cbu01/foo.jpg → https://img.../cbu01/foo.jpg
      return `${IMAGE_CDN_BASE}${sized.replace(/^\/img-proxy/, '')}`
    }
    return sized
  }

  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'https://sourcingjewelry.com'
    const u = new URL(raw, base)
    const host = u.hostname.toLowerCase()

    if (ALICDN_HOSTS.has(host) || host.endsWith('.alicdn.com')) {
      const sizedPath = withAlicdnSize(`${u.pathname}${u.search}`, width, quality)
      const sizedUrl = new URL(sizedPath, `https://${host}`)
      const mappedHost =
        host === 'cbu02.alicdn.com' || host.includes('cbu02') ? 'cbu02' : 'cbu01'
      const keyPath = `/${mappedHost}${sizedUrl.pathname}${sizedUrl.search}`

      if (IMAGE_CDN_BASE) {
        return `${IMAGE_CDN_BASE}${keyPath}`
      }

      const proxied = proxyPathForHost(
        mappedHost === 'cbu02' ? 'cbu02.alicdn.com' : 'cbu01.alicdn.com',
        sizedUrl.pathname,
        sizedUrl.search,
      )
      if (proxied) return proxied
      return `/img-proxy/${mappedHost}${sizedUrl.pathname}${sizedUrl.search}`
    }

    return raw
  } catch {
    return raw
  }
}

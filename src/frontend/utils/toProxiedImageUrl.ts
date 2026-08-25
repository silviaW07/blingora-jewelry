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
 * Remove alicdn resize suffix so thumbs can request a smaller size
 * (`foo.jpg_960x960q80.jpg` → `foo.jpg`).
 */
export function stripAlicdnSize(url: string): string {
  const raw = String(url || '').trim()
  if (!raw) return raw
  const [pathPart, query = ''] = raw.split('?')
  if (!HAS_SIZE_SUFFIX.test(pathPart)) return raw
  const stripped = pathPart.replace(/_\d+x\d+q?\d*\.(jpe?g|png|webp)$/i, '')
  return query ? `${stripped}?${query}` : stripped
}

/**
 * Append Taobao/1688 CDN resize suffix before proxying.
 * Full ~280KB JPEG → `_400x400q80.jpg` ~25KB (verified via img-proxy).
 * Always rewrites an existing size suffix to the requested width.
 */
export function withAlicdnSize(url: string, width = 1200, quality = 90): string {
  const raw = String(url || '').trim()
  if (!raw) return raw
  // width <= 0 → unsized original (used by image error retry)
  if (width <= 0) return stripAlicdnSize(raw)

  const base = stripAlicdnSize(raw)
  const [pathPart, query = ''] = base.split('?')
  const q = query ? `?${query}` : ''

  // /img-proxy/cbu01/...jpg  or absolute alicdn ...jpg
  if (/\.(jpe?g|png|webp)$/i.test(pathPart)) {
    return `${pathPart}_${width}x${width}q${quality}.jpg${q}`
  }
  return base
}

/**
 * Aliyun OSS process: full ~200–800KB → list thumbs stay small.
 * Default w_640–720 + q_85 + light sharpen reads sharper on 2x screens
 * without pulling full originals.
 */
export function withOssProcess(url: string, width = 720, quality = 85): string {
  const raw = String(url || '').trim()
  if (!raw) return raw
  try {
    const u = new URL(raw)
    if (width <= 0) {
      u.searchParams.delete('x-oss-process')
      return u.toString()
    }
    const q = Math.min(95, Math.max(40, Math.round(quality)))
    const w = Math.min(2000, Math.max(80, Math.round(width)))
    // Mild sharpen after resize — helps soft list thumbs on retina without big bytes.
    u.searchParams.set(
      'x-oss-process',
      `image/resize,m_lfit,w_${w}/quality,q_${q}/sharpen,80`,
    )
    return u.toString()
  } catch {
    return raw
  }
}

function isAliyunOssHost(host: string): boolean {
  const h = host.toLowerCase()
  return h.endsWith('.aliyuncs.com') || h === 'aliyuncs.com'
}

/**
 * Normalize absolute same-origin proxy URLs
 * (`https://sourcingjewelry.com/img-proxy/...`) to a relative `/img-proxy/...`
 * so size suffixes + optimizer bypass still apply after nginx JSON rewrite.
 */
export function toRelativeImgProxyPath(url: string): string | null {
  const raw = String(url || '').trim()
  if (!raw) return null
  if (raw.startsWith('/img-proxy/')) return raw
  try {
    const parsed = new URL(raw)
    if (parsed.pathname.startsWith('/img-proxy/')) {
      return `${parsed.pathname}${parsed.search}`
    }
  } catch {
    // ignore
  }
  return null
}

function proxyPathForHost(host: string, pathname: string, search: string): string | null {
  if (host === 'cbu01.alicdn.com') return `/img-proxy/cbu01${pathname}${search}`
  if (host === 'cbu02.alicdn.com') return `/img-proxy/cbu02${pathname}${search}`
  // Must match deploy/nginx/sourcingjewelry.com.conf location /img-proxy/gw/
  if (host === 'gw.alicdn.com') return `/img-proxy/gw${pathname}${search}`
  // img.alicdn.com / sc*.alicdn.com are different buckets — do NOT remap onto cbu01 (404s).
  return null
}

export type ProxiedImageOptions = {
  /** Longest edge in px for alicdn/OSS resize. Use 240 for thumbs, 400–640 for cards, 1200 for detail. */
  width?: number
  quality?: number
}

/** Optional public CDN (Cloudflare R2 custom domain), e.g. https://img.sourcingjewelry.com */
const IMAGE_CDN_BASE = String(process.env.NEXT_PUBLIC_IMAGE_CDN_BASE || '')
  .trim()
  .replace(/\/$/, '')

/**
 * Rewrite 1688 CDN URLs to same-origin nginx proxy + optional resize.
 * Aliyun OSS (hspi.oss-*) gets x-oss-process resize (most product images).
 * If NEXT_PUBLIC_IMAGE_CDN_BASE is set, prefer R2/CDN path with the same key layout as /img-proxy.
 */
export function toProxiedImageUrl(
  url?: string | null,
  options: ProxiedImageOptions = {},
): string {
  const raw = String(url || '').trim()
  if (!raw) return ''

  const width = options.width ?? 1200
  const quality = options.quality ?? 90

  // Already on our CDN — apply size suffix if missing
  if (IMAGE_CDN_BASE && raw.startsWith(IMAGE_CDN_BASE)) {
    return withAlicdnSize(raw, width, quality)
  }

  // Relative or absolute same-origin /img-proxy — still apply size if missing
  const relativeProxy = toRelativeImgProxyPath(raw)
  if (relativeProxy) {
    const sized = withAlicdnSize(relativeProxy, width, quality)
    if (IMAGE_CDN_BASE) {
      return `${IMAGE_CDN_BASE}${sized.replace(/^\/img-proxy/, '')}`
    }
    return sized
  }

  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'https://sourcingjewelry.com'
    const u = new URL(raw, base)
    const host = u.hostname.toLowerCase()

    // Old-shop / table-import images live on OSS US-West — must resize or list pages pull full JPEGs.
    if (isAliyunOssHost(host)) {
      return withOssProcess(u.toString(), width, Math.min(quality, 85))
    }

    if (ALICDN_HOSTS.has(host) || host.endsWith('.alicdn.com')) {
      const sizedPath = withAlicdnSize(`${u.pathname}${u.search}`, width, quality)
      const sizedUrl = new URL(sizedPath, `https://${host}`)

      const proxied = proxyPathForHost(host, sizedUrl.pathname, sizedUrl.search)
      if (proxied) {
        if (IMAGE_CDN_BASE) {
          return `${IMAGE_CDN_BASE}${proxied.replace(/^\/img-proxy/, '')}`
        }
        return proxied
      }

      // Unknown *.alicdn.com (img/sc01/…) — keep host, only apply size suffix.
      // Wrongly routing these through /img-proxy/cbu01 causes blank admin thumbs.
      return sizedUrl.toString()
    }

    return raw
  } catch {
    return raw
  }
}

/** Normalize image URLs so proxy / CDN variants still match the same asset. */
export function imageIdentity(url?: string | null): string {
  const raw = String(url || '').trim()
  if (!raw) return ''
  return raw
    .split('#')[0]
    .split('?')[0]
    .replace(/\/+$/, '')
    .toLowerCase()
}

export function imageUrlsMatch(a?: string | null, b?: string | null): boolean {
  const left = imageIdentity(a)
  const right = imageIdentity(b)
  if (!left || !right) return false
  if (left === right) return true
  const basename = (value: string) => value.split('/').pop() || value
  return basename(left) === basename(right)
}

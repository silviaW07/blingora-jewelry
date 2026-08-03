/** Rewrite 1688 CDN URLs to same-origin nginx proxy (cache + bypass Referer ACL). */
export function toProxiedImageUrl(url?: string | null): string {
  const raw = String(url || '').trim()
  if (!raw) return ''
  if (raw.startsWith('/img-proxy/')) return raw
  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'https://sourcingjewelry.com'
    const u = new URL(raw, base)
    const host = u.hostname.toLowerCase()
    if (host === 'cbu01.alicdn.com') return `/img-proxy/cbu01${u.pathname}${u.search}`
    if (host === 'cbu02.alicdn.com') return `/img-proxy/cbu02${u.pathname}${u.search}`
    if (host === 'gw.alicdn.com' || host === 'img.alicdn.com') {
      return `/img-proxy/cbu01${u.pathname}${u.search}`
    }
    return raw
  } catch {
    return raw
  }
}

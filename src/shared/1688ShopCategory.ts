/**
 * 1688 店铺分类页（offerlist）识别与 offerId 抽取。
 * 解析时服务器用 Cookie 抓分类/分页 HTML，抽出 offer 后再走详情解析。
 */

export function is1688ShopCategoryUrl(sourceUrl?: string | null): boolean {
  const url = String(sourceUrl || '').trim()
  if (!url || !/1688\.com/i.test(url)) return false
  // 已是商品详情则不算分类页
  if (/\/offer\/\d+/i.test(url)) return false
  return (
    /\/page\/offerlist/i.test(url) ||
    /offerlist_[\d_]+/i.test(url) ||
    /\/page\/offerlist\.htm/i.test(url)
  )
}

export function extract1688OfferIdsFromHtml(html: string): string[] {
  const text = String(html || '')
  if (!text) return []
  const ids = new Set<string>()
  const patterns = [
    /\/offer\/(\d{8,})(?:\.html)?/gi,
    /["']offerId["']\s*[:=]\s*["']?(\d{8,})/gi,
    /offerId(?:=|%3D)(\d{8,})/gi,
    /\boffer_id["']?\s*[:=]\s*["']?(\d{8,})/gi,
    /data-offer[-_]?id=["']?(\d{8,})/gi,
    /"(?:id|offerId)"\s*:\s*"(\d{10,14})"/gi,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const id = match[1]
      if (id) ids.add(id)
    }
  }
  return Array.from(ids)
}

/** 店铺 memberId：页面 JSON，或 shopXXXX.1688.com 主机名。 */
export function extract1688ShopMemberId(sourceUrl: string, html = ''): string | null {
  const text = String(html || '')
  const fromHtml =
    text.match(/["'](?:seller)?MemberId["']\s*[:=]\s*["']([^"']+)["']/i)?.[1] ||
    text.match(/[?&]memberId=([^&"'#]+)/i)?.[1]
  if (fromHtml) return fromHtml.trim()
  try {
    const host = new URL(String(sourceUrl || '').trim()).hostname
    const shopMatch = host.match(/^shop([a-z0-9]+)\.1688\.com$/i)
    if (shopMatch?.[1]) return shopMatch[1]
  } catch {
    // ignore invalid URL
  }
  return null
}

export function to1688OfferDetailUrl(offerId: string): string {
  const id = String(offerId || '').replace(/\D/g, '')
  return `https://detail.1688.com/offer/${id}.html`
}

export function offerIdsTo1688DetailUrls(offerIds: string[]): string[] {
  const seen = new Set<string>()
  const urls: string[] = []
  for (const id of offerIds) {
    const normalized = String(id || '').replace(/\D/g, '')
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    urls.push(to1688OfferDetailUrl(normalized))
  }
  return urls
}

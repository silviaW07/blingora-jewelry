const WEISHANG_PAGE_HOST =
  /(^|\.)(szwego|wegooooo|wsxcme)\.com$/i

const WEISHANG_IMAGE_HOST =
  /(^|\.)((xc)?img\.szwego|szwego|wegooooo|wsxcme|qpic|qlogo|photo\.yupoo)\.com$/i

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|bmp|avif)(\?|#|$)/i
const SHOP_ID_RE = /A\d{10,}/i
const ALBUM_ID_RE = /(?:^|[/_-])(_[A-Za-z0-9_-]{12,}|I\d{10,})/
const ITEM_QUERY_KEYS = ['itemId', 'item_id', 'goodsId', 'goods_id', 'sourceId']

export type WeishangAlbumRef = {
  shopId: string | null
  albumId: string | null
  itemId: string | null
  tagId: string | null
  shareCode: string | null
}

export function isWeishangAlbumPageUrl(url?: string | null): boolean {
  const text = String(url || '').trim()
  if (!/^https?:\/\//i.test(text)) return false
  try {
    const parsed = new URL(text)
    if (!WEISHANG_PAGE_HOST.test(parsed.hostname)) return false
    if (IMAGE_EXT_RE.test(parsed.pathname)) return false
    return true
  } catch {
    return false
  }
}

export function isLikelyRemoteImageUrl(url?: string | null): boolean {
  const text = String(url || '').trim()
  if (!/^https?:\/\//i.test(text)) return false
  try {
    const parsed = new URL(text)
    if (IMAGE_EXT_RE.test(parsed.pathname) || IMAGE_EXT_RE.test(parsed.search)) return true
    return WEISHANG_IMAGE_HOST.test(parsed.hostname)
  } catch {
    return false
  }
}

/** Pull http(s) image URLs out of a pasted album page, chat log, or Excel cell. */
export function extractImageUrlsFromText(text: string): string[] {
  const matches = String(text || '').match(/https?:\/\/[^\s"'<>\\]+/gi) || []
  const seen = new Set<string>()
  const urls: string[] = []
  for (const raw of matches) {
    const cleaned = raw.replace(/[),.;]+$/g, '')
    if (isWeishangAlbumPageUrl(cleaned)) continue
    if (!isLikelyRemoteImageUrl(cleaned)) continue
    if (seen.has(cleaned)) continue
    seen.add(cleaned)
    urls.push(cleaned)
  }
  return urls
}

function firstParam(params: URLSearchParams, keys: string[]): string | null {
  for (const key of keys) {
    const value = String(params.get(key) || '').trim()
    if (value) return value
  }
  return null
}

function shopIdFromHost(hostname: string): string | null {
  const matched = hostname.match(/^([a-z0-9]+)\.(szwego|wegooooo|wsxcme)\.com$/i)
  if (!matched?.[1]) return null
  if (matched[1].toLowerCase() === 'www' || matched[1].toLowerCase() === 'static') return null
  return matched[1].toUpperCase().startsWith('A') ? matched[1].toUpperCase() : matched[1]
}

function parseHashParts(hash: string): { path: string; params: URLSearchParams } {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const [pathPart, queryPart] = raw.split('?')
  return {
    path: pathPart || '',
    params: new URLSearchParams(queryPart || ''),
  }
}

export function parseWeishangAlbumRef(sourceUrl?: string | null): WeishangAlbumRef {
  const empty: WeishangAlbumRef = {
    shopId: null,
    albumId: null,
    itemId: null,
    tagId: null,
    shareCode: null,
  }
  const text = String(sourceUrl || '').trim()
  if (!text) return empty
  try {
    const url = new URL(text)
    const hash = parseHashParts(url.hash)
    const query = url.searchParams
    const shopId =
      firstParam(query, ['shop_id', 'shopId']) ||
      firstParam(hash.params, ['shop_id', 'shopId']) ||
      hash.path.match(/\/shop_detail\/([^/?#]+)/i)?.[1] ||
      shopIdFromHost(url.hostname) ||
      null
    const albumId =
      firstParam(query, ['albumId', 'album_id']) ||
      firstParam(hash.params, ['albumId', 'album_id']) ||
      hash.path.match(/\/(?:theme_detail|album|goods_list)\/([^/?#]+)/i)?.[1] ||
      null
    const themeItem = hash.path.match(/\/theme_detail\/[^/?#]+\/([^/?#]+)/i)?.[1] || null
    const itemId =
      firstParam(query, ITEM_QUERY_KEYS) ||
      firstParam(hash.params, ITEM_QUERY_KEYS) ||
      themeItem ||
      hash.path.match(/\/item_detail\/([^/?#]+)/i)?.[1] ||
      null
    const shareCode = url.pathname.match(/\/s\/([^/?#]+)/i)?.[1] || null
    return {
      shopId: shopId ? decodeURIComponent(shopId) : null,
      albumId: albumId ? decodeURIComponent(albumId) : null,
      itemId: itemId ? decodeURIComponent(itemId) : shareCode,
      tagId: firstParam(query, ['tagId', 'tag_id']) || firstParam(hash.params, ['tagId', 'tag_id']),
      shareCode,
    }
  } catch {
    const shopId = text.match(SHOP_ID_RE)?.[0] || null
    const albumId = text.match(ALBUM_ID_RE)?.[1] || null
    return { ...empty, shopId, albumId }
  }
}

export function isWeishangItemUrl(sourceUrl?: string | null): boolean {
  if (!isWeishangAlbumPageUrl(sourceUrl)) return false
  return Boolean(parseWeishangAlbumRef(sourceUrl).itemId)
}

/** 店铺/相册/分组列表：一条链接对应多条动态，解析时再拆开。 */
export function isWeishangFeedUrl(sourceUrl?: string | null): boolean {
  if (!isWeishangAlbumPageUrl(sourceUrl)) return false
  const ref = parseWeishangAlbumRef(sourceUrl)
  if (ref.itemId) return false
  const text = String(sourceUrl || '')
  if (ref.shopId || ref.albumId || ref.tagId) return true
  return /#\/(shop_detail|goods_list|album|theme_detail)\b/i.test(text)
}

export function buildWeishangItemSourceUrl(ref: WeishangAlbumRef): string | null {
  if (ref.itemId && (ref.albumId || ref.shopId)) {
    const parent = encodeURIComponent(ref.albumId || ref.shopId || '')
    return `https://www.szwego.com/static/index.html#/theme_detail/${parent}/${encodeURIComponent(ref.itemId)}`
  }
  if (ref.itemId) {
    return `https://www.szwego.com/static/index.html#/item_detail?itemId=${encodeURIComponent(ref.itemId)}`
  }
  if (ref.albumId) {
    return `https://www.szwego.com/static/index.html#/theme_detail/${encodeURIComponent(ref.albumId)}`
  }
  if (ref.shopId) {
    return `https://www.szwego.com/static/index.html#/shop_detail/${encodeURIComponent(ref.shopId)}`
  }
  return null
}

export function weishangDedupeKey(sourceUrl?: string | null): string | null {
  if (!isWeishangAlbumPageUrl(sourceUrl)) return null
  const ref = parseWeishangAlbumRef(sourceUrl)
  if (ref.itemId) return `weishang:${ref.itemId}`
  return null
}

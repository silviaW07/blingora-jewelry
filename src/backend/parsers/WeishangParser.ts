import { extractAlbumTitlePrice } from '@/shared/albumTitlePrice'
import {
  buildWeishangItemSourceUrl,
  extractImageUrlsFromText,
  isLikelyRemoteImageUrl,
  isWeishangAlbumPageUrl,
  isWeishangFeedUrl,
  parseWeishangAlbumRef,
  type WeishangAlbumRef,
} from '@/shared/weishangAlbum'

export type WeishangAlbumPreview = {
  itemId: string | null
  albumId: string | null
  shopId: string | null
  name: string
  priceMin: number | null
  mainImageUrl: string | null
  detailImages: string[]
  supplierName: string | null
  productDetail: string
}

export type FetchWeishangResult = {
  preview: WeishangAlbumPreview
  outcome: 'success' | 'failed'
  failureReason?: string
}

const MAX_IMAGES = 40
const MAX_FEED_ITEMS = 80
const MAX_FEED_PAGES = 6
/** 带 itemIds 的相册接口通常第一页就能命中；翻太多页会让整批解析看起来“没反应” */
const MAX_ITEM_SEEK_PAGES = 4
const WEISHANG_FETCH_TIMEOUT_MS = 12_000

const emptyPreview = (ref: WeishangAlbumRef): WeishangAlbumPreview => ({
  itemId: ref.itemId,
  albumId: ref.albumId,
  shopId: ref.shopId,
  name: '',
  priceMin: null,
  mainImageUrl: null,
  detailImages: [],
  supplierName: null,
  productDetail: '',
})

const decodeHtml = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim()

const readCookieFromDisk = (): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const candidates: string[] = []
    if (process.env.COOKIE_SZWEGO_FILE) candidates.push(process.env.COOKIE_SZWEGO_FILE)
    candidates.push('/home/admin/my-website/blingora-jewelry/secrets/szwego-cookie.txt')
    let dir = process.cwd()
    for (let i = 0; i < 6; i += 1) {
      candidates.push(path.join(dir, 'secrets', 'szwego-cookie.txt'))
      candidates.push(path.join(dir, '.szwego-cookie'))
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
    const seen = new Set<string>()
    for (const file of candidates) {
      if (!file || seen.has(file)) continue
      seen.add(file)
      if (!fs.existsSync(file)) continue
      const text = String(fs.readFileSync(file, 'utf8') || '')
        .replace(/^Cookie:\s*/i, '')
        .trim()
      if (text) return text
    }
  } catch {
    // optional cookie file
  }
  return ''
}

export function resolveWeishangCookie(): string {
  return (
    (
      process.env.COOKIE_SZWEGO ||
      process.env.COOKIE_WEISHANG ||
      process.env.COOKIE_WEGO ||
      ''
    ).replace(/^Cookie:\s*/i, '').trim() || readCookieFromDisk()
  )
}

export function persistWeishangCookie(raw?: string | null): boolean {
  const text = String(raw || '')
    .replace(/^Cookie:\s*/i, '')
    .trim()
  if (!text) return false
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path')
  const dests = [
    '/home/admin/my-website/blingora-jewelry/secrets/szwego-cookie.txt',
    path.join(process.cwd(), 'secrets', 'szwego-cookie.txt'),
  ]
  const seen = new Set<string>()
  let wrote = false
  for (const dest of dests) {
    if (!dest || seen.has(dest)) continue
    seen.add(dest)
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, text, 'utf8')
      wrote = true
    } catch {
      // try the next path
    }
  }
  if (wrote) process.env.COOKIE_SZWEGO = text
  return wrote
}

export function weishangLoginHint(hasCookie = Boolean(resolveWeishangCookie())): string {
  return hasCookie
    ? '微购登录已过期。请更新 secrets/szwego-cookie.txt 或环境变量 COOKIE_SZWEGO 后重启 rpc 再解析'
    : '微购/微商相册需要登录。请在电脑打开 www.szwego.com 扫码登录，把浏览器完整 Cookie 保存到 secrets/szwego-cookie.txt（或 COOKIE_SZWEGO），重启 rpc 后再粘贴相册链接解析'
}

function looksLikeLoginError(text: string): boolean {
  return /errcode["']?\s*[:=]\s*9|登录已过期|请重新登录|请先登录|未登录|login expired/i.test(text)
}

function payloadErrorCode(payload: unknown): number | null {
  const root = asRecord(payload)
  if (!root || root.errcode == null || root.errcode === '') return null
  const code = Number(root.errcode)
  return Number.isFinite(code) ? code : null
}

function normalizeImageUrl(raw: string): string | null {
  const text = decodeHtml(String(raw || '').trim())
    .replace(/\\u002F/g, '/')
    .replace(/\?(?:imageMogr2|imageView2)\/[^#]*/i, '')
  if (!/^https?:\/\//i.test(text)) return null
  if (!isLikelyRemoteImageUrl(text)) return null
  try {
    const url = new URL(text)
    url.searchParams.delete('imageView2')
    url.searchParams.delete('imageMogr2')
    return url.href
  } catch {
    return text
  }
}

const SHOP_CHROME_IMAGE_KEY =
  /(?:user_icon|avatar|qrcode|mini_?code|minicode|shop_minicode|wechat_?qrcode|banner|icon_mini|poster|share.?cover)/i

function isShopChromeImageUrl(url: string): boolean {
  const lower = url.toLowerCase()
  if (/\/(?:code_|minicode_|h5_)/i.test(lower)) return true
  if (/_160(?:\?|$)/.test(lower) && /xcimg\.szwego\.com/.test(lower)) return true
  return false
}

function collectImageUrls(value: unknown, into: string[] = [], depth = 0): string[] {
  if (depth > 6 || value == null) return into
  if (typeof value === 'string') {
    const direct = normalizeImageUrl(value)
    if (direct && !isShopChromeImageUrl(direct)) {
      into.push(direct)
      return into
    }
    for (const found of extractImageUrlsFromText(value)) {
      const next = normalizeImageUrl(found)
      if (next && !isShopChromeImageUrl(next)) into.push(next)
    }
    return into
  }
  if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, into, depth + 1)
    return into
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (SHOP_CHROME_IMAGE_KEY.test(key)) continue
      if (/video/i.test(key) && !/img|image|photo|pic|icon|cover/i.test(key)) continue
      collectImageUrls(child, into, depth + 1)
    }
  }
  return into
}

function uniqueImages(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const url of urls) {
    const normalized = normalizeImageUrl(url)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
    if (out.length >= MAX_IMAGES) break
  }
  return out
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const text = decodeHtml(String(value ?? '').trim())
    if (text) return text
  }
  return ''
}

/** 微购标题常被表情/对象占位符填满；货号回退标题也不算解析成功。 */
function isUsefulWeishangTitle(text?: string | null): boolean {
  const raw = decodeHtml(String(text || '').trim())
  if (!raw) return false
  if (/^微商\s*_/i.test(raw) || /^微商相册$/i.test(raw) || /^\[微商\]/i.test(raw)) return false
  const compact = raw.replace(/[\uFFFC\u200B\uFEFF\s✔️✅✔☑️]+/g, '')
  if (compact.length < 2) return false
  if (/^(微购|微商相册|szwego|登录)$/i.test(compact)) return false
  return true
}

function productImagesFromAlbumItem(item: Record<string, unknown>): string[] {
  return uniqueImages([
    ...collectImageUrls(item.imgsSrc),
    ...collectImageUrls(item.imgs),
    ...collectImageUrls(item.goodsImgs),
    ...collectImageUrls(item.imageList),
    ...collectImageUrls(item.photos),
    ...collectImageUrls(item.images),
  ])
}

function parsePrice(...texts: Array<string | number | null | undefined>): number | null {
  for (const raw of texts) {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw
  }
  const fromTitle = extractAlbumTitlePrice(
    ...texts.map((item) => (typeof item === 'number' ? String(item) : item)),
  )
  if (fromTitle != null) return fromTitle
  for (const raw of texts) {
    const text = String(raw ?? '')
    const matched =
      text.match(/(?:P|¥|￥|价格|拿货价|成本|特价)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)/i) ||
      text.match(/\b([0-9]+(?:\.[0-9]+)?)\s*元/)
    if (!matched) continue
    const n = Number(matched[1])
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

function itemIdOf(item: Record<string, unknown>, fallback: WeishangAlbumRef): string | null {
  return (
    firstString(
      item.itemId,
      item.item_id,
      item.goodsId,
      item.goods_id,
      item.sourceId,
      item.source_id,
      item.unique_id,
      item.uniqueId,
      item.id,
    ) || fallback.itemId
  )
}

function previewFromAlbumItem(
  item: Record<string, unknown>,
  sourceUrl: string,
  fallback: WeishangAlbumRef,
): WeishangAlbumPreview {
  const shop = asRecord(item.shop) || asRecord(item.shopInfo) || {}
  const itemId = itemIdOf(item, fallback)
  const albumId =
    firstString(item.albumId, item.album_id, fallback.albumId) || fallback.albumId
  const shopId =
    firstString(item.shopId, item.shop_id, shop.shopId, shop.shop_id, fallback.shopId) ||
    fallback.shopId
  const supplierName =
    firstString(item.shopName, item.shop_name, shop.shopName, shop.name, shopId) || null
  const rawTitle = firstString(
    item.title,
    item.subTitle,
    item.goodsName,
    item.itemName,
    item.name,
    item.note,
    item.text,
  )
  const name = isUsefulWeishangTitle(rawTitle)
    ? rawTitle
    : isUsefulWeishangTitle(supplierName)
      ? String(supplierName)
      : itemId
        ? `微商 ${itemId}`
        : '微商相册'
  const note = firstString(item.note, item.text, item.desc, item.description, item.subTitle, item.title)
  const priceMin = parsePrice(
    item.itemNamePrice,
    item.optimaPrice,
    item.itemPrice,
    item.price,
    item.minPrice,
    item.goodsPrice,
    item.priceMin,
    name,
    note,
  )
  const detailImages = productImagesFromAlbumItem(item)
  return {
    itemId,
    albumId,
    shopId,
    name: name.replace(/\r/g, '').trim().slice(0, 200),
    priceMin,
    mainImageUrl: detailImages[0] || null,
    detailImages,
    supplierName,
    productDetail: [name, note, supplierName ? `微购 ${supplierName}` : '微购相册', sourceUrl]
      .filter(Boolean)
      .join('\n'),
  }
}

function albumItemsFromPayload(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload) || {}
  const result = asRecord(root.result) || asRecord(root.data) || root
  const lists = [result.items, result.list, result.goodsList, result.albumItems]
  for (const list of lists) {
    if (Array.isArray(list)) {
      return list.map((row) => asRecord(row)).filter(Boolean) as Record<string, unknown>[]
    }
  }
  const single = asRecord(result.item) || asRecord(result.goods) || asRecord(root.item)
  return single ? [single] : []
}

function pageTimestampOf(payload: unknown): string | null {
  const root = asRecord(payload) || {}
  const result = asRecord(root.result) || asRecord(root.data) || root
  const pagination = asRecord(result.pagination) || asRecord(result.page) || {}
  const cursor = firstString(
    pagination.pageTimestamp,
    pagination.timestamp,
    pagination.nextTimestamp,
    result.pageTimestamp,
  )
  const more = pagination.isLoadMore ?? pagination.hasMore ?? result.isLoadMore
  if (more === false || more === 0 || more === 'false') return null
  return cursor || null
}

function requestHeaders(cookie: string): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    Accept: 'application/json,text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    Origin: 'https://www.szwego.com',
    Referer: 'https://www.szwego.com/static/index.html',
    ...(cookie ? { Cookie: cookie } : {}),
  }
}

async function fetchText(targetUrl: string, cookie: string): Promise<{ status: number; body: string }> {
  const response = await fetch(targetUrl, {
    redirect: 'follow',
    headers: requestHeaders(cookie),
    signal: AbortSignal.timeout(WEISHANG_FETCH_TIMEOUT_MS),
  })
  return { status: response.status, body: await response.text() }
}

async function fetchJsonPost(
  targetUrl: string,
  cookie: string,
  body: unknown,
): Promise<{ status: number; payload: unknown; loginRequired: boolean; body: string }> {
  const response = await fetch(targetUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      ...requestHeaders(cookie),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(WEISHANG_FETCH_TIMEOUT_MS),
  })
  const text = await response.text()
  if (looksLikeLoginError(text)) {
    return { status: response.status, payload: null, loginRequired: true, body: text }
  }
  try {
    return { status: response.status, payload: JSON.parse(text), loginRequired: false, body: text }
  } catch {
    return { status: response.status, payload: null, loginRequired: false, body: text }
  }
}

const ITEM_MEDIA_API_URLS = [
  'https://www.szwego.com/dasbizoperate/api/v3/commodity/query/queryMediaByAlbumIdAndItemIds',
  'https://www.wegooooo.com/dasbizoperate/api/v3/commodity/query/queryMediaByAlbumIdAndItemIds',
]

function previewFromItemMedia(
  rows: unknown,
  sourceUrl: string,
  fallback: WeishangAlbumRef,
): WeishangAlbumPreview | null {
  const list = Array.isArray(rows) ? rows : []
  const wanted = String(fallback.itemId || '').toLowerCase()
  const records = list.map((row) => asRecord(row)).filter(Boolean) as Record<string, unknown>[]
  const picked =
    records.find((row) => !wanted || String(itemIdOf(row, fallback) || '').toLowerCase() === wanted) ||
    records[0] ||
    null
  if (!picked) return null

  const titles: string[] = []
  const images: string[] = []
  const sources = Array.isArray(picked.sourceList) ? picked.sourceList : []
  for (const source of sources) {
    const rec = asRecord(source)
    if (!rec) continue
    const title = firstString(rec.title, rec.subTitle, rec.note, rec.text)
    if (title) titles.push(title)
    const medias = Array.isArray(rec.medias) ? rec.medias : []
    for (const media of medias) {
      const mediaRec = asRecord(media) || {}
      const type = String(firstString(mediaRec.type, mediaRec.mediaType) || 'IMAGE').toUpperCase()
      if (type && !/^(IMAGE|IMG|PHOTO|PIC)$/.test(type)) continue
      const url = firstString(mediaRec.url, mediaRec.src, mediaRec.imageUrl, mediaRec.mediaUrl)
      if (url) images.push(url)
    }
    images.push(...collectImageUrls(rec.imgsSrc), ...collectImageUrls(rec.imgs))
  }

  const detailImages = uniqueImages(images)
  if (!detailImages.length) return null

  const rawTitle = titles.find((title) => isUsefulWeishangTitle(title)) || titles[0] || ''
  const name = isUsefulWeishangTitle(rawTitle)
    ? rawTitle
    : fallback.itemId
      ? `微商 ${fallback.itemId}`
      : '微商相册'
  const note = titles.filter((title) => title && title !== rawTitle).join('\n')
  return {
    itemId: itemIdOf(picked, fallback) || fallback.itemId,
    albumId: firstString(picked.albumId, picked.album_id, fallback.albumId) || fallback.albumId,
    shopId: firstString(picked.shopId, picked.shop_id, fallback.shopId) || fallback.shopId,
    name: name.replace(/\r/g, '').trim().slice(0, 200),
    priceMin: parsePrice(rawTitle, note, name),
    mainImageUrl: detailImages[0] || null,
    detailImages,
    supplierName: firstString(picked.shopName, picked.shop_name) || null,
    productDetail: [name, note, sourceUrl].filter(Boolean).join('\n'),
  }
}

async function fetchItemMediaPreview(
  ref: WeishangAlbumRef,
  sourceUrl: string,
  cookie: string,
): Promise<{ preview: WeishangAlbumPreview | null; loginRequired: boolean }> {
  const albumId = ref.albumId
  const itemId = ref.itemId
  if (!albumId || !itemId) return { preview: null, loginRequired: false }

  for (const url of ITEM_MEDIA_API_URLS) {
    const fetched = await fetchJsonPost(url, cookie, { albumId, itemIds: [itemId] })
    if (fetched.loginRequired) return { preview: null, loginRequired: true }
    const root = asRecord(fetched.payload)
    if (!root) continue
    const err = payloadErrorCode(root)
    if (err != null && err !== 0) {
      if (looksLikeLoginError(fetched.body)) return { preview: null, loginRequired: true }
      continue
    }
    const preview = previewFromItemMedia(root.result ?? root.data, sourceUrl, ref)
    if (preview?.detailImages.length) return { preview, loginRequired: false }
  }
  return { preview: null, loginRequired: false }
}

function albumApiCandidates(ref: WeishangAlbumRef, timestamp = '0'): string[] {
  const query = new URLSearchParams({
    searchValue: '',
    searchImg: '',
    startDate: '',
    endDate: '',
    sourceId: '',
    requestDataType: '',
    timestamp,
  })
  if (ref.albumId) query.set('albumId', ref.albumId)
  if (ref.shopId) query.set('shop_id', ref.shopId)
  // 看上家相册时带 sourceId 会报「查看上家相册不能有来源ID」
  if (ref.itemId) query.set('itemIds', ref.itemId)
  if (ref.tagId) query.set('tagId', ref.tagId)
  return [
    `https://www.szwego.com/album/personal/all?${query.toString()}`,
    `https://www.wegooooo.com/album/personal/all?${query.toString()}`,
  ]
}

async function fetchAlbumPage(
  ref: WeishangAlbumRef,
  cookie: string,
  timestamp = '0',
): Promise<{ payload: unknown; body: string; loginRequired: boolean }> {
  let lastBody = ''
  for (const url of albumApiCandidates(ref, timestamp)) {
    const fetched = await fetchText(url, cookie)
    lastBody = fetched.body
    if (looksLikeLoginError(fetched.body)) {
      return { payload: null, body: fetched.body, loginRequired: true }
    }
    try {
      const payload = JSON.parse(fetched.body)
      const err = payloadErrorCode(payload)
      if (err != null && err !== 0) {
        if (looksLikeLoginError(fetched.body)) {
          return { payload: null, body: fetched.body, loginRequired: true }
        }
        continue
      }
      return { payload, body: fetched.body, loginRequired: false }
    } catch {
      // try next host
    }
  }
  return { payload: null, body: lastBody, loginRequired: looksLikeLoginError(lastBody) }
}

function pickMatchingItem(
  items: Record<string, unknown>[],
  ref: WeishangAlbumRef,
): Record<string, unknown> | null {
  if (!items.length) return null
  if (!ref.itemId) return items[0]
  const wanted = ref.itemId.toLowerCase()
  const emptyRef: WeishangAlbumRef = { ...ref, itemId: null }
  return (
    items.find((item) => itemIdOf(item, emptyRef)?.toLowerCase() === wanted) ||
    items.find((item) => JSON.stringify(item).toLowerCase().includes(wanted)) ||
    null
  )
}

export async function expandWeishangFeedUrls(
  sourceUrl: string,
): Promise<{ urls: string[]; error?: string }> {
  const ref = parseWeishangAlbumRef(sourceUrl)
  if (!isWeishangFeedUrl(sourceUrl) && !ref.shopId && !ref.albumId) {
    return { urls: [], error: '请粘贴微购店铺或相册列表链接' }
  }
  const cookie = resolveWeishangCookie()
  if (!cookie) return { urls: [], error: weishangLoginHint(false) }

  const urls: string[] = []
  const seen = new Set<string>()
  let timestamp = '0'
  for (let page = 0; page < MAX_FEED_PAGES; page += 1) {
    const fetched = await fetchAlbumPage(ref, cookie, timestamp)
    if (fetched.loginRequired) return { urls: [], error: weishangLoginHint(true) }
    const items = albumItemsFromPayload(fetched.payload)
    for (const item of items) {
      const itemId = itemIdOf(item, ref)
      if (!itemId || seen.has(itemId)) continue
      const next = buildWeishangItemSourceUrl({
        shopId: ref.shopId || firstString(item.shopId, item.shop_id) || null,
        albumId: ref.albumId || firstString(item.albumId, item.album_id) || null,
        itemId,
        tagId: ref.tagId,
        shareCode: null,
      })
      if (!next) continue
      seen.add(itemId)
      urls.push(next)
      if (urls.length >= MAX_FEED_ITEMS) return { urls }
    }
    const nextTs = pageTimestampOf(fetched.payload)
    if (!nextTs || nextTs === timestamp || items.length === 0) break
    timestamp = nextTs
  }
  if (!urls.length) {
    return { urls: [], error: '没有从微购相册列表抽出商品，请确认链接或更新 Cookie 后重试' }
  }
  return { urls }
}

function previewFromHtml(html: string, sourceUrl: string, ref: WeishangAlbumRef): WeishangAlbumPreview {
  const images = uniqueImages(extractImageUrlsFromText(html)).filter((url) => !isShopChromeImageUrl(url))
  const title =
    decodeHtml(html.match(/<title>([^<]+)/i)?.[1] || '')
      .replace(/\s*[-_|].*$/, '')
      .trim()
  const name = isUsefulWeishangTitle(title) ? title : ref.itemId ? `微商 ${ref.itemId}` : '微商相册'
  return {
    ...emptyPreview(ref),
    name,
    priceMin: parsePrice(html.replace(/<[^>]+>/g, ' ')),
    mainImageUrl: images[0] || null,
    detailImages: images,
    productDetail: [name, '微购相册', sourceUrl].filter(Boolean).join('\n'),
  }
}

export async function fetchWeishangAlbumPreview(sourceUrl: string): Promise<FetchWeishangResult> {
  const ref = parseWeishangAlbumRef(sourceUrl)
  if (!isWeishangAlbumPageUrl(sourceUrl)) {
    return {
      preview: emptyPreview(ref),
      outcome: 'failed',
      failureReason: '请粘贴微购/微商相册链接（szwego / wegooooo）',
    }
  }

  const cookie = resolveWeishangCookie()
  if (!cookie) {
    return {
      preview: emptyPreview(ref),
      outcome: 'failed',
      failureReason: weishangLoginHint(false),
    }
  }
  try {
    if (ref.albumId && ref.itemId) {
      const media = await fetchItemMediaPreview(ref, sourceUrl, cookie)
      if (media.loginRequired) {
        return {
          preview: emptyPreview(ref),
          outcome: 'failed',
          failureReason: weishangLoginHint(Boolean(cookie)),
        }
      }
      if (media.preview?.detailImages.length) {
        return { preview: media.preview, outcome: 'success' }
      }
    }

    if (ref.itemId || ref.albumId || ref.shopId) {
      let timestamp = '0'
      let loginRequired = false
      const seekPages = ref.itemId ? MAX_ITEM_SEEK_PAGES : 1
      for (let page = 0; page < seekPages; page += 1) {
        const fetched = await fetchAlbumPage(ref, cookie, timestamp)
        if (fetched.loginRequired) {
          loginRequired = true
          break
        }
        const items = albumItemsFromPayload(fetched.payload)
        const matched = pickMatchingItem(items, ref)
        if (matched) {
          const preview = previewFromAlbumItem(matched, sourceUrl, ref)
          if (preview.detailImages.length > 0) {
            return { preview, outcome: 'success' }
          }
          const albumRef: WeishangAlbumRef = {
            ...ref,
            albumId: preview.albumId || ref.albumId,
            itemId: preview.itemId || ref.itemId,
          }
          if (albumRef.albumId && albumRef.itemId) {
            const media = await fetchItemMediaPreview(albumRef, sourceUrl, cookie)
            if (media.preview?.detailImages.length) {
              return { preview: media.preview, outcome: 'success' }
            }
          }
        }
        if (!ref.itemId) break
        const nextTs = pageTimestampOf(fetched.payload)
        if (!nextTs || nextTs === timestamp || items.length === 0) break
        timestamp = nextTs
      }
      if (loginRequired) {
        const htmlPreview = previewFromHtml('', sourceUrl, ref)
        return {
          preview: htmlPreview,
          outcome: 'failed',
          failureReason: weishangLoginHint(Boolean(cookie)),
        }
      }
    }

    if (ref.itemId) {
      return {
        preview: emptyPreview(ref),
        outcome: 'failed',
        failureReason:
          '微购上家相册太大，列表前几页没找到这条动态，也没有商品图。请在相册里打开该商品详情后再复制链接，或换一批较新的链接',
      }
    }

    const page = await fetchText(sourceUrl, cookie)
    const htmlPreview = previewFromHtml(page.body, sourceUrl, ref)
    const realHtmlImages = (htmlPreview.detailImages || []).filter((url) => !isShopChromeImageUrl(url))
    if (realHtmlImages.length > 0 && isUsefulWeishangTitle(htmlPreview.name)) {
      return { preview: { ...htmlPreview, detailImages: realHtmlImages, mainImageUrl: realHtmlImages[0] }, outcome: 'success' }
    }
    if (looksLikeLoginError(page.body) || !cookie) {
      return {
        preview: htmlPreview,
        outcome: 'failed',
        failureReason: weishangLoginHint(Boolean(cookie)),
      }
    }
    return {
      preview: htmlPreview,
      outcome: 'failed',
      failureReason: '没有解析到微商相册图片。请打开具体商品/动态后再复制地址，或更新 Cookie 后重试',
    }
  } catch (error) {
    return {
      preview: emptyPreview(ref),
      outcome: 'failed',
      failureReason: error instanceof Error ? error.message : '微商相册抓取失败',
    }
  }
}

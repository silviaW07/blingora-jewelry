import { extractAlbumTitlePrice } from '@/shared/albumTitlePrice'

export type YupooAlbumPreview = {
  albumId: string | null
  shopName: string | null
  name: string
  categoryName: string | null
  priceMin: number | null
  mainImageUrl: string | null
  detailImages: string[]
  supplierName: string | null
  productDetail: string
}

export type FetchYupooResult = {
  preview: YupooAlbumPreview
  outcome: 'success' | 'failed'
  failureReason?: string
}

const YUPOO_HOST_RE = /(^|\.)yupoo\.com$/i
const ALBUM_ID_RE = /\/albums\/(\d+)/i
const CATEGORY_ID_RE = /\/categories\/(\d+)/i
const PHOTO_HOST_RE = /(^|\.)photo\.yupoo\.com$/i
const MAX_CATEGORY_ALBUMS = 80

const emptyPreview = (albumId: string | null, shopName: string | null): YupooAlbumPreview => ({
  albumId,
  shopName,
  name: '',
  categoryName: null,
  priceMin: null,
  mainImageUrl: null,
  detailImages: [],
  supplierName: shopName,
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

export function extractYupooAlbumId(sourceUrl?: string | null): string | null {
  return String(sourceUrl || '').match(ALBUM_ID_RE)?.[1] || null
}

export function extractYupooShopName(sourceUrl?: string | null): string | null {
  try {
    const url = new URL(String(sourceUrl || '').trim())
    const hostMatch = url.hostname.match(/^([a-z0-9-]+)\.x\.yupoo\.com$/i)
    if (hostMatch?.[1]) return hostMatch[1]
    const pathMatch = url.pathname.match(/\/photos\/([a-z0-9-]+)/i)
    return pathMatch?.[1] || null
  } catch {
    return null
  }
}

export function isYupooAlbumUrl(sourceUrl?: string | null): boolean {
  const text = String(sourceUrl || '').trim()
  if (!/^https?:\/\//i.test(text)) return false
  try {
    const url = new URL(text)
    return YUPOO_HOST_RE.test(url.hostname) && Boolean(extractYupooAlbumId(text))
  } catch {
    return false
  }
}

export function isYupooCategoryUrl(sourceUrl?: string | null): boolean {
  const text = String(sourceUrl || '').trim()
  if (!/^https?:\/\//i.test(text)) return false
  try {
    const url = new URL(text)
    return YUPOO_HOST_RE.test(url.hostname) && CATEGORY_ID_RE.test(url.pathname) && !extractYupooAlbumId(text)
  } catch {
    return false
  }
}

export function extractYupooAlbumUrlsFromHtml(html: string, sourceUrl: string): string[] {
  const shop = extractYupooShopName(sourceUrl)
  if (!shop) return []
  const ids = new Set<string>()
  const re = /\/albums\/(\d+)/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(String(html || '')))) {
    if (match[1]) ids.add(match[1])
  }
  return Array.from(ids)
    .slice(0, MAX_CATEGORY_ALBUMS)
    .map((id) => `https://${shop}.x.yupoo.com/albums/${id}?uid=1&isSubCate=false`)
}

function photoRank(url: string): number {
  if (/\/(small|square|medium)\.(png|jpe?g|webp)(\?|$)/i.test(url)) return 0
  if (/\/big\.(png|jpe?g|webp)(\?|$)/i.test(url)) return 1
  return 2
}

function photoKey(url: string): string {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`.toLowerCase()
    return parsed.pathname.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

function collectPhotoUrls(html: string): string[] {
  const best = new Map<string, { url: string; rank: number }>()
  const push = (raw?: string | null) => {
    let text = decodeHtml(String(raw || '').trim().replace(/\\+/g, ''))
    if (text.startsWith('//')) text = `https:${text}`
    if (!/^https?:\/\//i.test(text)) return
    try {
      if (!PHOTO_HOST_RE.test(new URL(text).hostname)) return
    } catch {
      return
    }
    if (/\/icons?\//i.test(text) || /logo/i.test(text)) return
    const key = photoKey(text)
    const rank = photoRank(text)
    const prev = best.get(key)
    if (!prev || rank > prev.rank) best.set(key, { url: text, rank })
  }

  const originRe = /data-origin-src=["'](https?:\/\/[^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = originRe.exec(html))) push(match[1])

  const srcRe = /data-src=["'](https?:\/\/photo\.yupoo\.com\/[^"']+)["']/gi
  while ((match = srcRe.exec(html))) push(match[1])

  const imgRe = /src=["'](https?:\/\/photo\.yupoo\.com\/[^"']+)["']/gi
  while ((match = imgRe.exec(html))) push(match[1])

  const looseRe = /(?:https?:)?\/\/photo\.yupoo\.com\/[a-z0-9._/-]+/gi
  while ((match = looseRe.exec(html))) push(match[0])

  return Array.from(best.values())
    .map((item) => item.url)
    .slice(0, 40)
}

function parseAlbumCategory(html: string): string | null {
  const ignored = /^(首页|home|albums?|photos?|相冊|相册|all|全部)$/i
  const texts: string[] = []
  const catLink = /href=["'][^"']*\/categories\/\d+[^"']*["'][^>]*>([^<]{1,40})/gi
  let match: RegExpExecArray | null
  while ((match = catLink.exec(html))) {
    const text = decodeHtml(match[1] || '')
    if (text && !ignored.test(text)) texts.push(text)
  }
  const subtitle = html.match(/class="[^"]*showalbumheader__gallerysubtitle[^"]*"[^>]*>([^<]+)/i)?.[1]
  if (subtitle) texts.push(decodeHtml(subtitle))
  const unique = Array.from(new Set(texts.map((text) => text.trim()).filter(Boolean)))
  return unique.sort((a, b) => b.length - a.length)[0] || null
}

function parseAlbumTitle(html: string, albumId: string | null): string {
  const galleryTitle = html.match(/class="showalbumheader__gallerytitle"[^>]*>([^<]+)/i)?.[1]
  if (galleryTitle) return decodeHtml(galleryTitle)
  const hiddenH1 = html.match(/class="visually-hidden"[^>]*>\s*([^<]+)/i)?.[1]
  if (hiddenH1) return decodeHtml(hiddenH1)
  const pageTitle = html.match(/<title>([^|<]+)/i)?.[1]
  if (pageTitle) return decodeHtml(pageTitle).replace(/\s*\|\s*album.*$/i, '').trim()
  return albumId ? `Yupoo ${albumId}` : 'Yupoo 相册'
}

function parseYupooPPrice(text: string): number | null {
  const matched = String(text || '').match(/\bP\s*([0-9]+(?:\.[0-9]+)?)\b/i)
  if (!matched) return null
  const n = Number(matched[1])
  return Number.isFinite(n) && n > 0 ? n : null
}

function looksLikeDateCode(code: string): boolean {
  return /^20[2-3]\d(?:0[1-9]|1[0-2])(?:\d{2})?$/.test(code)
}

function stripLeadingIndexMarker(title: string): string {
  return String(title || '')
    .replace(/^[①-⑳❶-❿⓪-❾]+\s*/u, '')
    // 只去掉「1、」「1)」这种序号，不动 13.1000920 / 131000920 这种价+货号
    .replace(/^[1-9]\s*[、)）]\s*(?=\d{5,})/, '')
    .trim()
}

function twoDigitCost(raw: string): number | null {
  const price = Number(String(raw || '').slice(0, 2))
  return Number.isFinite(price) && price > 0 ? price : null
}

/**
 * 部分相册不写 P 价，把成本藏在货号前两位：131000920 → 成本 13。
 * 也认「13 1000920」「13-1000920」。不把「| 17」张数或日期当成价格。
 */
export function parseYupooLeadingCodePrice(title: string): number | null {
  let text = decodeHtml(String(title || '')).trim()
  for (let i = 0; i < 3; i += 1) {
    const next = stripLeadingIndexMarker(text)
    if (next === text) break
    text = next
  }

  const prefixed = text.match(/^(\d{2})(?:[\s\-_/．.]+(?=\d{5,}))?(\d{5,})/)
  if (prefixed) {
    const compact = `${prefixed[1]}${prefixed[2]}`
    if (!looksLikeDateCode(compact)) {
      const price = twoDigitCost(prefixed[1])
      if (price != null) return price
    }
  }

  const codes = text.match(/\d{5,}/g) || []
  for (const code of codes) {
    if (looksLikeDateCode(code)) continue
    const price = twoDigitCost(code)
    if (price != null) return price
  }
  return null
}

function parseAlbumPrice(html: string, title: string): number | null {
  const text = decodeHtml(html.replace(/<[^>]+>/g, ' '))
  return extractAlbumTitlePrice(title, text) ?? parseYupooPPrice(text) ?? parseYupooPPrice(title) ?? parseYupooLeadingCodePrice(title)
}

export function parseYupooAlbumHtml(html: string, sourceUrl: string): YupooAlbumPreview {
  const albumId = extractYupooAlbumId(sourceUrl)
  const shopName = extractYupooShopName(sourceUrl)
  const detailImages = collectPhotoUrls(html)
  const name = parseAlbumTitle(html, albumId)
  const categoryName = parseAlbumCategory(html)
  return {
    albumId,
    shopName,
    name,
    categoryName,
    priceMin: parseAlbumPrice(html, name),
    mainImageUrl: detailImages[0] || null,
    detailImages,
    supplierName: shopName,
    productDetail: [name, categoryName, shopName ? `Yupoo ${shopName}` : 'Yupoo', sourceUrl].filter(Boolean).join('\n'),
  }
}

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  Referer: 'https://x.yupoo.com/',
}

const readYupooSecret = (envFile: string | undefined, files: string[]): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const candidates = [...(envFile ? [envFile] : []), ...files]
    let dir = process.cwd()
    for (let i = 0; i < 6; i += 1) {
      for (const file of files) {
        if (!path.isAbsolute(file)) candidates.push(path.join(dir, file))
      }
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
    // optional secret file
  }
  return ''
}

const writeYupooSecret = (raw: string, dests: string[]): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path')
  const seen = new Set<string>()
  let wrote = false
  for (const dest of dests) {
    if (!dest || seen.has(dest)) continue
    seen.add(dest)
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, raw, 'utf8')
      wrote = true
    } catch {
      // try the next path
    }
  }
  return wrote
}

export function resolveYupooPassword(): string {
  return (
    (process.env.YUPOO_PASSWORD || process.env.COOKIE_YUPOO_PASSWORD || '').trim() ||
    readYupooSecret(process.env.YUPOO_PASSWORD_FILE, [
      '/home/admin/my-website/blingora-jewelry/secrets/yupoo-password.txt',
      'secrets/yupoo-password.txt',
      '.yupoo-password',
    ])
  )
}

export function persistYupooPassword(raw?: string | null): boolean {
  const text = String(raw || '').trim()
  if (!text) return false
  const wrote = writeYupooSecret(text, [
    '/home/admin/my-website/blingora-jewelry/secrets/yupoo-password.txt',
    require('path').join(process.cwd(), 'secrets', 'yupoo-password.txt'),
  ])
  if (wrote) process.env.YUPOO_PASSWORD = text
  return wrote
}

export function resolveYupooCookie(): string {
  const stored = (
    process.env.COOKIE_YUPOO ||
    ''
  ).replace(/^Cookie:\s*/i, '').trim() ||
    readYupooSecret(process.env.COOKIE_YUPOO_FILE, [
      '/home/admin/my-website/blingora-jewelry/secrets/yupoo-cookie.txt',
      'secrets/yupoo-cookie.txt',
      '.yupoo-cookie',
    ])
  const password = resolveYupooPassword()
  const parts = [stored, password ? `indexlockcode=${password}` : '', password ? `lockcode=${password}` : '']
    .map((part) => String(part || '').trim())
    .filter(Boolean)
  return parts.join('; ')
}

export function persistYupooCookie(raw?: string | null): boolean {
  const text = String(raw || '').replace(/^Cookie:\s*/i, '').trim()
  if (!text) return false
  const wrote = writeYupooSecret(text, [
    '/home/admin/my-website/blingora-jewelry/secrets/yupoo-cookie.txt',
    require('path').join(process.cwd(), 'secrets', 'yupoo-cookie.txt'),
  ])
  if (wrote) process.env.COOKIE_YUPOO = text
  return wrote
}

function yupooRequestHeaders(extra?: Record<string, string>): Record<string, string> {
  const cookie = resolveYupooCookie()
  return {
    ...FETCH_HEADERS,
    ...(cookie ? { Cookie: cookie } : {}),
    ...extra,
  }
}

async function unlockYupooShop(shopName: string | null, password: string): Promise<boolean> {
  const shop = String(shopName || '').trim()
  const pass = String(password || '').trim()
  if (!shop || !pass) return false
  try {
    const response = await fetch(
      `https://${shop}.x.yupoo.com/api/web/users/${encodeURIComponent(shop)}?password=${encodeURIComponent(pass)}`,
      {
        headers: yupooRequestHeaders({ Accept: 'application/json,text/plain,*/*' }),
        signal: AbortSignal.timeout(15_000),
      },
    )
    const payload = (await response.json().catch(() => null)) as { data?: { passwordValid?: boolean } } | null
    return Boolean(payload?.data?.passwordValid)
  } catch {
    return false
  }
}

function looksLikeMissingAlbum(status: number, html: string): boolean {
  return (
    status === 404 ||
    /this album is not exist|页面未找到|album is not exist/i.test(html)
  )
}

function looksLikePasswordAlbum(html: string): boolean {
  return /主页已加密|相册已加密|homepage is encrypted|please enter password|请输入密码/i.test(html)
}

function albumUrlCandidates(sourceUrl: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const push = (raw: string) => {
    const text = String(raw || '').trim()
    if (!text || seen.has(text)) return
    seen.add(text)
    out.push(text)
  }

  push(sourceUrl)
  try {
    const url = new URL(sourceUrl)
    if (!url.searchParams.has('uid')) {
      const withUid = new URL(url.href)
      withUid.searchParams.set('uid', '1')
      withUid.searchParams.set('isSubCate', 'false')
      push(withUid.href)
    }
    const shop = extractYupooShopName(sourceUrl)
    const albumId = extractYupooAlbumId(sourceUrl)
    if (shop && albumId) {
      const alt = new URL(`https://${shop}.x.yupoo.com/albums/${albumId}`)
      alt.searchParams.set('uid', '1')
      alt.searchParams.set('isSubCate', 'false')
      push(alt.href)
    }
  } catch {
    // keep the original URL only
  }
  return out
}

async function fetchAlbumHtml(targetUrl: string): Promise<{ status: number; url: string; html: string }> {
  const response = await fetch(targetUrl, {
    redirect: 'follow',
    headers: yupooRequestHeaders(),
    signal: AbortSignal.timeout(25_000),
  })
  return {
    status: response.status,
    url: response.url || targetUrl,
    html: await response.text(),
  }
}

export async function fetchYupooCategoryAlbumUrls(
  sourceUrl: string,
): Promise<{ urls: string[]; error?: string }> {
  if (!isYupooCategoryUrl(sourceUrl)) {
    return { urls: [], error: '请粘贴 Yupoo 分类页，例如 https://店铺.x.yupoo.com/categories/数字' }
  }
  try {
    const fetched = await fetchAlbumHtml(sourceUrl)
    if (fetched.status === 409 || fetched.status === 403) {
      return { urls: [], error: 'Yupoo 拒绝了服务器抓取，请稍后重试' }
    }
    const urls = extractYupooAlbumUrlsFromHtml(fetched.html, fetched.url || sourceUrl)
    if (!urls.length) {
      return { urls: [], error: '这个分类页没有相册。请点进「太阳镜平光镜」这类子分类后再复制地址栏链接' }
    }
    return { urls }
  } catch (error) {
    return { urls: [], error: error instanceof Error ? error.message : 'Yupoo 分类页抓取失败' }
  }
}

export async function fetchYupooAlbumPreview(sourceUrl: string): Promise<FetchYupooResult> {
  const albumId = extractYupooAlbumId(sourceUrl)
  const shopName = extractYupooShopName(sourceUrl)
  if (!isYupooAlbumUrl(sourceUrl)) {
    return {
      preview: emptyPreview(albumId, shopName),
      outcome: 'failed',
      failureReason: '请粘贴 Yupoo 相册地址，例如 https://店铺.x.yupoo.com/albums/数字',
    }
  }

  try {
    const password = resolveYupooPassword()
    if (password && shopName) {
      await unlockYupooShop(shopName, password)
    }

    let lastStatus = 0
    let lastMissing = false
    let lastPassword = false
    let lastHtml = ''
    let lastPreview = emptyPreview(albumId, shopName)
    for (const candidate of albumUrlCandidates(sourceUrl)) {
      const fetched = await fetchAlbumHtml(candidate)
      lastStatus = fetched.status
      lastHtml = fetched.html
      lastPreview = parseYupooAlbumHtml(fetched.html, fetched.url || sourceUrl)
      lastMissing = looksLikeMissingAlbum(fetched.status, fetched.html)
      lastPassword = looksLikePasswordAlbum(fetched.html)
      if (lastPreview.detailImages.length > 0) {
        return { preview: lastPreview, outcome: 'success' }
      }
    }
    const nestedAlbums = extractYupooAlbumUrlsFromHtml(lastHtml, sourceUrl)
    return {
      preview: lastPreview,
      outcome: 'failed',
      failureReason: lastPassword
        ? password
          ? '店铺密码已填，但仍停在加密页。请确认密码后重新解析'
          : '这个 Yupoo 店铺加了访问密码。请在导入页填写店铺访问密码后再解析'
        : lastMissing
        ? '这个 Yupoo 相册打不开。请从店铺分类点进相册后，复制浏览器地址栏完整链接再粘贴'
        : lastStatus === 409 || lastStatus === 403
          ? 'Yupoo 拒绝了服务器抓取，请稍后重试'
          : nestedAlbums.length >= 3
            ? '这是分类列表，没有单品大图。请点进一个相册复制地址，或直接粘贴分类页（系统会拆成多条）'
            : `没有解析到相册图片（HTTP ${lastStatus}）`,
    }
  } catch (error) {
    return {
      preview: emptyPreview(albumId, shopName),
      outcome: 'failed',
      failureReason: error instanceof Error ? error.message : 'Yupoo 相册抓取失败',
    }
  }
}

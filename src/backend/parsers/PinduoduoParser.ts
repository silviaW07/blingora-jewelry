/**
 * 拼多多商品页解析器。
 *
 * 拼多多页面可能返回服务端 JSON、内嵌状态或风控页；解析器只消费页面中真实存在的数据，
 * 不生成虚假标题/价格/SKU。遇到登录或风控页时返回明确错误，供任务单独重试。
 */

export type PinduoduoSkuPreview = {
  skuKey: string
  spec: string
  price: number | null
  stock: number | null
  imageUrl: string | null
  attributes: Array<{ name: string; value: string }>
}

export type PinduoduoProductPreview = {
  goodsId: string | null
  name: string
  priceMin: number | null
  priceMax: number | null
  mainImageUrl: string | null
  detailImages: string[]
  supplierName: string | null
  productDetail: string
  featureAttributes: Array<{ key: string; value: string }>
  colors: Array<{ label: string; imageUrl: string | null }>
  sizesByColor: Record<string, string[]>
  specSummary: Array<{ name: string; values: string[] }>
  skuTable: PinduoduoSkuPreview[]
}

export type FetchPinduoduoResult = {
  preview: PinduoduoProductPreview
  outcome: 'success' | 'risk_control' | 'expired' | 'failed'
  failureReason?: string
}

const PDD_HOST_RE = /(^|\.)((mobile|m)\.)?(yangkeduo|pinduoduo)\.com$/i
const IMAGE_RE = /^https?:\/\/.+\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i

const emptyPreview = (goodsId: string | null): PinduoduoProductPreview => ({
  goodsId,
  name: '',
  priceMin: null,
  priceMax: null,
  mainImageUrl: null,
  detailImages: [],
  supplierName: null,
  productDetail: '',
  featureAttributes: [],
  colors: [],
  sizesByColor: {},
  specSummary: [],
  skuTable: [],
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

const cleanText = (value: unknown) =>
  typeof value === 'string'
    ? decodeHtml(value).replace(/\s+/g, ' ').trim()
    : ''

const absoluteImage = (value: unknown) => {
  let url = cleanText(value).replace(/\\u002F/gi, '/').replace(/\\\//g, '/')
  if (url.startsWith('//')) url = `https:${url}`
  return IMAGE_RE.test(url) ? url : ''
}

const numberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const parsed = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * 拼多多 JSON 常用“分”为单位；带 decimal 的字符串通常已是元。
 */
const normalizePrice = (key: string, value: unknown): number | null => {
  const parsed = numberOrNull(value)
  if (parsed === null || parsed < 0) return null
  const lowerKey = key.toLowerCase()
  const raw = String(value)
  const looksCentField =
    /(?:price|minprice|maxprice|groupprice|normalprice|marketprice|skuprice)/i.test(lowerKey) &&
    !raw.includes('.')
  return looksCentField && parsed >= 100 ? Number((parsed / 100).toFixed(2)) : Number(parsed.toFixed(2))
}

export const extractPinduoduoGoodsId = (sourceUrl: string): string | null => {
  try {
    const url = new URL(sourceUrl)
    const queryId =
      url.searchParams.get('goods_id') ||
      url.searchParams.get('goodsId') ||
      url.searchParams.get('id')
    if (queryId && /^\d+$/.test(queryId)) return queryId
    const pathMatch = url.pathname.match(/(?:goods|goods2|product)[/-](\d+)/i)
    return pathMatch?.[1] || null
  } catch {
    return null
  }
}

export const isPinduoduoProductUrl = (sourceUrl: string) => {
  try {
    const url = new URL(sourceUrl)
    return PDD_HOST_RE.test(url.hostname) && Boolean(extractPinduoduoGoodsId(sourceUrl))
  } catch {
    return false
  }
}

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const collectJsonRoots = (html: string): unknown[] => {
  const roots: unknown[] = []
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = scriptRe.exec(html))) {
    const content = decodeHtml(match[1]).trim()
    const candidates = [content]
    const assignmentIndex = content.indexOf('=')
    if (assignmentIndex > 0) candidates.push(content.slice(assignmentIndex + 1).replace(/;\s*$/, '').trim())
    for (const candidate of candidates) {
      if (!candidate.startsWith('{') && !candidate.startsWith('[')) continue
      try {
        roots.push(JSON.parse(candidate))
        break
      } catch {
        // Other scripts can contain regular JavaScript; ignore them.
      }
    }
  }
  return roots
}

const walkJson = (
  value: unknown,
  visit: (record: JsonRecord) => void,
  seen = new Set<object>(),
  depth = 0,
) => {
  if (depth > 18 || !value || typeof value !== 'object' || seen.has(value as object)) return
  seen.add(value as object)
  if (Array.isArray(value)) {
    value.forEach((item) => walkJson(item, visit, seen, depth + 1))
    return
  }
  const record = value as JsonRecord
  visit(record)
  Object.values(record).forEach((item) => walkJson(item, visit, seen, depth + 1))
}

const firstString = (record: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    const value = cleanText(record[key])
    if (value) return value
  }
  return ''
}

const firstImage = (record: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    const value = absoluteImage(record[key])
    if (value) return value
  }
  return ''
}

const collectImagesFromValue = (value: unknown, output: Set<string>) => {
  if (typeof value === 'string') {
    const url = absoluteImage(value)
    if (url) output.add(url)
    return
  }
  if (Array.isArray(value)) value.forEach((item) => collectImagesFromValue(item, output))
}

const parseMeta = (html: string, key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const value = pattern.exec(html)?.[1]
    if (value) return decodeHtml(value)
  }
  return ''
}

const parseAttributes = (record: JsonRecord) => {
  const raw = record.specs || record.specList || record.spec_list || record.spec
  const attributes: Array<{ name: string; value: string }> = []
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!isRecord(entry)) continue
      const name = firstString(entry, ['spec_key', 'specKey', 'name', 'key', 'spec_name', 'specName'])
      const value = firstString(entry, ['spec_value', 'specValue', 'value', 'value_name', 'valueName'])
      if (name && value) attributes.push({ name, value })
    }
  } else if (isRecord(raw)) {
    for (const [name, value] of Object.entries(raw)) {
      const text = cleanText(value)
      if (name && text) attributes.push({ name, value: text })
    }
  }
  return attributes
}

export const parsePinduoduoHtml = (html: string, sourceUrl: string): PinduoduoProductPreview => {
  const goodsId = extractPinduoduoGoodsId(sourceUrl)
  const preview = emptyPreview(goodsId)
  const imageSet = new Set<string>()
  const priceValues: number[] = []
  const skuRows = new Map<string, PinduoduoSkuPreview>()
  const specValues = new Map<string, Set<string>>()

  preview.name =
    parseMeta(html, 'og:title') ||
    parseMeta(html, 'twitter:title') ||
    cleanText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || '').replace(/[-_|].*拼多多.*$/i, '')
  const metaImage = absoluteImage(parseMeta(html, 'og:image'))
  if (metaImage) imageSet.add(metaImage)
  const metaPrice = normalizePrice('meta', parseMeta(html, 'product:price:amount'))
  if (metaPrice !== null) priceValues.push(metaPrice)

  const roots = collectJsonRoots(html)
  for (const root of roots) {
    walkJson(root, (record) => {
      if (!preview.name) {
        preview.name = firstString(record, ['goods_name', 'goodsName', 'goods_title', 'goodsTitle', 'productName'])
      }
      if (!preview.supplierName) {
        preview.supplierName =
          firstString(record, ['mall_name', 'mallName', 'shop_name', 'shopName', 'storeName']) || null
      }
      if (!preview.productDetail) {
        preview.productDetail = firstString(record, ['goods_desc', 'goodsDesc', 'description', 'goods_description'])
      }

      const image = firstImage(record, [
        'goods_image_url',
        'goodsImageUrl',
        'hd_thumb_url',
        'hdThumbUrl',
        'thumb_url',
        'thumbUrl',
        'image_url',
        'imageUrl',
      ])
      if (image) imageSet.add(image)
      for (const key of ['gallery', 'gallery_urls', 'galleryUrls', 'detail_gallery', 'detailGallery']) {
        collectImagesFromValue(record[key], imageSet)
      }

      for (const [key, value] of Object.entries(record)) {
        if (!/(?:^|_)(?:min_?|max_?|group_?|normal_?|market_?|sku_?)?price$/i.test(key) &&
            !/(?:minPrice|maxPrice|groupPrice|normalPrice|marketPrice|skuPrice)/.test(key)) continue
        const price = normalizePrice(key, value)
        if (price !== null && price > 0 && price < 10_000_000) priceValues.push(price)
      }

      const attributes = parseAttributes(record)
      if (attributes.length > 0) {
        for (const attr of attributes) {
          if (!specValues.has(attr.name)) specValues.set(attr.name, new Set())
          specValues.get(attr.name)!.add(attr.value)
        }
        const skuKey =
          firstString(record, ['sku_id', 'skuId', 'id']) ||
          attributes.map((item) => `${item.name}:${item.value}`).join('|')
        const priceEntry = Object.entries(record).find(([key]) =>
          /^(?:sku_?price|group_?price|normal_?price|price)$/i.test(key),
        )
        const stock = numberOrNull(record.quantity ?? record.stock ?? record.inventory)
        skuRows.set(skuKey, {
          skuKey,
          spec: attributes.map((item) => item.value).join(' / '),
          price: priceEntry ? normalizePrice(priceEntry[0], priceEntry[1]) : null,
          stock,
          imageUrl: image || null,
          attributes,
        })
      }
    })
  }

  preview.detailImages = Array.from(imageSet)
  preview.mainImageUrl = preview.detailImages[0] || null
  preview.priceMin = priceValues.length ? Math.min(...priceValues) : null
  preview.priceMax = priceValues.length ? Math.max(...priceValues) : preview.priceMin
  preview.skuTable = Array.from(skuRows.values())
  preview.specSummary = Array.from(specValues.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }))

  const colorEntry = preview.specSummary.find((item) => /颜色|色|color/i.test(item.name))
  const sizeEntry = preview.specSummary.find((item) => /尺码|尺寸|规格|size/i.test(item.name))
  preview.colors = (colorEntry?.values || []).map((label) => {
    const sku = preview.skuTable.find((row) =>
      row.attributes.some((attr) => attr.name === colorEntry?.name && attr.value === label),
    )
    return { label, imageUrl: sku?.imageUrl || null }
  })
  for (const color of preview.colors) {
    preview.sizesByColor[color.label] = preview.skuTable
      .filter((row) => row.attributes.some((attr) => attr.value === color.label))
      .map((row) => row.attributes.find((attr) => attr.name === sizeEntry?.name)?.value || '')
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
  }

  return preview
}

const isRiskControlHtml = (html: string) =>
  /验证|安全校验|访问过于频繁|系统繁忙|risk|captcha|login|请在拼多多APP中打开/i.test(html)

const isExpiredHtml = (html: string) =>
  /商品已下架|商品不存在|已失效|页面不存在|goods.*(?:removed|offline)/i.test(html)

export const fetchPinduoduoProductPreview = async (sourceUrl: string): Promise<FetchPinduoduoResult> => {
  const goodsId = extractPinduoduoGoodsId(sourceUrl)
  if (!isPinduoduoProductUrl(sourceUrl)) {
    return {
      preview: emptyPreview(goodsId),
      outcome: 'failed',
      failureReason: '链接错误，请粘贴有效的拼多多商品详情页链接（需包含 goods_id）',
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(sourceUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.6',
        referer: 'https://mobile.yangkeduo.com/',
      },
    })
    const html = await response.text()
    const preview = parsePinduoduoHtml(html, response.url || sourceUrl)
    if (response.status === 404 || response.status === 410 || isExpiredHtml(html)) {
      return { preview, outcome: 'expired', failureReason: '该拼多多商品已下架或不存在' }
    }
    if (response.status === 403 || response.status === 429 || isRiskControlHtml(html)) {
      return {
        preview,
        outcome: 'risk_control',
        failureReason: '拼多多返回了登录/风控校验页，请稍后重试或更换可公开访问的商品链接',
      }
    }
    if (!response.ok) {
      return { preview, outcome: 'failed', failureReason: `拼多多页面请求失败（HTTP ${response.status}）` }
    }
    const hasProductData = Boolean(preview.name && (preview.mainImageUrl || preview.priceMin !== null))
    return hasProductData
      ? { preview, outcome: 'success' }
      : {
          preview,
          outcome: 'failed',
          failureReason: '页面未包含可识别的标题、价格或主图，可能需要登录后访问',
        }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知网络错误'
    return {
      preview: emptyPreview(goodsId),
      outcome: 'failed',
      failureReason: `拼多多页面抓取失败：${message}`,
    }
  } finally {
    clearTimeout(timer)
  }
}

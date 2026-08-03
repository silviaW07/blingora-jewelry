/**
 * 拼多多商品页解析器（升级版）。
 *
 * 优先从 window.rawData / skuProps / skus 等内嵌 JSON 提取真实主图、颜色、尺码与 SKU；
 * 并补充扫描 <img> 的 src / data-src / srcset。不臆造规格。
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
const PDD_CDN_HOST_RE =
  /(^|\.)(pddpic|yangkeduo|pinduoduo|pddugc|pddcdn|commimg)\./i
const LOGO_OR_PLACEHOLDER_RE =
  /(?:logo|favicon|avatar|placeholder|default[_-]?img|blank|sprite|icon[_-]?(?:pdd|goods)?|watermark|qrcode|captcha|loading)/i

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
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim()

const cleanText = (value: unknown) =>
  typeof value === 'string' ? decodeHtml(value).replace(/\s+/g, ' ').trim() : ''

const isLikelyProductImageUrl = (url: string) => {
  if (!url || !/^https?:\/\//i.test(url)) return false
  if (LOGO_OR_PLACEHOLDER_RE.test(url)) return false
  try {
    const host = new URL(url).hostname
    if (PDD_CDN_HOST_RE.test(host)) return true
    if (/\.(?:jpe?g|png|webp|avif)(?:$|\?)/i.test(url)) return true
    // 部分拼多多图无扩展名，但路径含 mms / goods / image
    if (/\/(?:mms|goods|image|img|gallery|sku)\b/i.test(url)) return true
  } catch {
    return false
  }
  return false
}

/** 统一绝对地址，并尽量升到较清晰图（去掉极小缩略后缀） */
const absoluteImage = (value: unknown): string => {
  let url = cleanText(value)
  if (!url) return ''
  if (url.startsWith('//')) url = `https:${url}`
  if (url.startsWith('/')) url = `https://img.pddpic.com${url}`
  // srcset 可能是 "url 1x, url2 2x"
  if (/\s+\d+[wx]\b/i.test(url) || url.includes(',')) {
    const first = url
      .split(',')
      .map((part) => part.trim().split(/\s+/)[0])
      .find((part) => /^https?:\/\//i.test(part))
    if (first) url = first
  }
  url = url
    .replace(/([?&])(?:w|h|width|height)=\d+/gi, '$1')
    .replace(/\?&/, '?')
    .replace(/[?&]$/, '')
  return isLikelyProductImageUrl(url) ? url : ''
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

const tryParseJsonSlice = (slice: string): unknown | null => {
  try {
    return JSON.parse(slice)
  } catch {
    try {
      return JSON.parse(
        slice
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '<')
          .replace(/&amp;/g, '&'),
      )
    } catch {
      return null
    }
  }
}

/** 按括号匹配提取某 key 的全部 JSON 值（对象或数组） */
const extractAllBalancedJsonValues = (html: string, key: string): unknown[] => {
  const results: unknown[] = []
  const keyRe = new RegExp(`(?:window\\.)?${key}\\s*=\\s*([\\[\\{])|"${key}"\\s*:\\s*([\\[\\{])`, 'gi')
  let matched: RegExpExecArray | null
  while ((matched = keyRe.exec(html))) {
    const startIdx = matched.index + matched[0].length - 1
    let depth = 0
    let inString = false
    let escaped = false
    for (let i = startIdx; i < html.length; i += 1) {
      const ch = html[i]
      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{' || ch === '[') depth += 1
      else if (ch === '}' || ch === ']') {
        depth -= 1
        if (depth === 0) {
          const parsed = tryParseJsonSlice(html.slice(startIdx, i + 1))
          if (parsed != null) results.push(parsed)
          keyRe.lastIndex = i + 1
          break
        }
      }
      if (i - startIdx > 2_500_000) break
    }
  }
  return results
}

const collectJsonRoots = (html: string): unknown[] => {
  const roots: unknown[] = []
  const seen = new Set<string>()
  const pushRoot = (value: unknown) => {
    if (value == null) return
    const key = typeof value === 'object' ? JSON.stringify(value).slice(0, 240) : String(value)
    if (seen.has(key)) return
    seen.add(key)
    roots.push(value)
  }

  for (const key of [
    'rawData',
    'initDataObj',
    'store',
    'goods',
    'sku',
    'skus',
    'skuProps',
    'sku_props',
    'initData',
  ]) {
    extractAllBalancedJsonValues(html, key).forEach(pushRoot)
  }

  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = scriptRe.exec(html))) {
    const content = decodeHtml(match[1]).trim()
    const assignmentIndex = content.search(/=\s*[\[\{]/)
    const candidates = [content]
    if (assignmentIndex > 0) {
      candidates.push(content.slice(assignmentIndex + 1).replace(/;\s*$/, '').trim())
    }
    for (const candidate of candidates) {
      if (!candidate.startsWith('{') && !candidate.startsWith('[')) continue
      const parsed = tryParseJsonSlice(candidate)
      if (parsed != null) {
        pushRoot(parsed)
        break
      }
    }
  }
  return roots
}

const walkJson = (
  value: unknown,
  visit: (record: JsonRecord, path: string) => void,
  seen = new Set<object>(),
  depth = 0,
  path = '',
) => {
  if (depth > 22 || !value || typeof value !== 'object' || seen.has(value as object)) return
  seen.add(value as object)
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkJson(item, visit, seen, depth + 1, `${path}[${index}]`))
    return
  }
  const record = value as JsonRecord
  visit(record, path)
  Object.entries(record).forEach(([key, item]) =>
    walkJson(item, visit, seen, depth + 1, path ? `${path}.${key}` : key),
  )
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
  if (Array.isArray(value)) {
    value.forEach((item) => collectImagesFromValue(item, output))
    return
  }
  if (isRecord(value)) {
    for (const key of Object.keys(value)) {
      if (!/(?:url|img|image|thumb|src|pic)/i.test(key)) continue
      collectImagesFromValue(value[key], output)
    }
  }
}

/** 从 HTML img 标签提取多属性图片链接 */
const extractImagesFromImgTags = (html: string, output: Set<string>) => {
  const imgRe = /<img\b([^>]*)>/gi
  let match: RegExpExecArray | null
  while ((match = imgRe.exec(html))) {
    const attrs = match[1] || ''
    const attrRe =
      /(?:src|data-src|data-original|data-lazy|data-img|data-url|data-srcset|srcset|data-background|data-bg)\s*=\s*(["'])(.*?)\1/gi
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = attrRe.exec(attrs))) {
      const raw = attrMatch[2] || ''
      if (attrMatch[0].toLowerCase().includes('srcset') || raw.includes(',')) {
        raw.split(',').forEach((part) => {
          const url = absoluteImage(part.trim().split(/\s+/)[0])
          if (url) output.add(url)
        })
      } else {
        const url = absoluteImage(raw)
        if (url) output.add(url)
      }
    }
  }

  // style background-image
  const bgRe = /background(?:-image)?\s*:\s*url\((['"]?)(https?:\/\/[^'")]+)\1\)/gi
  let bgMatch: RegExpExecArray | null
  while ((bgMatch = bgRe.exec(html))) {
    const url = absoluteImage(bgMatch[2])
    if (url) output.add(url)
  }
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

const isColorDimensionName = (name: string) => /颜色|色系|色彩|花色|款式|color/i.test(name)
const isSizeDimensionName = (name: string) =>
  /尺码|尺寸|规格|型号|size|容量|净含量|suit/i.test(name)

const normalizeAttrName = (name: string) => {
  if (isColorDimensionName(name)) return '颜色'
  if (isSizeDimensionName(name)) return '尺码'
  return name || '规格'
}

const parseAttributes = (record: JsonRecord) => {
  const raw =
    record.specs ||
    record.specList ||
    record.spec_list ||
    record.spec ||
    record.sku_spec ||
    record.skuSpec ||
    record.specs_list
  const attributes: Array<{ name: string; value: string }> = []
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!isRecord(entry)) continue
      const name = normalizeAttrName(
        firstString(entry, ['spec_key', 'specKey', 'name', 'key', 'spec_name', 'specName', 'pname']),
      )
      const value = firstString(entry, [
        'spec_value',
        'specValue',
        'value',
        'value_name',
        'valueName',
        'note',
        'v',
      ])
      if (name && value) attributes.push({ name, value })
    }
  } else if (isRecord(raw)) {
    for (const [name, value] of Object.entries(raw)) {
      const text = cleanText(value)
      if (name && text) attributes.push({ name: normalizeAttrName(name), value: text })
    }
  }
  return attributes
}

type SpecPropValue = { label: string; imageUrl: string | null }
type SpecProp = { name: string; values: SpecPropValue[] }

/** 解析拼多多 skuProps / goods_property 结构 */
const parseSkuPropsList = (raw: unknown): SpecProp[] => {
  if (!Array.isArray(raw)) return []
  const props: SpecProp[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const name = normalizeAttrName(
      firstString(item, ['name', 'spec_key', 'specKey', 'key', 'pname', 'prop', 'title', 'fname']),
    )
    const valueList =
      (Array.isArray(item.values) && item.values) ||
      (Array.isArray(item.value) && item.value) ||
      (Array.isArray(item.list) && item.list) ||
      []
    const values: SpecPropValue[] = []
    for (const entry of valueList) {
      if (typeof entry === 'string' || typeof entry === 'number') {
        const label = cleanText(entry)
        if (label) values.push({ label, imageUrl: null })
        continue
      }
      if (!isRecord(entry)) continue
      const label = firstString(entry, [
        'spec_value',
        'specValue',
        'value',
        'name',
        'note',
        'vid',
        'v',
      ])
      const imageUrl =
        firstImage(entry, [
          'thumb_url',
          'thumbUrl',
          'tiny_url',
          'tinyUrl',
          'image_url',
          'imageUrl',
          'url',
          'pic',
          'img',
          'sku_img',
          'skuImg',
        ]) || null
      if (label) values.push({ label, imageUrl })
    }
    if (name && values.length > 0) props.push({ name, values })
  }
  return props
}

const scoreSkuProps = (props: SpecProp[]) => {
  let score = 0
  for (const prop of props) {
    score += prop.values.length * (isColorDimensionName(prop.name) ? 5 : 2)
    score += prop.values.filter((item) => item.imageUrl).length * 3
  }
  return score
}

export const parsePinduoduoHtml = (html: string, sourceUrl: string): PinduoduoProductPreview => {
  const goodsId = extractPinduoduoGoodsId(sourceUrl)
  const preview = emptyPreview(goodsId)
  const imageSet = new Set<string>()
  const priceValues: number[] = []
  const skuRows = new Map<string, PinduoduoSkuPreview>()
  const specValues = new Map<string, Set<string>>()
  const colorImageMap = new Map<string, string>()
  let bestSkuProps: SpecProp[] = []
  let bestSkuPropsScore = 0

  preview.name =
    parseMeta(html, 'og:title') ||
    parseMeta(html, 'twitter:title') ||
    cleanText(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || '').replace(/[-_|].*拼多多.*$/i, '')

  const metaImage = absoluteImage(parseMeta(html, 'og:image'))
  if (metaImage) imageSet.add(metaImage)
  const metaPrice = normalizePrice('meta', parseMeta(html, 'product:price:amount'))
  if (metaPrice !== null) priceValues.push(metaPrice)

  extractImagesFromImgTags(html, imageSet)

  // 显式抽取常见关键键
  for (const key of ['skuProps', 'sku_props', 'skus', 'sku', 'goodsProperty', 'goods_property']) {
    for (const raw of extractAllBalancedJsonValues(html, key)) {
      const props = parseSkuPropsList(raw)
      const score = scoreSkuProps(props)
      if (score > bestSkuPropsScore) {
        bestSkuProps = props
        bestSkuPropsScore = score
      }
      if (Array.isArray(raw)) {
        for (const entry of raw) {
          if (!isRecord(entry)) continue
          const nestedProps = parseSkuPropsList(entry.skuProps || entry.sku_props || entry.values)
          const nestedScore = scoreSkuProps(nestedProps)
          if (nestedScore > bestSkuPropsScore) {
            bestSkuProps = nestedProps
            bestSkuPropsScore = nestedScore
          }
        }
      }
    }
  }

  const roots = collectJsonRoots(html)
  for (const root of roots) {
    walkJson(root, (record) => {
      if (!preview.name) {
        preview.name = firstString(record, [
          'goods_name',
          'goodsName',
          'goods_title',
          'goodsTitle',
          'productName',
          'share_title',
          'shareTitle',
        ])
      }
      if (!preview.supplierName) {
        preview.supplierName =
          firstString(record, ['mall_name', 'mallName', 'shop_name', 'shopName', 'storeName']) ||
          null
      }
      if (!preview.productDetail) {
        preview.productDetail = firstString(record, [
          'goods_desc',
          'goodsDesc',
          'description',
          'goods_description',
          'share_desc',
          'shareDesc',
        ])
      }

      const image = firstImage(record, [
        'hd_url',
        'hdUrl',
        'hd_thumb_url',
        'hdThumbUrl',
        'goods_image_url',
        'goodsImageUrl',
        'thumb_url',
        'thumbUrl',
        'image_url',
        'imageUrl',
        'pic_url',
        'picUrl',
      ])
      if (image) imageSet.add(image)

      for (const key of [
        'gallery',
        'gallery_urls',
        'galleryUrls',
        'detail_gallery',
        'detailGallery',
        'top_gallery',
        'topGallery',
        'view_image_url_list',
        'viewImageUrlList',
        'carousel_section_list',
        'carouselSectionList',
        'sku_img_list',
        'skuImgList',
      ]) {
        collectImagesFromValue(record[key], imageSet)
      }

      const localProps = parseSkuPropsList(
        record.skuProps || record.sku_props || record.goods_property || record.goodsProperty,
      )
      const localScore = scoreSkuProps(localProps)
      if (localScore > bestSkuPropsScore) {
        bestSkuProps = localProps
        bestSkuPropsScore = localScore
      }

      for (const [key, value] of Object.entries(record)) {
        if (
          !/(?:^|_)(?:min_?|max_?|group_?|normal_?|market_?|sku_?)?price$/i.test(key) &&
          !/(?:minPrice|maxPrice|groupPrice|normalPrice|marketPrice|skuPrice)/.test(key)
        ) {
          continue
        }
        const price = normalizePrice(key, value)
        if (price !== null && price > 0 && price < 10_000_000) priceValues.push(price)
      }

      const attributes = parseAttributes(record)
      const looksLikeSku =
        attributes.length > 0 ||
        Boolean(firstString(record, ['sku_id', 'skuId'])) ||
        /sku/i.test(String(record.sku_id || record.skuId || ''))
      if (looksLikeSku && attributes.length > 0) {
        for (const attr of attributes) {
          if (!specValues.has(attr.name)) specValues.set(attr.name, new Set())
          specValues.get(attr.name)!.add(attr.value)
          if (attr.name === '颜色' && image) colorImageMap.set(attr.value, image)
        }
        const skuKey =
          firstString(record, ['sku_id', 'skuId', 'id']) ||
          attributes.map((item) => `${item.name}:${item.value}`).join('|')
        const priceEntry = Object.entries(record).find(([key]) =>
          /^(?:sku_?price|group_?price|normal_?price|price|group_price)$/i.test(key),
        )
        const stock = numberOrNull(
          record.quantity ?? record.stock ?? record.inventory ?? record.sku_quantity,
        )
        const skuImage =
          firstImage(record, [
            'thumb_url',
            'thumbUrl',
            'sku_thumb_url',
            'skuThumbUrl',
            'image_url',
            'imageUrl',
            'pic',
          ]) ||
          image ||
          null
        const existing = skuRows.get(skuKey)
        if (!existing || (skuImage && !existing.imageUrl)) {
          skuRows.set(skuKey, {
            skuKey,
            spec: attributes.map((item) => item.value).join(' / '),
            price: priceEntry ? normalizePrice(priceEntry[0], priceEntry[1]) : existing?.price ?? null,
            stock: stock ?? existing?.stock ?? null,
            imageUrl: skuImage || existing?.imageUrl || null,
            attributes,
          })
        }
      }
    })
  }

  // 用最优 skuProps 回填颜色/尺码与色图
  for (const prop of bestSkuProps) {
    if (!specValues.has(prop.name)) specValues.set(prop.name, new Set())
    for (const value of prop.values) {
      specValues.get(prop.name)!.add(value.label)
      if (prop.name === '颜色' && value.imageUrl) {
        colorImageMap.set(value.label, value.imageUrl)
        imageSet.add(value.imageUrl)
      }
    }
  }

  // 若 JSON SKU 为空，但 skuProps 有颜色+尺码，则笛卡尔展开
  if (skuRows.size === 0 && bestSkuProps.length > 0) {
    const colorProp = bestSkuProps.find((item) => item.name === '颜色') || bestSkuProps[0]
    const sizeProp =
      bestSkuProps.find((item) => item.name === '尺码') ||
      bestSkuProps.find((item) => item.name !== colorProp.name) ||
      null
    const colors = colorProp?.values || []
    const sizes = sizeProp?.values || [{ label: '默认规格', imageUrl: null }]
    let index = 0
    for (const color of colors) {
      for (const size of sizes) {
        index += 1
        const attributes = [
          { name: colorProp.name, value: color.label },
          ...(sizeProp ? [{ name: sizeProp.name, value: size.label }] : []),
        ]
        const skuKey = attributes.map((item) => `${item.name}:${item.value}`).join('|') || `sku-${index}`
        skuRows.set(skuKey, {
          skuKey,
          spec: attributes.map((item) => item.value).join(' / '),
          price: priceValues.length ? Math.min(...priceValues) : null,
          stock: null,
          imageUrl: color.imageUrl || size.imageUrl || null,
          attributes,
        })
      }
    }
  }

  const orderedImages = Array.from(imageSet)
  preview.detailImages = orderedImages.slice(0, 120)
  // 主图优先：非 logo 的第一张；若色图更清晰也可作主图
  preview.mainImageUrl =
    orderedImages[0] ||
    Array.from(colorImageMap.values())[0] ||
    null
  preview.priceMin = priceValues.length ? Math.min(...priceValues) : null
  preview.priceMax = priceValues.length ? Math.max(...priceValues) : preview.priceMin
  preview.skuTable = Array.from(skuRows.values())

  preview.specSummary =
    bestSkuProps.length > 0
      ? bestSkuProps.map((prop) => ({
          name: prop.name,
          values: prop.values.map((item) => item.label),
        }))
      : Array.from(specValues.entries()).map(([name, values]) => ({
          name,
          values: Array.from(values),
        }))

  const colorEntry =
    preview.specSummary.find((item) => item.name === '颜色') ||
    preview.specSummary.find((item) => isColorDimensionName(item.name))
  const sizeEntry =
    preview.specSummary.find((item) => item.name === '尺码') ||
    preview.specSummary.find((item) => isSizeDimensionName(item.name))

  preview.colors = (colorEntry?.values || []).map((label) => {
    const fromMap = colorImageMap.get(label) || null
    const sku = preview.skuTable.find((row) =>
      row.attributes.some((attr) => attr.name === (colorEntry?.name || '颜色') && attr.value === label),
    )
    return { label, imageUrl: fromMap || sku?.imageUrl || null }
  })

  for (const color of preview.colors) {
    const sizes = preview.skuTable
      .filter((row) =>
        row.attributes.some(
          (attr) => attr.name === (colorEntry?.name || '颜色') && attr.value === color.label,
        ),
      )
      .map(
        (row) =>
          row.attributes.find((attr) => attr.name === (sizeEntry?.name || '尺码'))?.value || '',
      )
      .filter(Boolean)
    preview.sizesByColor[color.label] = Array.from(new Set(sizes))
  }

  // 仅有颜色无尺码时，给每个颜色挂一个「默认规格」，便于待上传区展开色图
  if (preview.colors.length > 0) {
    for (const color of preview.colors) {
      if (!preview.sizesByColor[color.label] || preview.sizesByColor[color.label].length === 0) {
        preview.sizesByColor[color.label] = ['默认规格']
      }
    }
  }

  return preview
}

const isRiskControlHtml = (html: string) =>
  /安全校验|访问过于频繁|系统繁忙|滑动验证|请在拼多多APP中打开|_____tmd_____|x5secdata/i.test(html) ||
  /"needLogin"\s*:\s*true|"need_login"\s*:\s*true/i.test(html)

const isExpiredHtml = (html: string) =>
  /商品已下架|商品不存在|已失效|页面不存在|goods.*(?:removed|offline)/i.test(html)

/** 壳页/商城首页标题，不能当作商品已解析成功 */
export const isGenericPinduoduoTitle = (name?: string | null) => {
  const text = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
  if (!text) return true
  return (
    text === '拼多多' ||
    text === 'pinduoduo' ||
    text === '拼多多商城' ||
    text === '拼多多 - 多实惠，多乐趣' ||
    text === '商品详情' ||
    /^拼多多/.test(text) && text.length <= 8
  )
}

/** 是否具备可入库的实质商品数据（图/价/规格至少一项，且标题非壳页） */
export const hasMeaningfulPinduoduoPreview = (preview: PinduoduoProductPreview) => {
  if (isGenericPinduoduoTitle(preview.name) && !preview.mainImageUrl && preview.skuTable.length === 0) {
    return false
  }
  const hasImage = Boolean(preview.mainImageUrl) || preview.detailImages.length > 0
  const hasPrice = preview.priceMin != null && preview.priceMin > 0
  const hasSpecs =
    preview.skuTable.length > 0 ||
    preview.colors.length > 0 ||
    preview.specSummary.some((item) => item.values.length > 0)
  const hasRealName = Boolean(preview.name) && !isGenericPinduoduoTitle(preview.name)
  return (hasImage || hasPrice || hasSpecs) && (hasRealName || hasImage || hasSpecs)
}

const readPddCookieFromDisk = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const candidates = [
      process.env.PDD_COOKIE_FILE,
      path.join(process.cwd(), 'secrets', 'pdd-cookie.txt'),
      path.join(process.cwd(), '.pdd-cookie'),
    ].filter(Boolean) as string[]
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        const text = fs.readFileSync(file, 'utf8').trim()
        if (text) return text
      }
    }
  } catch {
    // ignore missing optional cookie file
  }
  return ''
}

const buildPddFetchCandidates = (sourceUrl: string, goodsId: string | null) => {
  const urls: string[] = []
  const push = (url: string) => {
    if (url && !urls.includes(url)) urls.push(url)
  }
  if (goodsId) {
    push(`https://mobile.yangkeduo.com/goods.html?goods_id=${goodsId}`)
    push(`https://mobile.yangkeduo.com/goods2.html?goods_id=${goodsId}`)
    push(`https://yangkeduo.com/goods.html?goods_id=${goodsId}`)
  }
  push(sourceUrl)
  return urls
}

const buildPddRequestHeaders = (refererUrl: string) => {
  const cookie =
    process.env.COOKIE_PDD ||
    process.env.PDD_COOKIE ||
    process.env.YANGKEDUO_COOKIE ||
    readPddCookieFromDisk() ||
    ''
  return {
    'user-agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.6',
    referer: refererUrl || 'https://mobile.yangkeduo.com/',
    ...(cookie ? { cookie } : {}),
  }
}

export const fetchPinduoduoProductPreview = async (sourceUrl: string): Promise<FetchPinduoduoResult> => {
  const goodsId = extractPinduoduoGoodsId(sourceUrl)
  if (!isPinduoduoProductUrl(sourceUrl)) {
    return {
      preview: emptyPreview(goodsId),
      outcome: 'failed',
      failureReason: '链接错误，请粘贴有效的拼多多商品详情页链接（需包含 goods_id）',
    }
  }

  const hasCookie = Boolean(
    process.env.COOKIE_PDD ||
      process.env.PDD_COOKIE ||
      process.env.YANGKEDUO_COOKIE ||
      readPddCookieFromDisk(),
  )
  const loginHint = hasCookie
    ? '当前 Cookie 可能已失效，请更新环境变量 COOKIE_PDD 或 secrets/pdd-cookie.txt 后重试'
    : '拼多多商品页需登录态才能返回主图与规格：请配置环境变量 COOKIE_PDD（或写入 secrets/pdd-cookie.txt）后重新解析'

  const candidates = buildPddFetchCandidates(sourceUrl, goodsId)
  let lastFailure: FetchPinduoduoResult = {
    preview: emptyPreview(goodsId),
    outcome: 'failed',
    failureReason: loginHint,
  }

  for (const candidate of candidates) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20_000)
    try {
      const response = await fetch(candidate, {
        redirect: 'follow',
        signal: controller.signal,
        headers: buildPddRequestHeaders(candidate),
      })
      const html = await response.text()
      const preview = parsePinduoduoHtml(html, response.url || candidate)
      const needLogin = /"needLogin"\s*:\s*true|"need_login"\s*:\s*true/i.test(html)

      if (response.status === 404 || response.status === 410 || isExpiredHtml(html)) {
        lastFailure = { preview, outcome: 'expired', failureReason: '该拼多多商品已下架或不存在' }
        continue
      }
      if (response.status === 403 || response.status === 429 || isRiskControlHtml(html) || needLogin) {
        lastFailure = {
          preview,
          outcome: 'risk_control',
          failureReason: loginHint,
        }
        // 有 Cookie 时继续试下一个候选；无 Cookie 直接结束
        if (!hasCookie) return lastFailure
        continue
      }
      if (!response.ok) {
        lastFailure = {
          preview,
          outcome: 'failed',
          failureReason: `拼多多页面请求失败（HTTP ${response.status}）`,
        }
        continue
      }

      if (hasMeaningfulPinduoduoPreview(preview)) {
        return { preview, outcome: 'success' }
      }
      lastFailure = {
        preview,
        outcome: 'failed',
        failureReason: loginHint,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知网络错误'
      lastFailure = {
        preview: emptyPreview(goodsId),
        outcome: 'failed',
        failureReason: `拼多多页面抓取失败：${message}`,
      }
    } finally {
      clearTimeout(timer)
    }
  }

  return lastFailure
}

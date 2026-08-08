/**
 * OneBound 1688 item_get integration.
 *
 * Credentials are server-only:
 *   ONEBOUND_1688_KEY / ONEBOUND_1688_SECRET
 * Aliases ONEBOUND_KEY / ONEBOUND_SECRET are accepted for compatibility.
 */

export type OneBoundSkuRow = {
  skuKey?: string
  spec?: string
  costPrice?: number | null
  price?: number | null
  stock?: number | null
  imageUrl?: string | null
  attributes?: Array<{ name: string; value: string }>
}

export type OneBound1688Preview = {
  name: string | null
  mainImageUrl: string | null
  detailImages: string[]
  supplierName: string | null
  productDetail: string | null
  sourceCategoryName: string | null
  priceMin: number | null
  priceMax: number | null
  featureAttributes: Array<{ key: string; value: string }>
  skuTable: OneBoundSkuRow[]
  colors: Array<{ label: string; imageUrl?: string | null }>
  sizesByColor: Record<string, string[]>
  specSummary: Array<{ name: string; values: string[] }>
}

export type OneBoundFetchResult =
  | { kind: 'disabled'; reason: string }
  | { kind: 'parsed'; preview: OneBound1688Preview }
  | { kind: 'failed'; reason: string; errorCode?: string }

type UnknownRecord = Record<string, unknown>

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const cleanText = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number'
    ? String(value).replace(/\s+/g, ' ').trim()
    : ''

const numberOrNull = (value: unknown): number | null => {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const normalizeImageUrl = (value: unknown): string => {
  const raw = cleanText(value)
  if (!raw) return ''
  const url = raw.startsWith('//') ? `https:${raw}` : raw
  return /^https?:\/\//i.test(url) ? url : ''
}

const unique = <T>(values: T[]): T[] => Array.from(new Set(values))

const extractDescriptionImages = (item: UnknownRecord): string[] => {
  const explicit = asArray(item.desc_img)
    .map(normalizeImageUrl)
    .filter(Boolean)
  const html = typeof item.desc === 'string'
    ? item.desc
    : typeof item.desc_short === 'string'
      ? item.desc_short
      : ''
  const embedded = Array.from(
    html.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi),
    match => normalizeImageUrl(match[1]),
  ).filter(
    url =>
      Boolean(url) &&
      !/(?:^|\.)o0b\.cn\/|onebound/i.test(url),
  )
  return unique([...explicit, ...embedded])
}

const extractOfferId = (sourceUrl: string): string => {
  const text = String(sourceUrl || '')
  return (
    text.match(/offer\/(\d+)\.html/i)?.[1] ||
    text.match(/[?&](?:offerId|offer_id|id)=(\d+)/i)?.[1] ||
    (/^\d+$/.test(text.trim()) ? text.trim() : '')
  )
}

const resolveCredentials = () => {
  const key = cleanText(
    process.env.ONEBOUND_1688_KEY || process.env.ONEBOUND_KEY,
  )
  const secret = cleanText(
    process.env.ONEBOUND_1688_SECRET || process.env.ONEBOUND_SECRET,
  )
  const enabled = !/^(0|false|off|no)$/i.test(
    cleanText(process.env.ONEBOUND_1688_ENABLED || 'true'),
  )
  return { key, secret, enabled }
}

export const hasOneBound1688Configured = (): boolean => {
  const { key, secret, enabled } = resolveCredentials()
  return enabled && Boolean(key && secret)
}

const parseAttributeLabel = (
  raw: unknown,
): { name: string; value: string } | null => {
  const label = cleanText(raw)
  if (!label) return null
  const index = label.indexOf(':')
  if (index <= 0) return null
  const name = label.slice(0, index).trim()
  const value = label.slice(index + 1).trim()
  return name && value ? { name, value } : null
}

const parseSkuAttributes = (
  sku: UnknownRecord,
  propsList: UnknownRecord,
): Array<{ name: string; value: string }> => {
  const propertyKeys = cleanText(sku.properties)
    .split(';')
    .map(value => value.trim())
    .filter(Boolean)
  const fromList = propertyKeys
    .map(key => parseAttributeLabel(propsList[key]))
    .filter((value): value is { name: string; value: string } => Boolean(value))
  if (fromList.length) return fromList

  return cleanText(sku.properties_name)
    .split(';')
    .map(part => {
      const pieces = part.split(':')
      if (pieces.length < 4) return null
      return {
        name: pieces[2]?.trim() || '',
        value: pieces.slice(3).join(':').trim(),
      }
    })
    .filter(
      (value): value is { name: string; value: string } =>
        Boolean(value?.name && value?.value),
    )
}

const isColorName = (name: string): boolean =>
  /颜色|色号|colour|color/i.test(name)

const isSizeName = (name: string): boolean =>
  /尺码|尺寸|大小|规格|size|length|width|长度|宽度/i.test(name)

const imageForSku = (
  sku: UnknownRecord,
  propImages: UnknownRecord,
): string | null => {
  const keys = cleanText(sku.properties)
    .split(';')
    .map(value => value.trim())
    .filter(Boolean)
  for (const key of keys) {
    const url = normalizeImageUrl(propImages[key])
    if (url) return url
  }
  return null
}

export const mapOneBound1688Item = (item: UnknownRecord): OneBound1688Preview | null => {
  const name = cleanText(item.title).slice(0, 180) || null
  const mainImageUrl = normalizeImageUrl(item.pic_url) || null
  const itemImages = asArray(item.item_imgs)
    .map(value => normalizeImageUrl(asRecord(value).url))
    .filter(Boolean)
  const gallery = unique([
    ...(mainImageUrl ? [mainImageUrl] : []),
    ...itemImages,
  ]).slice(0, 12)

  const descImages = extractDescriptionImages(item).slice(0, 60)
  const productDetail = descImages.length
    ? descImages
        .map(
          url =>
            `<img src="${url.replace(/"/g, '&quot;')}" alt="" loading="lazy" style="display:block;width:100%;height:auto" />`,
        )
        .join('')
    : null

  const propsList = asRecord(item.props_list)
  const propImages = asRecord(item.props_img)
  const skuRoot = asRecord(item.skus)
  const rawSkus = asArray(skuRoot.sku).map(asRecord)
  const skuTable: OneBoundSkuRow[] = rawSkus.map((sku, index) => {
    const attributes = parseSkuAttributes(sku, propsList)
    const cost = numberOrNull(sku.price)
    return {
      skuKey:
        cleanText(sku.sku_id || sku.spec_id || sku.properties) ||
        `onebound-${index + 1}`,
      spec: attributes.map(attribute => attribute.value).join(' / ') || '默认规格',
      costPrice: cost,
      price: cost,
      stock: numberOrNull(sku.quantity),
      imageUrl: imageForSku(sku, propImages),
      attributes,
    }
  })

  const featureAttributes = asArray(item.props)
    .map(asRecord)
    .map(prop => ({
      key: cleanText(prop.name),
      value: cleanText(prop.value),
    }))
    .filter(prop => prop.key && prop.value)

  const summary = new Map<string, string[]>()
  for (const sku of skuTable) {
    for (const attribute of sku.attributes || []) {
      const values = summary.get(attribute.name) || []
      if (!values.includes(attribute.value)) values.push(attribute.value)
      summary.set(attribute.name, values)
    }
  }
  const specSummary = Array.from(summary, ([summaryName, values]) => ({
    name: summaryName,
    values,
  }))

  const colorsByLabel = new Map<string, string | null>()
  const sizesByColor: Record<string, string[]> = {}
  for (const sku of skuTable) {
    const color = (sku.attributes || []).find(attribute =>
      isColorName(attribute.name),
    )?.value
    const size = (sku.attributes || []).find(attribute =>
      isSizeName(attribute.name),
    )?.value
    if (color && !colorsByLabel.has(color)) {
      colorsByLabel.set(color, sku.imageUrl || null)
    }
    if (color && size) {
      const sizes = sizesByColor[color] || []
      if (!sizes.includes(size)) sizes.push(size)
      sizesByColor[color] = sizes
    }
  }
  const colors = Array.from(colorsByLabel, ([label, imageUrl]) => ({
    label,
    imageUrl,
  }))

  const skuPrices = skuTable
    .map(sku => sku.costPrice)
    .filter((value): value is number => value !== null && value !== undefined)
  const itemPrice = numberOrNull(item.price)
  const priceMin = skuPrices.length ? Math.min(...skuPrices) : itemPrice
  const priceMax = skuPrices.length ? Math.max(...skuPrices) : itemPrice
  const seller = asRecord(item.seller_info)
  const sourceCategory =
    featureAttributes.find(prop => /商品类型|品类|类目/.test(prop.key))?.value ||
    null

  if (!(name || mainImageUrl || skuTable.length)) return null
  return {
    name,
    mainImageUrl: mainImageUrl || gallery[0] || null,
    detailImages: gallery,
    supplierName:
      cleanText(seller.shop_name || seller.title || item.nick) || null,
    productDetail,
    sourceCategoryName: sourceCategory,
    priceMin,
    priceMax,
    featureAttributes,
    skuTable,
    colors,
    sizesByColor,
    specSummary,
  }
}

export async function fetchOneBound1688Preview(
  sourceUrl: string,
): Promise<OneBoundFetchResult> {
  const { key, secret, enabled } = resolveCredentials()
  if (!enabled) return { kind: 'disabled', reason: 'disabled by configuration' }
  if (!key || !secret) {
    return { kind: 'disabled', reason: 'credentials not configured' }
  }

  const offerId = extractOfferId(sourceUrl)
  if (!offerId) return { kind: 'failed', reason: 'invalid 1688 offer id' }

  const baseUrl =
    cleanText(process.env.ONEBOUND_1688_BASE_URL) ||
    'https://api-gw.onebound.cn/1688/item_get/'
  const endpoint = new URL(baseUrl)
  endpoint.searchParams.set('key', key)
  endpoint.searchParams.set('secret', secret)
  endpoint.searchParams.set('num_iid', offerId)
  endpoint.searchParams.set('lang', 'zh-CN')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    const payload = (await response.json()) as unknown
    const root = asRecord(payload)
    const errorCode = cleanText(root.error_code)
    if (!response.ok || (errorCode && errorCode !== '0000')) {
      return {
        kind: 'failed',
        reason:
          cleanText(root.reason || root.error) ||
          `OneBound HTTP ${response.status}`,
        errorCode,
      }
    }
    const preview = mapOneBound1688Item(asRecord(root.item))
    if (!preview) {
      return {
        kind: 'failed',
        reason: 'OneBound returned no parseable product fields',
        errorCode,
      }
    }
    console.warn(
      `[onebound1688] parsed offer=${offerId} gallery=${preview.detailImages.length} sku=${preview.skuTable.length}`,
    )
    return { kind: 'parsed', preview }
  } catch (error) {
    return {
      kind: 'failed',
      reason:
        error instanceof Error && error.name === 'AbortError'
          ? 'OneBound request timed out'
          : error instanceof Error
            ? error.message
            : String(error),
    }
  } finally {
    clearTimeout(timeout)
  }
}

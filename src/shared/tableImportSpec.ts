/**
 * 旧站/供货表常见把颜色和尺寸写在同一格：
 *   颜色1-30*24*10  /  黑色-23*14*7  /  30*24*10
 * 表格导入必须拆成 颜色 + 规格，否则前台 Options 会落成 Default。
 */

const splitComma = (raw?: string | null) =>
  String(raw ?? '')
    .replace(/，/g, ',')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

const uniq = (values: string[]) => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const key = value.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

const DIMENSION_RE = /^\d+(?:\.\d+)?(?:\s*[xX×*]\s*\d+(?:\.\d+)?){1,3}$/
const PACKED_RE = /^(.+?)\s*[-–—]\s*(\d+(?:\.\d+)?(?:\s*[xX×*]\s*\d+(?:\.\d+)?){1,3})$/
/** 颜色1-10*10*2cm / 巴宝莉套盒-105cm / 扣-95 / 蓝色-大号43*33*13cm */
const LOOSE_PACKED_RE =
  /^(.+?)\s*[-–—]\s*((?:大号|中号|小号|均码|plus)?\s*\d+(?:\.\d+)?(?:\s*[xX×*]\s*\d+(?:\.\d+)?){0,3}\s*(?:cm|mm|m|oz|ml|l|g|kg)?)$/i
const LOOKS_LIKE_PRICE_RE = /^\d+(\.\d+)?$/

export const TABLE_IMPORT_SPEC_HEADER_ALIASES = [
  '规格',
  '尺码',
  '尺寸',
  'size',
  'spec',
  'sku规格',
  '规格名称',
  'sku名称',
  '属性',
  '型号',
  'sku spec',
]

/** 表格「类目」列表头：英文 Hat / 英文类目 也必须读进 categoryName */
export const TABLE_IMPORT_CATEGORY_HEADER_ALIASES = [
  '类目',
  '英文类目',
  '中文类目',
  '类目名称',
  '产品分类',
  '商品类目',
  '商品分类',
  '分类',
  'category',
  'categories',
  'category name',
  'categoryname',
  'product category',
  'hat',
  'hats',
]

export function isTableImportCategoryHeader(cell?: string | null): boolean {
  const raw = String(cell || '').trim().toLowerCase()
  if (!raw) return false
  if (TABLE_IMPORT_CATEGORY_HEADER_ALIASES.includes(raw)) return true
  // 英文类目 / 商品类目名称 — 含「类目」即可，避开「类目系数」
  if (raw.includes('类目') && !raw.includes('系数')) return true
  if (raw.includes('category') && !raw.includes('id')) return true
  return false
}

const normalizeDimension = (raw: string) =>
  raw.replace(/\s+/g, '').replace(/[xX×]/g, '*')

export function parsePackedColorSize(raw?: string | null): { color: string; size: string } | null {
  const text = String(raw ?? '').trim()
  if (!text || LOOKS_LIKE_PRICE_RE.test(text)) return null

  const packed = text.match(PACKED_RE) || text.match(LOOSE_PACKED_RE)
  if (packed) {
    const color = packed[1].trim()
    const size = normalizeDimension(packed[2])
    if (!color || !size) return null
    return { color, size }
  }

  if (DIMENSION_RE.test(text)) {
    return { color: '', size: normalizeDimension(text) }
  }

  return null
}

export function looksLikePackedColorSize(raw?: string | null): boolean {
  return parsePackedColorSize(raw) != null
}

export function resolveTableImportColorSpec(input: {
  color?: string | null
  spec?: string | null
  extraCandidates?: Array<string | null | undefined>
}): { color: string; spec: string; colors: string[]; specs: string[] } {
  const colors: string[] = []
  const specs: string[] = []

  const ingest = (token: string, prefer: 'color' | 'spec' | 'auto') => {
    const packed = parsePackedColorSize(token)
    if (packed) {
      if (packed.color) colors.push(packed.color)
      if (packed.size) specs.push(packed.size)
      return
    }
    if (!token || (LOOKS_LIKE_PRICE_RE.test(token) && prefer !== 'spec')) return
    if (prefer === 'spec' || (prefer === 'auto' && DIMENSION_RE.test(token))) {
      specs.push(token)
      return
    }
    colors.push(token)
  }

  for (const token of splitComma(input.color)) ingest(token, 'color')
  for (const token of splitComma(input.spec)) ingest(token, 'spec')

  if (colors.length === 0 && specs.length === 0) {
    for (const extra of input.extraCandidates || []) {
      for (const token of splitComma(extra)) {
        if (!parsePackedColorSize(token)) continue
        ingest(token, 'auto')
      }
    }
  }

  const uniqueColors = uniq(colors)
  const uniqueSpecs = uniq(specs)
  return {
    color: uniqueColors.join(','),
    spec: uniqueSpecs.join(','),
    colors: uniqueColors,
    specs: uniqueSpecs,
  }
}

export function collectTableImportSkuPairs(
  rows: Array<{ color?: string | null; spec?: string | null; colors?: string[]; specs?: string[] }>,
): Array<{ color: string | null; spec: string | null }> {
  const pairs: Array<{ color: string | null; spec: string | null }> = []
  const seen = new Set<string>()

  const push = (color: string | null, spec: string | null) => {
    if (!color && !spec) return
    const key = `${color || ''}::${spec || ''}`
    if (seen.has(key)) return
    seen.add(key)
    pairs.push({ color, spec })
  }

  for (const row of rows) {
    const colorTokens = (row.colors?.length ? row.colors : splitComma(row.color)).map((value) => value.trim()).filter(Boolean)
    const specTokens = (row.specs?.length ? row.specs : splitComma(row.spec)).map((value) => value.trim()).filter(Boolean)
    const packedFromRow = [...colorTokens, ...specTokens]
      .map((token) => parsePackedColorSize(token))
      .filter((item): item is { color: string; size: string } => Boolean(item?.color && item?.size))

    if (packedFromRow.length > 0) {
      for (const item of packedFromRow) {
        push(item.color || null, item.size || null)
      }
      continue
    }

    const colors = colorTokens.length > 0 ? colorTokens : [null]
    const specs = specTokens.length > 0 ? specTokens : [null]
    for (const color of colors) {
      for (const spec of specs) {
        push(color, spec)
      }
    }
  }

  return pairs
}

const COLOR_DIMENSION_NAMES = new Set([
  '颜色',
  '颜色规格',
  '颜色分类',
  '花色',
  '花色分类',
  '款式颜色',
  'color',
  'colour',
  'colors',
])

export function isColorDimensionName(name?: string | null): boolean {
  const normalized = String(name || '').trim().toLowerCase()
  if (!normalized) return false
  if (COLOR_DIMENSION_NAMES.has(normalized) || COLOR_DIMENSION_NAMES.has(String(name || '').trim())) {
    return true
  }
  if (normalized.includes('颜色') && !normalized.includes('尺码') && !normalized.includes('尺寸')) {
    return true
  }
  return false
}

const CLASSIC_SIZE_TOKEN_RE =
  /^(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl|均码|大号|中号|小号|free\s*size)$/i

export function looksLikeSizeToken(value?: string | null): boolean {
  const text = String(value || '').trim()
  if (!text) return false
  if (DIMENSION_RE.test(text.replace(/\s+/g, '').replace(/[xX×]/g, '*'))) return true
  if (CLASSIC_SIZE_TOKEN_RE.test(text)) return true
  if (/^\d{1,2}(\.\d)?$/.test(text)) return true
  if (/\d+\s*(cm|mm|ml|oz|kg|g)$/i.test(text)) return true
  return false
}

/** 把「颜色规格」等别名、打包色码拆成前台能识别的 颜色 / Size */
export function enrichSkuColorSizeAttributes(
  attrs: Array<{ name: string; value: string }>,
  extra?: { sizeLabel?: string | null },
): Array<{ name: string; value: string }> {
  const out: Array<{ name: string; value: string }> = []
  const push = (name: string, value: string) => {
    const label = isColorDimensionName(name) ? '颜色' : name
    const token = String(value || '').trim()
    if (!label || !token) return
    if (out.some((row) => row.name === label && row.value === token)) return
    out.push({ name: label, value: token })
  }

  for (const attr of attrs) {
    const packed = parsePackedColorSize(attr.value)
    if (packed?.color && packed.size) {
      push('颜色', packed.color)
      push('Size', packed.size)
      continue
    }
    if (isColorDimensionName(attr.name)) {
      push('颜色', attr.value)
      continue
    }
    push(attr.name, attr.value)
  }

  const stored = String(extra?.sizeLabel || '').trim()
  if (stored) {
    const packed = parsePackedColorSize(stored)
    if (packed?.color) push('颜色', packed.color)
    if (packed?.size) {
      push('Size', packed.size)
    } else if (!out.some((row) => isColorDimensionName(row.name))) {
      if (!looksLikeSizeToken(stored)) push('颜色', stored)
      else if (!out.some((row) => looksLikeSizeToken(row.value))) push('Size', stored)
    } else if (looksLikeSizeToken(stored) && !out.some((row) => looksLikeSizeToken(row.value))) {
      push('Size', stored)
    }
  }

  // 仅有「规格」且取值不像尺码时，当作颜色（耳环/珠宝常见）
  const hasColor = out.some((row) => row.name === '颜色')
  if (!hasColor) {
    for (const row of out) {
      if (!/^(规格|spec)$/i.test(row.name)) continue
      if (looksLikeSizeToken(row.value)) continue
      row.name = '颜色'
    }
  }

  return out
}

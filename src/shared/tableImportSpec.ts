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

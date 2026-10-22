/** 待上传 SKU 摘要。
 *  旧格式仍按顺序改已有行：`粉色 / 42*28*15 | 红色 | 黑色`
 *  分布格式一次生成颜色 × 尺码：`颜色白色/红色` + `尺码31/32/33`
 *  → 白色/31、白色/32、白色/33、红色/31、红色/32、红色/33
 */

import { isPlaceholderSpecValue, stripSkuCopyLabel } from '@/shared/skuDisplayGuards'

export type PendingSkuSummaryEntry = {
  color: string
  spec: string
}

export type PendingSkuSummaryDraft = {
  sku_key?: string | null
  spec_text?: string | null
  attributes?: Array<{ name: string; value: string }>
  cost_price?: number | null
  price?: number | null
  weight_grams?: number | null
  stock?: number | null
  image_url?: string | null
}

export type PendingSkuDistribution = {
  colors: string[]
  specs: string[]
  specAttrName: '尺码' | '尺寸' | '规格'
}

export type PendingSkuSummaryApplyResult<T> = {
  skus: T[]
  mode: 'distribution' | 'ordered'
  summaryText: string
  colors: string[]
  specs: string[]
  truncated: boolean
}

const SPEC_ATTR_NAMES = ['规格', '尺码', '尺寸', '規格', '尺碼', 'size']
const COLOR_LABEL_SOURCE = '颜色|顏色|colour|color'
const SPEC_LABEL_SOURCE = '尺码|尺碼|尺寸|规格|規格|size'
/** 待上传列表本身只展示前 40 个 SKU，多生成的组合刷新后也看不到。 */
export const PENDING_SKU_DISTRIBUTION_LIMIT = 40

const COLOR_NAME = /^(颜色|顏色|color|colour)$/i

function uniq(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const token = value.trim()
    if (!token || seen.has(token)) continue
    seen.add(token)
    out.push(token)
  }
  return out
}

function findLabel(
  text: string,
  source: string,
  kind: 'color' | 'spec',
): { index: number; length: number; token: string } | null {
  const re = new RegExp(source, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    const index = match.index
    const token = match[0]
    const before = index === 0 ? '' : text[index - 1]
    if (index > 0 && !/[\s\n\r|，,;；:：/／、]/.test(before)) continue
    const after = text[index + token.length] || ''
    if (/[a-z]/i.test(token[0] || '') && /[a-z]/i.test(after)) continue
    // 「颜色1 / 颜色2」是旧摘要里的色名，不是分布标签。尺码31 仍是标签。
    if (kind === 'color' && /[0-9０-９]/.test(after)) continue
    return { index, length: token.length, token }
  }
  return null
}

function extractAxis(
  text: string,
  kind: 'color' | 'spec',
): { raw: string; token: string } | null {
  const source = kind === 'color' ? COLOR_LABEL_SOURCE : SPEC_LABEL_SOURCE
  const other = kind === 'color' ? SPEC_LABEL_SOURCE : COLOR_LABEL_SOURCE
  const found = findLabel(text, source, kind)
  if (!found) return null
  let rest = text.slice(found.index + found.length).replace(/^[\s:：]+/, '')
  rest = rest.replace(/^(分类|名称|名稱)\s*[:：]?\s*/, '')
  const otherFound = findLabel(rest, other, kind === 'color' ? 'spec' : 'color')
  if (otherFound) rest = rest.slice(0, otherFound.index)
  return { raw: rest.trim(), token: found.token }
}

function splitAxisValues(raw: string, kind: 'color' | 'spec'): string[] {
  const chunks = String(raw || '')
    .split(/[/／、,，|;；\n\r]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const tokens: string[] = []
  for (const chunk of chunks) {
    if (kind === 'spec' && /\s/.test(chunk) && !/[*xX×]/.test(chunk)) {
      tokens.push(...chunk.split(/\s+/).map((part) => part.trim()).filter(Boolean))
    } else {
      tokens.push(chunk)
    }
  }
  return uniq(
    tokens
      .map((token) =>
        stripSkuCopyLabel(token)
          .replace(/^(颜色|顏色|colour|color|尺码|尺碼|尺寸|规格|規格|size)\s*[:：]?\s*/i, '')
          .trim(),
      )
      .filter((token) => token && token.length <= 24 && !/^(颜色|顏色|colour|color|尺码|尺碼|尺寸|规格|規格|size)$/i.test(token)),
  )
}

function specAttrNameFrom(token: string): PendingSkuDistribution['specAttrName'] {
  if (/尺寸/.test(token)) return '尺寸'
  if (/尺码|尺碼|size/i.test(token)) return '尺码'
  return '规格'
}

export function parsePendingSkuDistribution(text?: string | null): PendingSkuDistribution | null {
  const raw = String(text || '').trim()
  if (!raw) return null
  const colorAxis = extractAxis(raw, 'color')
  const specAxis = extractAxis(raw, 'spec')
  if (!colorAxis || !specAxis) return null
  const colors = splitAxisValues(colorAxis.raw, 'color')
  const specs = splitAxisValues(specAxis.raw, 'spec')
  if (!colors.length || !specs.length) return null
  if (colors.length * specs.length < 2) return null
  return { colors, specs, specAttrName: specAttrNameFrom(specAxis.token) }
}

function readNamed(sku: PendingSkuSummaryDraft, matcher: (name: string) => boolean): string {
  const attrs = Array.isArray(sku.attributes) ? sku.attributes : []
  const found = attrs.find((attr) => matcher(String(attr.name || '').trim()))
  return stripSkuCopyLabel(found?.value)
}

export function readPendingSkuColor(sku: PendingSkuSummaryDraft): string {
  const fromAttr = readNamed(sku, (name) => COLOR_NAME.test(name))
  if (fromAttr && fromAttr !== '默认颜色' && fromAttr !== '其他') return fromAttr
  const left = stripSkuCopyLabel(String(sku.spec_text || '').split('/')[0] || '')
  if (left && left !== '默认颜色') return left
  return fromAttr
}

export function readPendingSkuSpec(sku: PendingSkuSummaryDraft): string {
  const fromAttr = readNamed(sku, (name) => SPEC_ATTR_NAMES.includes(name))
  if (fromAttr && !isPlaceholderSpecValue(fromAttr)) return fromAttr
  const parts = String(sku.spec_text || '')
    .split('/')
    .map((part) => stripSkuCopyLabel(part))
    .filter(Boolean)
  if (parts.length >= 2) {
    const right = parts.slice(1).join(' / ')
    if (right && !isPlaceholderSpecValue(right)) return right
  }
  return ''
}

function allocateKey(used: Set<string>, seed: string): string {
  const base = String(seed || 'sku').trim().replace(/\s+/g, '-').replace(/[\\/]/g, '-') || 'sku'
  let candidate = base
  let index = 2
  while (used.has(candidate)) {
    candidate = `${base}-${index}`
    index += 1
  }
  used.add(candidate)
  return candidate
}

function withColorAndSpec<T extends PendingSkuSummaryDraft>(
  source: T,
  color: string,
  spec: string,
  specAttrName: PendingSkuDistribution['specAttrName'],
  skuKey: string,
): T {
  const attributes = (Array.isArray(source.attributes) ? source.attributes : [])
    .map((attr) => ({ ...attr }))
    .filter((attr) => !SPEC_ATTR_NAMES.includes(String(attr.name || '').trim()))
  const colorIndex = attributes.findIndex((attr) => COLOR_NAME.test(String(attr.name || '').trim()))
  if (colorIndex >= 0) attributes[colorIndex] = { ...attributes[colorIndex], name: '颜色', value: color }
  else attributes.unshift({ name: '颜色', value: color })
  if (spec) attributes.push({ name: specAttrName, value: spec })
  const spec_text = attributes.map((attr) => String(attr.value || '').trim()).filter(Boolean).join(' / ')
  return { ...source, sku_key: skuKey, attributes, spec_text }
}

export function expandPendingSkuDistribution<T extends PendingSkuSummaryDraft>(
  skus: T[],
  distribution: PendingSkuDistribution,
  template?: T,
): { skus: T[]; truncated: boolean } {
  const sources = skus.length ? skus : template ? [template] : []
  const fallback = sources[0]
  if (!fallback) return { skus, truncated: false }
  const used = new Set<string>()
  const next: T[] = []
  let truncated = false
  for (const color of distribution.colors) {
    for (const spec of distribution.specs) {
      if (next.length >= PENDING_SKU_DISTRIBUTION_LIMIT) {
        truncated = true
        break
      }
      const same = sources.find((sku) => readPendingSkuColor(sku) === color && readPendingSkuSpec(sku) === spec)
      const sameColor = sources.find((sku) => readPendingSkuColor(sku) === color)
      const source = same || sameColor || fallback
      const preferred = same ? String(same.sku_key || '').trim() : ''
      let skuKey = preferred
      if (preferred && !used.has(preferred)) used.add(preferred)
      else skuKey = allocateKey(used, `${color}-${spec}`)
      next.push(withColorAndSpec(source, color, spec, distribution.specAttrName, skuKey))
    }
    if (truncated) break
  }
  return { skus: next, truncated }
}

export function parsePendingSkuSummaryEntries(text?: string | null): PendingSkuSummaryEntry[] {
  return String(text || '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const slash = part.search(/\s*\/\s*/)
      if (slash <= 0) return { color: stripSkuCopyLabel(part) || part, spec: '' }
      const color = stripSkuCopyLabel(part.slice(0, slash).trim())
      const spec = stripSkuCopyLabel(part.slice(slash).replace(/^\s*\/\s*/, '').trim())
      return { color: color || stripSkuCopyLabel(part) || part, spec }
    })
}

export function applyPendingSkuSummaryToDrafts<T extends PendingSkuSummaryDraft>(
  skus: T[],
  entries: PendingSkuSummaryEntry[],
): T[] {
  if (!skus.length || !entries.length) return skus
  return skus.map((sku, index) => {
    const entry = entries[index]
    if (!entry) return sku
    const attributes = (Array.isArray(sku.attributes) ? sku.attributes : []).map((attr) => ({ ...attr }))
    const colorIndex = attributes.findIndex((attr) => attr.name === '颜色')
    if (colorIndex >= 0) attributes[colorIndex] = { ...attributes[colorIndex], value: entry.color }
    else attributes.unshift({ name: '颜色', value: entry.color })

    const specIndex = attributes.findIndex((attr) => SPEC_ATTR_NAMES.includes(attr.name))
    if (!entry.spec) {
      if (specIndex >= 0) attributes.splice(specIndex, 1)
    } else if (specIndex >= 0) {
      attributes[specIndex] = { ...attributes[specIndex], value: entry.spec }
    } else {
      attributes.push({ name: '规格', value: entry.spec })
    }

    return {
      ...sku,
      attributes,
      spec_text: attributes.map((attr) => attr.value).filter(Boolean).join(' / ') || entry.color,
    }
  })
}

export function applyPendingSkuSummaryText<T extends PendingSkuSummaryDraft>(
  skus: T[],
  text: string,
  template?: T,
): PendingSkuSummaryApplyResult<T> {
  const distribution = parsePendingSkuDistribution(text)
  if (distribution) {
    const expanded = expandPendingSkuDistribution(skus, distribution, template)
    return {
      skus: expanded.skus,
      mode: 'distribution',
      summaryText: expanded.skus.map((sku) => sku.spec_text).filter(Boolean).join(' | '),
      colors: distribution.colors,
      specs: distribution.specs,
      truncated: expanded.truncated,
    }
  }
  const entries = parsePendingSkuSummaryEntries(text)
  return {
    skus: applyPendingSkuSummaryToDrafts(skus, entries),
    mode: 'ordered',
    summaryText: text,
    colors: [],
    specs: [],
    truncated: false,
  }
}

export function describePendingSkuSummarySave<T>(
  result: PendingSkuSummaryApplyResult<T>,
  previousCount: number,
  text: string,
): string {
  if (result.mode === 'distribution') {
    const combo = `${result.colors.join('/')} × ${result.specs.join('/')}`
    return result.truncated
      ? `已生成 ${result.skus.length} 个 SKU（${combo}，超出 ${PENDING_SKU_DISTRIBUTION_LIMIT} 个的组合未写入）`
      : `已生成 ${result.skus.length} 个 SKU（${combo}）`
  }
  const entryCount = parsePendingSkuSummaryEntries(text).length
  const skuCount = previousCount
  if (entryCount === skuCount) return `已按顺序写入 ${skuCount} 个 SKU 颜色/规格`
  if (entryCount > skuCount) return `已按顺序写入 ${skuCount} 个 SKU（摘要多出 ${entryCount - skuCount} 条已忽略）`
  return `已按顺序写入前 ${entryCount} 个 SKU（还有 ${skuCount - entryCount} 个未改）`
}

/** 待上传 SKU 摘要：`粉色 / 42*28*15 | 红色 | 黑色` → 按顺序写入颜色/规格 */

import { stripSkuCopyLabel } from '@/shared/skuDisplayGuards'

export type PendingSkuSummaryEntry = {
  color: string
  spec: string
}

export type PendingSkuSummaryDraft = {
  spec_text?: string | null
  attributes?: Array<{ name: string; value: string }>
}

const SPEC_ATTR_NAMES = ['规格', '尺码', '尺寸']

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

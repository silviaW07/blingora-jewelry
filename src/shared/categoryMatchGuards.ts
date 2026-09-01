/**
 * Attribute / material / quality filter categories.
 * They may be linked as tags, but must NOT win product-type matching or become 主类目
 * (e.g. title "…不锈钢项链 stainless steel" must pick Necklace, not "Stainless steel").
 */

const compact = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-·./]+/g, '')

/** 标题常见拼写：quialty / 货号粘连 3313normalquality */
export function canonicalizeQualityMatchText(value?: string | null): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s_·./&+,|-]+/g, '')
    .replace(/QUIALTY/g, 'QUALITY')
    .replace(/QUAILTY/g, 'QUALITY')
    .replace(/QULITY/g, 'QUALITY')
    .replace(/NOMALQUALITY/g, 'NORMALQUALITY')
    .replace(/NORAMLQUALITY/g, 'NORMALQUALITY')
}

export function isGluedFilterSuffixToken(normalizedToken: string) {
  if (!normalizedToken) return false
  return (
    /QUALITY/.test(normalizedToken) ||
    /STAINLESS/.test(normalizedToken) ||
    /BELOW\d/.test(normalizedToken) ||
    /BELOE\d/.test(normalizedToken)
  )
}

/** 品质/材质标签只允许用这些词撞标题，禁止用 jewelry/earring 等品类词误挂 */
export function isStrictFilterTitleToken(token?: string | null): boolean {
  const raw = String(token || '').trim()
  if (!raw) return false
  if (isAttributeOrFilterCategoryName(raw) && isGluedFilterSuffixToken(canonicalizeQualityMatchText(raw))) {
    return true
  }
  const key = canonicalizeQualityMatchText(raw)
  if (key.length < 4) return false
  return isGluedFilterSuffixToken(key) || ATTRIBUTE_EXACT_NAMES.has(compact(raw))
}

export type QualityShelfKind = 'jewelry' | 'bags' | null

/** high quality jewelry / high quality bag：必须整段品质+货架，不能只用 high quality */
export function detectQualityShelfKind(name?: string | null): QualityShelfKind {
  const key = compact(name)
  if (!key) return null
  const hasQuality = key.includes('quality') || key.includes('品质') || key.includes('质量')
  if (!hasQuality) return null
  if (key.includes('jewelry') || key.includes('jewellery') || key.includes('饰品') || key.includes('首饰')) {
    return 'jewelry'
  }
  if (key.includes('bag') || /品质包|质量包/.test(key) || key.endsWith('包')) {
    return 'bags'
  }
  return null
}

export function isShelfSpecificQualityPhrase(token: string, shelf: QualityShelfKind): boolean {
  if (!shelf) return false
  const key = canonicalizeQualityMatchText(token)
  if (!key) return false
  const hasQuality = key.includes('QUALITY') || key.includes('品质') || key.includes('质量')
  if (!hasQuality) return false
  if (shelf === 'jewelry') {
    return key.includes('JEWELR') || key.includes('饰品') || key.includes('首饰')
  }
  return key.includes('BAG') || key.includes('包')
}

/** Parent shelves that hold material/quality filters rather than sellable product types. */
const ATTRIBUTE_PARENT_NAMES = new Set(
  ['material', 'materials', '材质', '材料', 'quality', 'qualities', '品质', '成色', 'filter', 'filters', '筛选'].map(
    compact,
  ),
)

const ATTRIBUTE_EXACT_NAMES = new Set(
  [
    'stainless steel',
    'stainlesssteel',
    '不锈钢',
    '钛钢',
    'titanium',
    'titanium steel',
    'titaniumsteel',
    '925',
    '925 silver',
    'silver',
    'sterling silver',
    'othes material',
    'others material',
    'other material',
    'alloy',
    '合金',
    '锌合金',
    'copper',
    '铜',
    'brass',
    '黄铜',
    '白铜',
    'gold plated',
    'rosegold',
    'rose gold',
    '真皮',
    'pu',
    'pu leather',
    'leather',
    '皮革',
    'high quality',
    'high quality jewelry',
    'normal quality',
    'normal quality jewelry',
    'normal quality bag',
    'normal quialty',
    'low quality',
    'premium quality',
    'below13usd',
    'below3usd',
    'below13',
    'below3',
    'beloe3usd',
    '高质量',
    '普通品质',
    '低质量',
  ].map(compact),
)

const ATTRIBUTE_NAME_RE =
  /^(high|normal|low|premium)?qualit|高质量|普通品质|低质量|不锈钢|钛钢|stainless|titaniumsteel|^alloy$|^合金$|锌合金|goldplated|rosegold|sterling|below\d+usd|below\d+|beloe\d+usd/

/**
 * True for material / quality / filter categories that must not be 主类目.
 */
export function isAttributeOrFilterCategoryName(name?: string | null): boolean {
  const raw = String(name || '').trim()
  if (!raw) return false
  const key = compact(raw)
  if (!key) return false
  // L1 shelf itself: Material / Quality must never be 主类目
  if (ATTRIBUTE_PARENT_NAMES.has(key)) return true
  if (ATTRIBUTE_EXACT_NAMES.has(key)) return true
  if (ATTRIBUTE_NAME_RE.test(key)) return true
  // "Stainless steel xxx" style
  if (key.includes('stainless') && key.includes('steel')) return true
  if (key.includes('highquality') || key.includes('normalquality') || key.includes('lowquality')) return true
  if (key.includes('quialty') || key.includes('qulity')) return true
  return false
}

export function isAttributeOrFilterCategory(input?: {
  name?: string | null
  parentName?: string | null
} | null): boolean {
  if (!input) return false
  if (isAttributeOrFilterCategoryName(input.name)) return true
  const parentKey = compact(input.parentName)
  if (parentKey && ATTRIBUTE_PARENT_NAMES.has(parentKey)) return true
  return false
}

/** Real sellable shelf for 主类目: not Brand, not aggregate zone, not material/quality filter. */
export function isProductTypeCategory(input?: {
  name?: string | null
  parentName?: string | null
  isBrandCategory?: boolean | null
  level?: number | null
} | null): boolean {
  if (!input?.name) return false
  if (input.isBrandCategory) return false
  const name = String(input.name).trim().toLowerCase()
  if (name === 'brand' || name === 'brands' || name === '品牌') return false
  const parent = String(input.parentName || '').trim().toLowerCase()
  if (parent === 'brand' || parent === 'brands' || parent === '品牌') return false
  if (isAttributeOrFilterCategory(input)) return false
  return true
}

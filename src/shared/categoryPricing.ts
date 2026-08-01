const AGGREGATE_CATEGORY_NAME_PATTERNS = [
  '每日上新',
  'daily new arrival',
  'daily new arrivals',
  'new arrival',
  'new arrivals',
  'best seller',
  'best sellers',
  'bestseller',
  'best sale',
]

export function isAggregatePricingCategoryName(name?: string | null): boolean {
  const normalized = String(name || '').trim().toLowerCase()
  if (!normalized) return false
  return AGGREGATE_CATEGORY_NAME_PATTERNS.some((pattern) =>
    normalized.includes(pattern.toLowerCase()),
  )
}

/** Brand L1 shelf (name "Brand" or isBrandCategory). */
export function isBrandShelfCategory(input?: {
  name?: string | null
  isBrandCategory?: boolean | null
} | null): boolean {
  if (!input) return false
  if (input.isBrandCategory) return true
  return String(input.name || '').trim().toLowerCase() === 'brand'
}

/**
 * Categories that must not supply selling coefficients:
 * aggregate zones, Brand L1 shelf, and Brand L2 children (parent is Brand).
 */
export function isNonPricingCategory(input?: {
  name?: string | null
  isBrandCategory?: boolean | null
  parentName?: string | null
  parentIsBrandCategory?: boolean | null
} | null): boolean {
  if (!input) return false
  if (isAggregatePricingCategoryName(input.name)) return true
  if (isBrandShelfCategory({ name: input.name, isBrandCategory: input.isBrandCategory })) return true
  if (
    isBrandShelfCategory({
      name: input.parentName,
      isBrandCategory: input.parentIsBrandCategory,
    })
  ) {
    return true
  }
  return false
}

export function canEditCategoryPriceCoefficient(input: {
  level?: number | null
  parentId?: string | null
  name?: string | null
}): boolean {
  if (isAggregatePricingCategoryName(input.name)) return false
  if (isBrandShelfCategory({ name: input.name })) return false
  return input.level === 1 || Boolean(input.parentId)
}

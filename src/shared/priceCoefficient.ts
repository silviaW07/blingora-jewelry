import {
  isAggregatePricingCategoryName,
  isBrandShelfCategory,
  isNonPricingCategory,
} from '@/shared/categoryPricing'

/** Global fallback when neither L2 nor L1 has a valid coefficient. */
export const DEFAULT_PRICE_COEFFICIENT = 2

/**
 * Resolve category selling coefficient from the primary L1→L2 hierarchy only.
 * - Prefer L2 (own) when valid (non-null and > 0)
 * - Else inherit L1 (parent) when valid
 * - Else default to 2.00
 *
 * null/0 means unset. Brand / recommend-zone tags are not inputs here —
 * callers must pass primary categoryId hierarchy coeffs only.
 */
export function resolveCategoryPriceCoefficient(
  ownCoefficient: number | null | undefined,
  parentCoefficient: number | null | undefined,
): number {
  const own = typeof ownCoefficient === 'number' && Number.isFinite(ownCoefficient) ? ownCoefficient : null
  if (own !== null && own > 0) return own

  const parent =
    typeof parentCoefficient === 'number' && Number.isFinite(parentCoefficient) ? parentCoefficient : null
  if (parent !== null && parent > 0) return parent

  return DEFAULT_PRICE_COEFFICIENT
}

/** Whether the category row should expose an editable coefficient cell. */
export function canEditCategoryPriceCoefficient(
  level: number | null | undefined,
  parentId: string | null | undefined,
): boolean {
  return level === 1 || Boolean(parentId)
}

export function toDecimalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof (value as { toNumber?: () => number })?.toNumber === 'function') {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export type FrontCategoryCoeffSource = {
  name?: string | null
  level?: number | null
  priceCoefficient?: unknown
  isBrandCategory?: boolean | null
  parent?: {
    name?: string | null
    priceCoefficient?: unknown
    isBrandCategory?: boolean | null
  } | null
}

/**
 * Pick own/parent coefficients the same way admin does:
 * skip Brand / aggregate tags, prefer primary when it is a real category,
 * else prefer bound L2 over L1, then L2→L1→default 2.00.
 */
export function pickFrontPricingCategoryCoeffs(input: {
  primary?: FrontCategoryCoeffSource | null
  relations?: Array<FrontCategoryCoeffSource | null | undefined> | null
}): {
  ownCoefficient: unknown
  ownCategoryName: string | null
  parentCoefficient: unknown
  parentCategoryName: string | null
} {
  const candidates = [input.primary, ...(input.relations || [])].filter(
    (item): item is FrontCategoryCoeffSource => Boolean(item),
  )

  const isRealPricing = (cat: FrontCategoryCoeffSource) =>
    !isNonPricingCategory({
      name: cat.name,
      isBrandCategory: cat.isBrandCategory,
      parentName: cat.parent?.name,
      parentIsBrandCategory: cat.parent?.isBrandCategory,
    })

  const real = candidates.filter(isRealPricing)

  let chosen: FrontCategoryCoeffSource | null = null
  if (input.primary && isRealPricing(input.primary)) {
    chosen = input.primary
  } else if (real.length > 0) {
    chosen = [...real].sort((a, b) => (b.level ?? 0) - (a.level ?? 0))[0] || null
  }

  if (!chosen) {
    return {
      ownCoefficient: null,
      ownCategoryName: null,
      parentCoefficient: null,
      parentCategoryName: null,
    }
  }

  const ownBlocked = isAggregatePricingCategoryName(chosen.name) || isBrandShelfCategory(chosen)
  const parentBlocked =
    isAggregatePricingCategoryName(chosen.parent?.name) || isBrandShelfCategory(chosen.parent)

  return {
    ownCoefficient: ownBlocked ? null : chosen.priceCoefficient,
    ownCategoryName: chosen.name ?? null,
    parentCoefficient: parentBlocked ? null : chosen.parent?.priceCoefficient,
    parentCategoryName: chosen.parent?.name ?? null,
  }
}

/**
 * Front selling RMB: cost × category hierarchy coefficient when cost is available;
 * otherwise keep the stored SKU selling price.
 *
 * Coefficient source: L2 → L1 → DEFAULT 2.00. Brand / aggregate names are ignored.
 */
export function resolveFrontRmbSellingPrice(options: {
  skuPriceRmb: number
  costPrice?: unknown
  ownCoefficient?: unknown
  ownCategoryName?: string | null
  ownIsBrandCategory?: boolean | null
  parentCoefficient?: unknown
  parentCategoryName?: string | null
  parentIsBrandCategory?: boolean | null
}): number {
  const ownBlocked = isNonPricingCategory({
    name: options.ownCategoryName,
    isBrandCategory: options.ownIsBrandCategory,
    parentName: options.parentCategoryName,
    parentIsBrandCategory: options.parentIsBrandCategory,
  })
  const parentBlocked =
    isAggregatePricingCategoryName(options.parentCategoryName) ||
    isBrandShelfCategory({
      name: options.parentCategoryName,
      isBrandCategory: options.parentIsBrandCategory,
    })

  const cost = toDecimalNumber(options.costPrice)
  const coefficient = resolveCategoryPriceCoefficient(
    ownBlocked ? null : toDecimalNumber(options.ownCoefficient),
    parentBlocked ? null : toDecimalNumber(options.parentCoefficient),
  )
  if (cost !== null && cost > 0) {
    return Number((cost * coefficient).toFixed(2))
  }
  return options.skuPriceRmb
}

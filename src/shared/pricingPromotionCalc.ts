import type { FullReductionTier, PricingPromotionConfig } from '@/shared/pricingPromotionConfig'
import { isPromoRuleActive } from '@/shared/pricingPromotionConfig'

export type DiscountLine = {
  code: 'WHOLESALE' | 'SITE_WIDE' | 'FIRST_ORDER' | 'LOYAL' | 'FULL_REDUCTION' | 'SHIPPING'
  label: string
  amount: number
}

function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

/** Active site-wide percent coefficient (e.g. 0.90), or null when not a unit-price campaign. */
export function getSiteWidePercentCoef(config: PricingPromotionConfig | null | undefined): number | null {
  if (!config?.siteWide || !isPromoRuleActive(config.siteWide)) return null
  if (config.siteWide.mode === 'AMOUNT') return null
  const coef = clamp(Number(config.siteWide.value), 0, 1)
  if (coef <= 0 || coef >= 1) return null
  return coef
}

export function applySiteWideListedUsd(params: {
  price: number
  priceMax?: number | null
  originalPrice?: number | null
  coef: number | null
}): {
  price: number
  priceMax: number | null
  originalPrice: number | null
  hasDiscount: boolean
} {
  const price = roundMoney(Math.max(0, Number(params.price) || 0))
  const priceMax = params.priceMax != null ? roundMoney(Number(params.priceMax) || 0) : null
  if (params.coef == null) {
    const original = params.originalPrice != null ? roundMoney(Number(params.originalPrice) || 0) : null
    return {
      price,
      priceMax,
      originalPrice: original,
      hasDiscount: original != null && original > price + 0.009,
    }
  }
  const sale = roundMoney(price * params.coef)
  const saleMax = priceMax != null ? roundMoney(priceMax * params.coef) : null
  return {
    price: sale,
    priceMax: saleMax != null && saleMax > sale ? saleMax : saleMax,
    originalPrice: price,
    hasDiscount: price > sale + 0.009,
  }
}

export function buildWholesaleSteps(minOrderQty: number): Array<{
  minQty: number
  maxQty: number | null
  ratio: number
  label: string
}> {
  const base = Math.max(1, Math.floor(Number(minOrderQty) || 1))
  const steps = [
    { minQty: base, maxQty: base * 3 - 1 },
    { minQty: base * 3, maxQty: base * 6 - 1 },
    { minQty: base * 6, maxQty: base * 12 - 1 },
    { minQty: base * 12, maxQty: null as number | null },
  ]
  return steps.map((step, idx) => {
    const ratio = Math.max(0.85, 1 - idx * 0.05)
    const label = step.maxQty == null ? `${step.minQty}+` : `${step.minQty}-${step.maxQty}`
    return { ...step, ratio, label }
  })
}

export function pickWholesaleStep(minOrderQty: number, totalQty: number) {
  const qty = Math.max(0, Math.floor(Number(totalQty) || 0))
  const steps = buildWholesaleSteps(minOrderQty)
  return steps.find((s) => qty >= s.minQty && (s.maxQty == null || qty <= s.maxQty)) || steps[0]
}

export function pickFullReductionDiscount(tiers: FullReductionTier[], subtotalUsd: number): {
  tier: FullReductionTier | null
  amount: number
} {
  const subtotal = roundMoney(Math.max(0, Number(subtotalUsd) || 0))
  if (!tiers?.length || subtotal <= 0) return { tier: null, amount: 0 }
  const eligible = tiers
    .filter((t) => Number(t.thresholdUsd) > 0 && Number(t.offUsd) > 0 && subtotal >= Number(t.thresholdUsd))
    .sort((a, b) => Number(b.thresholdUsd) - Number(a.thresholdUsd))
  const tier = eligible[0] || null
  if (!tier) return { tier: null, amount: 0 }
  return { tier, amount: roundMoney(clamp(Number(tier.offUsd), 0, subtotal)) }
}

/**
 * Compute applicable discounts.
 * Note:
 * - Full reduction depends on cart subtotal; computed after percent/amount customer discounts.
 * - Wholesale is per-line based on the product total quantity across cart.
 */
export function computeDiscounts(params: {
  config: PricingPromotionConfig
  isFirstOrderEligible: boolean
  isLoyalCustomer: boolean
  lines: Array<{
    lineId: string
    productId: string
    minOrderQty: number
    quantity: number
    unitPriceUsd: number
    valid: boolean
  }>
}): {
  lineEffectiveUnitPrice: Record<string, number>
  originalSubtotalUsd: number
  discountedSubtotalUsd: number
  discountLines: DiscountLine[]
  totalDiscountUsd: number
  payableUsd: number
} {
  const cfg = params.config
  const discountLines: DiscountLine[] = []
  const unitPriceByLine: Record<string, number> = {}

  const productQtyMap = new Map<string, number>()
  for (const line of params.lines) {
    if (!line.valid) continue
    productQtyMap.set(line.productId, (productQtyMap.get(line.productId) || 0) + Math.max(0, line.quantity))
  }

  // 1) Wholesale per-line (and compute original subtotal)
  let originalSubtotal = 0
  let wholesaleSubtotal = 0
  let wholesaleDiscount = 0
  // temp store before customer percent
  const wholesaleUnitByLine: Record<string, number> = {}
  for (const line of params.lines) {
    const baseUnit = roundMoney(Math.max(0, Number(line.unitPriceUsd) || 0))
    if (!line.valid) {
      unitPriceByLine[line.lineId] = baseUnit
      continue
    }
    originalSubtotal += roundMoney(baseUnit * line.quantity)
    const totalQty = productQtyMap.get(line.productId) || line.quantity
    let effectiveUnit = baseUnit
    if (cfg.wholesale.enabled) {
      const step = pickWholesaleStep(line.minOrderQty, totalQty)
      const coef = roundMoney(clamp(Number(cfg.wholesale.coefficient), 0, 1))
      const effectiveCoef = Math.max(0, Math.min(1, step.ratio * coef))
      effectiveUnit = roundMoney(baseUnit * effectiveCoef)
      wholesaleDiscount += roundMoney((baseUnit - effectiveUnit) * line.quantity)
    }
    wholesaleUnitByLine[line.lineId] = effectiveUnit
    unitPriceByLine[line.lineId] = effectiveUnit
    wholesaleSubtotal += roundMoney(effectiveUnit * line.quantity)
  }
  originalSubtotal = roundMoney(originalSubtotal)
  wholesaleSubtotal = roundMoney(wholesaleSubtotal)
  if (wholesaleDiscount > 0) {
    discountLines.push({ code: 'WHOLESALE', label: 'Wholesale', amount: roundMoney(wholesaleDiscount) })
  }

  // 1b) Site-wide merchandise discount
  let subtotalAfterSiteWide = wholesaleSubtotal
  if (cfg.siteWide && isPromoRuleActive(cfg.siteWide) && wholesaleSubtotal > 0) {
    let siteWideDiscount = 0
    if (cfg.siteWide.mode === 'AMOUNT') {
      siteWideDiscount = roundMoney(clamp(Number(cfg.siteWide.value), 0, subtotalAfterSiteWide))
    } else {
      const coef = clamp(Number(cfg.siteWide.value), 0, 1)
      siteWideDiscount = roundMoney(subtotalAfterSiteWide - subtotalAfterSiteWide * coef)
      if (coef >= 0 && coef <= 1) {
        for (const line of params.lines) {
          if (!line.valid) continue
          const wholesaleUnit = wholesaleUnitByLine[line.lineId]
          if (!Number.isFinite(wholesaleUnit)) continue
          const next = roundMoney(wholesaleUnit * coef)
          wholesaleUnitByLine[line.lineId] = next
          unitPriceByLine[line.lineId] = next
        }
      }
    }
    if (siteWideDiscount > 0) {
      discountLines.push({ code: 'SITE_WIDE', label: 'Site-wide', amount: siteWideDiscount })
      subtotalAfterSiteWide = roundMoney(subtotalAfterSiteWide - siteWideDiscount)
    }
  }

  // 2) Customer discount (first order OR loyal) on the subtotal
  //    enabled + 活动时间窗内才生效（空时间按原逻辑：立即/永久）
  let customerDiscount = 0
  let subtotalAfterCustomer = subtotalAfterSiteWide
  let customerPercentCoef: number | null = null
  const firstOrderActive = isPromoRuleActive(cfg.firstOrder)
  const loyalActive = isPromoRuleActive(cfg.loyal)
  if (params.isFirstOrderEligible && firstOrderActive) {
    if (cfg.firstOrder.mode === 'AMOUNT') {
      customerDiscount = roundMoney(clamp(Number(cfg.firstOrder.value), 0, subtotalAfterCustomer))
    } else {
      const coef = clamp(Number(cfg.firstOrder.value), 0, 1)
      customerPercentCoef = coef
      customerDiscount = roundMoney(subtotalAfterCustomer - subtotalAfterCustomer * coef)
    }
    if (customerDiscount > 0) {
      discountLines.push({ code: 'FIRST_ORDER', label: 'First order', amount: customerDiscount })
      subtotalAfterCustomer = roundMoney(subtotalAfterCustomer - customerDiscount)
    }
  } else if (params.isLoyalCustomer && loyalActive) {
    const coef = clamp(Number(cfg.loyal.coefficient), 0, 1)
    customerPercentCoef = coef
    customerDiscount = roundMoney(subtotalAfterCustomer - subtotalAfterCustomer * coef)
    if (customerDiscount > 0) {
      discountLines.push({ code: 'LOYAL', label: 'Loyal customer', amount: customerDiscount })
      subtotalAfterCustomer = roundMoney(subtotalAfterCustomer - customerDiscount)
    }
  }

  // reflect percent discount into line unit prices for UI display (amount-off cannot be allocated reliably)
  if (customerPercentCoef != null && Number.isFinite(customerPercentCoef) && customerPercentCoef >= 0 && customerPercentCoef <= 1) {
    for (const line of params.lines) {
      if (!line.valid) continue
      const wholesaleUnit = wholesaleUnitByLine[line.lineId]
      if (!Number.isFinite(wholesaleUnit)) continue
      unitPriceByLine[line.lineId] = roundMoney(wholesaleUnit * customerPercentCoef)
    }
  }

  // 3) Full reduction（同样受活动时间窗约束）
  let fullReductionDiscount = 0
  let subtotalAfterAll = subtotalAfterCustomer
  if (isPromoRuleActive(cfg.fullReduction) && cfg.fullReduction.tiers?.length) {
    const { amount } = pickFullReductionDiscount(cfg.fullReduction.tiers, subtotalAfterCustomer)
    if (amount > 0) {
      fullReductionDiscount = amount
      discountLines.push({ code: 'FULL_REDUCTION', label: 'Full reduction', amount })
      subtotalAfterAll = roundMoney(subtotalAfterCustomer - amount)
    }
  }

  const totalDiscount = roundMoney(Math.max(0, originalSubtotal - subtotalAfterAll))

  return {
    lineEffectiveUnitPrice: unitPriceByLine,
    originalSubtotalUsd: originalSubtotal,
    discountedSubtotalUsd: wholesaleSubtotal,
    discountLines,
    totalDiscountUsd: totalDiscount,
    payableUsd: roundMoney(Math.max(0, subtotalAfterAll)),
  }
}

export function applyShippingDiscount(params: {
  config: PricingPromotionConfig
  shippingUsd: number
  merchandiseSubtotalUsd?: number
}): { shippingUsd: number; discountUsd: number } {
  const base = roundMoney(Math.max(0, Number(params.shippingUsd) || 0))
  const rule = params.config?.shipping
  if (!rule || !isPromoRuleActive(rule) || base <= 0) {
    return { shippingUsd: base, discountUsd: 0 }
  }
  const minSubtotal = roundMoney(Math.max(0, Number(rule.minSubtotalUsd) || 0))
  const merchandise = roundMoney(Math.max(0, Number(params.merchandiseSubtotalUsd) || 0))
  if (minSubtotal > 0 && merchandise < minSubtotal) {
    return { shippingUsd: base, discountUsd: 0 }
  }
  let next = base
  if (rule.mode === 'AMOUNT') {
    next = roundMoney(Math.max(0, base - clamp(Number(rule.value), 0, 1_000_000)))
  } else {
    next = roundMoney(base * clamp(Number(rule.value), 0, 1))
  }
  const discountUsd = roundMoney(Math.max(0, base - next))
  return { shippingUsd: next, discountUsd }
}


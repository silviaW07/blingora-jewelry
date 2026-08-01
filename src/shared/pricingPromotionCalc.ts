import type { FullReductionTier, PricingPromotionConfig } from '@/shared/pricingPromotionConfig'
import { isPromoRuleActive } from '@/shared/pricingPromotionConfig'

export type DiscountLine = {
  code: 'WHOLESALE' | 'FIRST_ORDER' | 'LOYAL' | 'FULL_REDUCTION'
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

  // 2) Customer discount (first order OR loyal) on the subtotal
  //    enabled + 活动时间窗内才生效（空时间按原逻辑：立即/永久）
  let customerDiscount = 0
  let subtotalAfterCustomer = wholesaleSubtotal
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


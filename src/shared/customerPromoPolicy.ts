import type { PricingPromotionConfig } from '@/shared/pricingPromotionConfig'

/** 首单：新客户/未转化且尚无已付款订单。老客：已有已付款订单。 */
export type CustomerPromoKind = 'FIRST_ORDER' | 'LOYAL' | 'NONE'

export const FIRST_ORDER_GOODS_COEF = 0.95
export const LOYAL_GOODS_COEF = 0.97

/**
 * 首单海运（仅新客户，按折后货额）。从高到低匹配。
 * 满 $50 减 15%，满 $100 减 30%，满 $200 减 50%。
 */
export const FIRST_ORDER_SEA_TIERS: Array<{ minUsd: number; off: number }> = [
  { minUsd: 200, off: 0.5 },
  { minUsd: 100, off: 0.3 },
  { minUsd: 50, off: 0.15 },
]

/** 海运减免比例（0.1 = 减 10%）。从高到低匹配。 */
export const SEA_FREIGHT_TIERS: Array<{ minUsd: number; off: number }> = [
  { minUsd: 10000, off: 1 },
  { minUsd: 5000, off: 0.5 },
  { minUsd: 3000, off: 0.35 },
  { minUsd: 2000, off: 0.25 },
  { minUsd: 1000, off: 0.2 },
  { minUsd: 500, off: 0.1 },
]

export function goodsCoefForKind(kind: CustomerPromoKind): number | null {
  if (kind === 'FIRST_ORDER') return FIRST_ORDER_GOODS_COEF
  if (kind === 'LOYAL') return LOYAL_GOODS_COEF
  return null
}

/** 后台填写 95 / 95vip / 97vip。空、0、100 都表示不单独打折。 */
export function parseVipDiscount(raw: unknown): number {
  const text = String(raw ?? '').trim().toLowerCase().replace(/vip/g, '').trim()
  if (!text) return 0
  const value = Math.round(Number(text))
  if (!Number.isFinite(value) || value <= 0 || value >= 100) return 0
  return value
}

export function formatVipDiscount(value: number | null | undefined): string {
  const n = parseVipDiscount(value)
  return n > 0 ? `${n}vip` : '0'
}

/** 有 VIP 时用 VIP 货折，否则用客户类型（首单 95 / 老客 97）。 */
export function resolveGoodsCoef(kind: CustomerPromoKind, vipDiscount: number | null | undefined): number | null {
  const vip = parseVipDiscount(vipDiscount)
  if (vip > 0) return vip / 100
  return goodsCoefForKind(kind)
}

export function combinePriceCoef(siteWide: number | null | undefined, customer: number | null | undefined): number | null {
  const a = siteWide == null ? 1 : siteWide
  const b = customer == null ? 1 : customer
  if (!(a > 0) || !(b > 0)) return null
  const coef = Math.round(a * b * 10000) / 10000
  if (coef >= 1) return null
  return coef
}

function matchTierOff(tiers: Array<{ minUsd: number; off: number }>, subtotalUsd: number): number {
  for (const tier of tiers) {
    if (subtotalUsd + 0.001 >= tier.minUsd) return tier.off
  }
  return 0
}

/** 海运减免比例。首单档与满额档取较高的一档，不把两个百分比相加。 */
export function seaOffRate(kind: CustomerPromoKind, merchandiseUsd: number): number {
  if (kind === 'NONE') return 0
  const sub = Math.max(0, Number(merchandiseUsd) || 0)
  const amountOff = matchTierOff(SEA_FREIGHT_TIERS, sub)
  if (kind !== 'FIRST_ORDER') return amountOff
  return Math.max(amountOff, matchTierOff(FIRST_ORDER_SEA_TIERS, sub))
}

export function isSeaBillingMode(mode: string | null | undefined): boolean {
  const value = String(mode || '')
  return value === 'SEA_PER_KG' || value === 'SEA_TIER'
}

/** 计费模式是海运，或渠道名里带 sea（如 ship by sea）。 */
export function isSeaFreightChannel(params: {
  billingMode?: string | null
  name?: string | null
}): boolean {
  if (isSeaBillingMode(params.billingMode)) return true
  return /\bsea\b/i.test(String(params.name || ''))
}

export function applySeaFreightDiscount(params: {
  kind: CustomerPromoKind
  billingMode: string | null | undefined
  channelName?: string | null
  shippingUsd: number
  merchandiseSubtotalUsd: number
}): { shippingUsd: number; discountUsd: number } {
  const base = Math.round(Math.max(0, Number(params.shippingUsd) || 0) * 100) / 100
  if (!isSeaFreightChannel({ billingMode: params.billingMode, name: params.channelName }) || base <= 0) {
    return { shippingUsd: base, discountUsd: 0 }
  }
  const off = seaOffRate(params.kind, params.merchandiseSubtotalUsd)
  if (off <= 0) return { shippingUsd: base, discountUsd: 0 }
  const next = Math.round(Math.max(0, base * (1 - off)) * 100) / 100
  return { shippingUsd: next, discountUsd: Math.round((base - next) * 100) / 100 }
}

/** 把首单 5% / 老客 3% 写进结算用的促销配置，盖过后台未开启的开关。 */
export function withCustomerGoodsPolicy(
  config: PricingPromotionConfig,
  kind: CustomerPromoKind,
  vipDiscount = 0,
): PricingPromotionConfig {
  const vip = parseVipDiscount(vipDiscount)
  const coef = vip > 0 ? vip / 100 : null
  if (kind === 'FIRST_ORDER') {
    return {
      ...config,
      firstOrder: {
        ...config.firstOrder,
        enabled: true,
        mode: 'PERCENT',
        value: coef ?? FIRST_ORDER_GOODS_COEF,
        startAt: null,
        endAt: null,
      },
    }
  }
  if (kind === 'LOYAL' || coef != null) {
    return {
      ...config,
      loyal: {
        ...config.loyal,
        enabled: true,
        coefficient: coef ?? LOYAL_GOODS_COEF,
        startAt: null,
        endAt: null,
      },
    }
  }
  return config
}

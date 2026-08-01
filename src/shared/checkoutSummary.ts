import { formatUsd } from '@/shared/money'

export type CheckoutSummaryInput = {
  /** 商品原价合计（USD，折扣前） */
  originalPriceUsd: number
  /** 折扣金额（USD，正数） */
  discountUsd: number
  /** 已选物流运费（USD）；未选时为 null */
  shippingFeeUsd: number | null
}

export type CheckoutSummaryTotals = {
  originalPriceUsd: number
  discountUsd: number
  shippingFeeUsd: number | null
  /** 商品折后小计 */
  subtotalAfterDiscountUsd: number
  /** 最终应付（含运费；未选物流时不含运费） */
  totalUsd: number
}

export function computeCheckoutTotals(input: CheckoutSummaryInput): CheckoutSummaryTotals {
  const originalPriceUsd = roundUsd(input.originalPriceUsd)
  const discountUsd = roundUsd(Math.max(0, input.discountUsd))
  const shippingFeeUsd =
    input.shippingFeeUsd != null && Number.isFinite(input.shippingFeeUsd)
      ? roundUsd(input.shippingFeeUsd)
      : null
  const subtotalAfterDiscountUsd = roundUsd(Math.max(0, originalPriceUsd - discountUsd))
  const totalUsd = roundUsd(subtotalAfterDiscountUsd + (shippingFeeUsd ?? 0))
  return {
    originalPriceUsd,
    discountUsd,
    shippingFeeUsd,
    subtotalAfterDiscountUsd,
    totalUsd,
  }
}

export function roundUsd(amount: number): number {
  return Math.round((Number(amount) || 0) * 100) / 100
}

export function formatCartWeight(totalWeightGram?: number | null): string {
  const gram = Number(totalWeightGram)
  if (!Number.isFinite(gram) || gram <= 0) return '—'
  if (gram >= 1000) {
    const kg = gram / 1000
    return `${Number.isInteger(kg) ? kg : kg.toFixed(2)} kg`
  }
  return `${Math.round(gram)} g`
}

export function sumCartWeightGram(
  items: Array<{ weightGram?: number | null; quantity?: number | null; status?: string }>,
  fallbackSummaryGram?: number | null,
): number {
  const fromSummary = Number(fallbackSummaryGram)
  if (Number.isFinite(fromSummary) && fromSummary > 0) return fromSummary

  return items.reduce((sum, item) => {
    if (item.status === 'INVALID') return sum
    const unitWeight = Number(item.weightGram) || 0
    const qty = Number(item.quantity) || 0
    return sum + unitWeight * qty
  }, 0)
}

export { formatUsd }

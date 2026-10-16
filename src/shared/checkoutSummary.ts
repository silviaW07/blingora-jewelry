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

export function pickSelectedCartItems<T extends { cartItemId: string; status?: string }>(
  items: T[],
  selectedIds: string[],
): T[] {
  const wanted = new Set((selectedIds || []).filter(Boolean))
  if (!wanted.size) return []
  return items.filter((item) => item.status !== 'INVALID' && wanted.has(item.cartItemId))
}

export function sumSelectedCartOriginalUsd(
  items: Array<{ originalSubtotal?: number | null; subtotal?: number | null }>,
): number {
  return roundUsd(
    items.reduce((sum, item) => sum + (Number(item.originalSubtotal ?? item.subtotal) || 0), 0),
  )
}

export function sumSelectedCartSubtotalUsd(items: Array<{ subtotal?: number | null }>): number {
  return roundUsd(items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0))
}

export function sumCartWeightGram(
  items: Array<{ weightGram?: number | null; quantity?: number | null; status?: string }>,
  fallbackSummaryGram?: number | null,
): number {
  if (items.length > 0) {
    return items.reduce((sum, item) => {
      if (item.status === 'INVALID') return sum
      const unitWeight = Number(item.weightGram) || 0
      const qty = Number(item.quantity) || 0
      return sum + unitWeight * qty
    }, 0)
  }
  const fromSummary = Number(fallbackSummaryGram)
  if (Number.isFinite(fromSummary) && fromSummary > 0) return fromSummary
  return 0
}

export { formatUsd }

export const CART_SELECTED_IDS_KEY = 'storefront_cart_selected_ids'

export function persistCartSelectedIds(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(CART_SELECTED_IDS_KEY, JSON.stringify((ids || []).filter(Boolean)))
  } catch {
    /* ignore quota / private mode */
  }
}

export function readPersistedCartSelectedIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(CART_SELECTED_IDS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map((id) => String(id || '').trim()).filter(Boolean) : []
  } catch {
    return []
  }
}

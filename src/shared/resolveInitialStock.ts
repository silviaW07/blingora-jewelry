/** Default available stock when source stock is missing / not returned. */
export const DEFAULT_AVAILABLE_STOCK = 1000

/** Default MOQ when source does not provide a valid positive quantity. */
export const DEFAULT_MIN_ORDER_QTY = 1

/**
 * Resolve initial stock:
 * - missing (null / undefined / '') or invalid / negative → fall back to 1000
 * - an explicit numeric value (including 0 = out of stock) is respected as-is
 *
 * This lets OneBound / 1688 real stock take precedence (quantity 0 → 0 → 缺货),
 * while manual / table imports without a stock value still default to 1000.
 */
export function resolveInitialStock(raw?: unknown): number {
  if (raw === null || raw === undefined || raw === '') {
    return DEFAULT_AVAILABLE_STOCK
  }
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n < 0) {
    return DEFAULT_AVAILABLE_STOCK
  }
  return Math.round(n)
}

/**
 * Resolve MOQ for import/API: missing / invalid → 1; otherwise keep a positive integer.
 */
export function resolveInitialMinOrderQty(raw?: unknown): number {
  if (raw === null || raw === undefined || raw === '') {
    return DEFAULT_MIN_ORDER_QTY
  }
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    return DEFAULT_MIN_ORDER_QTY
  }
  return Math.max(DEFAULT_MIN_ORDER_QTY, Math.round(n))
}

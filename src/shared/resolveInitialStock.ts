/** Default available stock when source stock is empty / 0 / null. */
export const DEFAULT_AVAILABLE_STOCK = 1000

/**
 * Keep explicit positive stock from 1688/PDD; otherwise initialize to 1000.
 */
export function resolveInitialStock(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') {
    return DEFAULT_AVAILABLE_STOCK
  }
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    return DEFAULT_AVAILABLE_STOCK
  }
  return Math.round(n)
}

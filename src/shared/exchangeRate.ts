import type prismaClient from '@/tools/prisma'

export const DEFAULT_USD_EXCHANGE_RATE = 6.5

type PrismaLike = typeof prismaClient

let cachedRate: { rate: number; at: number } | null = null

function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100
}

/**
 * Normalize the stored exchange rate value.
 *
 * We expect DB to store: **CNY per 1 USD** (e.g. 7.20).
 * But admins sometimes mistakenly store:
 * - **USD per 1 CNY** (e.g. 0.14) → we invert it.
 * - **1** (or other too-small values) → we fallback to default.
 */
function normalizeUsdExchangeRate(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_USD_EXCHANGE_RATE

  // If user stored USD per CNY, it's typically < 1 (e.g. 0.14). Invert to CNY per USD.
  if (n > 0 && n < 1) {
    const inverted = 1 / n
    return Number.isFinite(inverted) && inverted > 0 ? inverted : DEFAULT_USD_EXCHANGE_RATE
  }

  // USD↔CNY is never near 1 in practice; treat too-small values as misconfiguration.
  if (n >= 1 && n < 3) return DEFAULT_USD_EXCHANGE_RATE

  return n
}

/**
 * Load USD↔CNY exchange rate from DB.
 * - We treat `currencysetting.exchangeRate` as "CNY per 1 USD" (e.g. 7.20).
 * - Returns a positive finite number; falls back to DEFAULT_USD_EXCHANGE_RATE.
 *
 * Cache: short in-memory TTL to avoid per-call queries.
 */
export function invalidateUsdExchangeRateCache() {
  cachedRate = null
}

export async function getUsdExchangeRate(db: PrismaLike, options?: { ttlMs?: number }): Promise<number> {
  const ttlMs = options?.ttlMs ?? 0
  const now = Date.now()
  if (cachedRate && now - cachedRate.at <= ttlMs) return cachedRate.rate

  try {
    const preferred = await db.currencysetting.findFirst({
      where: { isActive: true, currencyCode: 'USD' },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      select: { exchangeRate: true },
    })
    const raw =
      preferred?.exchangeRate != null &&
      typeof (preferred.exchangeRate as { toNumber?: () => number }).toNumber === 'function'
        ? (preferred.exchangeRate as { toNumber: () => number }).toNumber()
        : Number(preferred?.exchangeRate)
    const rate = normalizeUsdExchangeRate(raw)
    cachedRate = { rate, at: now }
    return rate
  } catch {
    cachedRate = { rate: DEFAULT_USD_EXCHANGE_RATE, at: now }
    return DEFAULT_USD_EXCHANGE_RATE
  }
}

/** Convert RMB(CNY) → USD using the provided exchange rate. */
export function toUsdFromCny(cnyAmount: number, usdExchangeRate: number): number {
  // Always normalize so callers that pass a raw/misconfigured rate still convert correctly.
  const rate = normalizeUsdExchangeRate(usdExchangeRate)
  if (!Number.isFinite(cnyAmount)) return 0
  return roundMoney(cnyAmount / rate)
}

/** Convert USD → RMB(CNY) using the provided exchange rate. */
export function toCnyFromUsd(usdAmount: number, usdExchangeRate: number): number {
  const rate = normalizeUsdExchangeRate(usdExchangeRate)
  if (!Number.isFinite(usdAmount)) return 0
  return roundMoney(usdAmount * rate)
}


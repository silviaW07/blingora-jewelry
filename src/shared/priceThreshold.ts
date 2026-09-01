/**
 * Below 13usd / Below 3 usd listing caps.
 * Keep this module free of Node-only imports so storefront client code can use it.
 */

const compact = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s/_-]+/g, '')

const THRESHOLD_CAPS: Array<{ maxUsd: number; needles: string[] }> = [
  {
    maxUsd: 13,
    needles: ['below13', '低于13美元', '13美元以下'],
  },
  {
    maxUsd: 3,
    needles: ['below3', 'beloe3', '低于3美元', '3美元以下'],
  },
]

/** Category name/slug → USD cap, or null when this is not a price-band shelf. */
export function priceThresholdMaxUsdForCategory(
  name?: string | null,
  slug?: string | null,
): number | null {
  const hay = `${compact(name)}|${compact(slug)}`
  if (hay === '|') return null
  for (const rule of THRESHOLD_CAPS) {
    if (rule.needles.some((needle) => hay.includes(needle))) return rule.maxUsd
  }
  return null
}

/** True when the storefront card's high price is still inside the band. */
export function productFitsPriceThresholdUsd(
  priceMinUsd?: number | null,
  priceMaxUsd?: number | null,
  capUsd?: number | null,
): boolean {
  if (capUsd == null) return true
  const high =
    priceMaxUsd != null && Number.isFinite(priceMaxUsd) && priceMaxUsd > 0
      ? priceMaxUsd
      : priceMinUsd
  if (high == null || !Number.isFinite(high) || high <= 0) return false
  return high <= capUsd + 0.049
}

export function listingPriceBoundMaxUsd(
  ...names: Array<string | null | undefined>
): number | undefined {
  for (const name of names) {
    const cap = priceThresholdMaxUsdForCategory(name)
    if (cap != null) return cap
  }
  return undefined
}

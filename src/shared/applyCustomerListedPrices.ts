/** Apply customer-type goods coefficient (95 / 97 / VIP) onto already-listed USD prices. */

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100
}

function hasStrike(original: number | null | undefined, price: number | null | undefined): boolean {
  return (
    typeof original === 'number' &&
    typeof price === 'number' &&
    original > price + 0.009
  )
}

export function applyCustomerCoefToUsdPrice(
  price: number | null | undefined,
  original: number | null | undefined,
  coef: number | null,
): { price: number | null; originalPrice: number | null } {
  if (coef == null || !(coef > 0) || coef >= 1) {
    return { price: price ?? null, originalPrice: original ?? null }
  }
  if (hasStrike(original, price)) {
    return { price: price ?? null, originalPrice: original ?? null }
  }
  if (price == null || !(price > 0)) {
    return { price: price ?? null, originalPrice: original ?? null }
  }
  const sale = roundUsd(price * coef)
  if (sale >= price - 0.009) {
    return { price, originalPrice: original ?? null }
  }
  return {
    price: sale,
    originalPrice: original != null && original > price ? original : price,
  }
}

export function applyCustomerCoefToProductCard<
  T extends {
    price: number
    original_price?: number | null
    has_discount?: boolean
    price_max?: number | null
  },
>(item: T, coef: number | null): T {
  const next = applyCustomerCoefToUsdPrice(item.price, item.original_price, coef)
  if (next.price == null) return item
  const max = applyCustomerCoefToUsdPrice(item.price_max ?? null, null, coef)
  return {
    ...item,
    price: next.price,
    original_price: next.originalPrice,
    has_discount: hasStrike(next.originalPrice, next.price),
    price_max:
      max.price != null && max.price > next.price ? max.price : item.price_max ?? null,
  }
}

export function applyCustomerCoefToHomeProductCard<
  T extends {
    price?: number | null
    priceMin?: number | null
    priceMax?: number | null
    originalPrice?: number | null
    skuOptions?: Array<{ price?: number | null; originalPrice?: number | null }>
  },
>(card: T, coef: number | null): T {
  const price = applyCustomerCoefToUsdPrice(card.price, card.originalPrice, coef)
  const min = applyCustomerCoefToUsdPrice(card.priceMin, null, coef)
  const max = applyCustomerCoefToUsdPrice(card.priceMax, null, coef)
  return {
    ...card,
    price: price.price,
    priceMin: min.price ?? card.priceMin,
    priceMax: max.price ?? card.priceMax,
    originalPrice: price.originalPrice,
    skuOptions: (card.skuOptions || []).map((opt) => {
      const next = applyCustomerCoefToUsdPrice(opt.price, opt.originalPrice, coef)
      return { ...opt, price: next.price, originalPrice: next.originalPrice }
    }),
  }
}

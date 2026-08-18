/** Soft qty cap for storefront — never expose admin numeric warehouse stock. */
export const STOREFRONT_QTY_CAP = 9999

export function isStorefrontInStock(stock: number | null | undefined): boolean {
  return Number(stock) > 0
}

export function storefrontQtyMax(stock: number | null | undefined): number {
  return isStorefrontInStock(stock) ? STOREFRONT_QTY_CAP : 0
}

export function isStorefrontQtyAllowed(stock: number | null | undefined, qty: number): boolean {
  const n = Math.floor(Number(qty) || 0)
  if (n <= 0) return false
  return isStorefrontInStock(stock) && n <= STOREFRONT_QTY_CAP
}

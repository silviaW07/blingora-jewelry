/** Real purchase / shop URLs that can be opened from the product list. */
export function isExternalSupplierUrl(url?: string | null): boolean {
  const text = String(url || '').trim()
  if (!/^https?:\/\//i.test(text)) return false
  if (/table-import:\/\//i.test(text) || /product-return-/i.test(text)) return false
  return true
}

export function normalizeSupplierSourceUrl(url?: string | null): string | null {
  const text = String(url || '').trim()
  if (!isExternalSupplierUrl(text)) return null
  return text.slice(0, 700)
}

export function tradeImportSourceUrl(tradeInfoJson: unknown): string | null {
  if (!tradeInfoJson || typeof tradeInfoJson !== 'object' || Array.isArray(tradeInfoJson)) return null
  return normalizeSupplierSourceUrl((tradeInfoJson as { importSourceUrl?: unknown }).importSourceUrl)
}

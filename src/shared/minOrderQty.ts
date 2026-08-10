/** 商品级混批起订量（tradeInfoJson.minOrderQty），默认 1 */
export function resolveProductMinOrderQty(tradeInfoJson: unknown): number {
  return Math.max(1, Math.round(Number((tradeInfoJson as { minOrderQty?: unknown })?.minOrderQty ?? 0) || 1))
}

/**
 * 单行加购下限：
 * - SKU 显式配置了起订量 → 用 SKU
 * - 多规格可混批 → 单行最低 1（合计由商品级起订量约束）
 * - 单规格 → 单行即商品起订量
 */
export function resolveEffectiveSkuMinOrderQty(
  productMinOrderQty: number,
  skuMinOrderQty?: number | null,
  options?: { supportsMixedBatch?: boolean },
): number {
  const raw = Number(skuMinOrderQty ?? 0)
  if (Number.isFinite(raw) && raw > 0) return Math.round(raw)
  if (options?.supportsMixedBatch) return 1
  return Math.max(1, Math.round(productMinOrderQty) || 1)
}

export function resolveSkuMinOrderQty(input: {
  productMinOrderQty: number
  skuMinOrderQty?: number | null
  supportsMixedBatch?: boolean
}): number {
  return resolveEffectiveSkuMinOrderQty(input.productMinOrderQty, input.skuMinOrderQty, {
    supportsMixedBatch: input.supportsMixedBatch,
  })
}

/** 已选数量 > 0 时不得低于 MOQ；0 表示未选中 */
export function clampSelectedQuantityToMoq(quantity: number, minOrderQty: number): number {
  const moq = Math.max(1, Math.round(minOrderQty) || 1)
  if (quantity <= 0) return 0
  return Math.max(moq, Math.round(quantity))
}

export function nextQuantityAfterIncrement(
  current: number,
  minOrderQty: number,
  cap: number,
): number {
  const moq = Math.max(1, Math.round(minOrderQty) || 1)
  if (current <= 0) return Math.min(cap, moq)
  return Math.min(cap, current + 1)
}

/**
 * 减数量：
 * - allowClear=true（混批）：等于下限再减 → 0（取消该行）
 * - allowClear=false（单规格）：锁在下限，不能再减
 */
export function nextQuantityAfterDecrement(
  current: number,
  minOrderQty: number,
  options?: { allowClear?: boolean },
): number {
  const moq = Math.max(1, Math.round(minOrderQty) || 1)
  const allowClear = options?.allowClear !== false
  if (current <= 0) return 0
  if (current <= moq) return allowClear ? 0 : moq
  return current - 1
}

export function formatMinOrderQtyMessage(minOrderQty: number, locale: 'zh' | 'en' = 'zh'): string {
  const qty = Math.max(1, Math.round(minOrderQty) || 1)
  return locale === 'en'
    ? `Minimum order quantity is ${qty}`
    : `该商品最低起订量为 ${qty} 件`
}

/** 混批未达标提示：该商品混批起订量为 5 件，请至少再选择 3 件。 */
export function formatMixedBatchShortfallMessage(
  productMinOrderQty: number,
  selectedQty: number,
  locale: 'zh' | 'en' = 'zh',
): string {
  const moq = Math.max(1, Math.round(productMinOrderQty) || 1)
  const selected = Math.max(0, Math.round(selectedQty) || 0)
  const need = Math.max(0, moq - selected)
  return locale === 'en'
    ? `Mixed MOQ is ${moq} pcs. Please select at least ${need} more.`
    : `该商品混批起订量为 ${moq} 件，请至少再选择 ${need} 件。`
}

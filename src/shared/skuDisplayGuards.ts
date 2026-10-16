import { looksLikeColorToken, looksLikeSizeToken } from '@/shared/tableImportSpec'

/** 1688 常把品类/纯度写进 SKU 维，不能当 Size options。 */

const NON_SELLABLE_DIMENSION =
  /^(纯度|成色|含量|商品类型|产品类型|品类|类型|货号|品牌|产地|风格|造型|工艺|处理工艺|流行元素|适用人群|上市年份|季节|主要销售地区|主要下游平台)$/i

const PRODUCT_TYPE_SPEC_VALUE =
  /^(耳饰|耳环|耳钉|饰品|首饰|珠宝|项链|手链|手镯|戒指|脚链|吊坠|胸针|发夹|发绳|手表|眼镜|包|包包|箱包|腰带|鞋子|衣服|jewelry|earrings?|necklace|bracelet|ring)$/i

export function isNonSellableSkuDimensionName(name?: string | null): boolean {
  const normalized = String(name || '').trim()
  if (!normalized) return false
  if (NON_SELLABLE_DIMENSION.test(normalized)) return true
  return /纯度|商品类型|产品类型|品类/.test(normalized)
}

export function isProductTypeSpecValue(value?: string | null): boolean {
  return PRODUCT_TYPE_SPEC_VALUE.test(String(value || '').trim())
}

/** 颜色名被误写成规格/尺码时，不能当 Size options。 */
export function isColorNameSpecValue(value?: string | null): boolean {
  const text = String(value || '').trim().replace(/\s+/g, '').replace(/副本\d*$/u, '')
  if (!text) return false
  if (looksLikeSizeToken(text)) return false
  if (/格子|樱桃|棋盘|千鸟|卡通|太空|小猫/.test(text)) return true
  if (looksLikeColorToken(String(value || '').trim())) return true
  return /色$/.test(text) && /白|黑|米|棕|红|紅|粉|绿|綠|蓝|藍|银|銀|金|灰|咖啡|卡其|杏|橘|橙|紫|黄|黃|裸/.test(text)
}

/** 未识别到尺码/规格时留空，不要用颜色或「默认规格」占位。 */
export function isPlaceholderSpecValue(value?: string | null): boolean {
  const text = String(value || '').trim().replace(/\s+/g, '')
  if (!text) return true
  if (/^(默认规格|默认|default|standard)$/i.test(text)) return true
  return isColorNameSpecValue(text)
}

export function isSellableSkuAttribute(attr?: { name?: string | null; value?: string | null } | null): boolean {
  const name = String(attr?.name || '').trim()
  const value = String(attr?.value || '').trim()
  if (!name || !value) return false
  if (isNonSellableSkuDimensionName(name)) return false
  if (isProductTypeSpecValue(value)) return false
  return true
}

export function filterSellableSkuAttributes<T extends { name?: string | null; value?: string | null }>(
  attrs?: T[] | null,
): T[] {
  return (Array.isArray(attrs) ? attrs : []).filter((attr) => isSellableSkuAttribute(attr))
}

/** 复制 SKU 时不要把「副本」写进颜色/规格/摘要。 */
export function stripSkuCopyLabel(value?: string | null): string {
  return String(value || '')
    .replace(/\s*副本\d*/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/^\s*\/\s*|\s*\/\s*$/g, '')
    .trim()
}

export function sanitizePendingSkuCopyLabels<T extends {
  spec_text?: string | null
  attributes?: Array<{ name?: string; value?: string }> | null
}>(sku: T): T {
  const attributes = (Array.isArray(sku.attributes) ? sku.attributes : []).map((attr) => {
    const next = stripSkuCopyLabel(attr.value)
    return { ...attr, value: next || String(attr.value || '').replace(/\s*副本\d*/gu, '').trim() }
  })
  const spec_text =
    stripSkuCopyLabel(sku.spec_text) ||
    attributes.map((attr) => attr.value).filter(Boolean).join(' / ')
  return { ...sku, attributes, spec_text }
}

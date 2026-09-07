/**
 * 包 / 饰品 / 鞋 货架隔离：品质标签不得跨一级乱挂
 * （包不能进 high quality jewelry，饰品不能进 High quality bag）。
 */

export type ShelfFamily = 'jewelry' | 'bags' | 'shoes' | 'unknown'

const compact = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-·./&+,|]+/g, '')

const BAG_HINTS = [
  'bags',
  'bag',
  'handbag',
  'backpack',
  'crossbody',
  'tote',
  'clutch',
  'wallet',
  'purse',
  '箱包',
  '包包',
  '手提包',
  '斜挎包',
  '单肩包',
  '腋下包',
  '旅行包',
  '枕头包',
  '双肩包',
  '钱包',
  '挎包',
  '包',
].map(compact)

const JEWELRY_HINTS = [
  'jewelry',
  'jewellery',
  'necklace',
  'earring',
  'bracelet',
  'bangle',
  'ring',
  'anklet',
  'pendant',
  'brooch',
  '饰品',
  '首饰',
  '珠宝',
  '项链',
  '耳环',
  '耳钉',
  '耳饰',
  '手链',
  '手镯',
  '戒指',
  '脚链',
  '吊坠',
  '胸针',
].map(compact)

const SHOE_HINTS = [
  'shoes',
  'shoe',
  'slipper',
  'sandal',
  'boot',
  'sneaker',
  'flat',
  'heel',
  '鞋',
  '拖鞋',
  '凉鞋',
  '靴子',
].map(compact)

const hasHint = (key: string, hints: string[]) =>
  Boolean(key) && hints.some((hint) => hint.length >= 1 && key.includes(hint))

export function detectShelfFamily(...parts: Array<string | null | undefined>): ShelfFamily {
  const key = compact(parts.filter(Boolean).join(' '))
  if (!key) return 'unknown'

  const bags = hasHint(key, BAG_HINTS)
  const jewelry = hasHint(key, JEWELRY_HINTS)
  const shoes = hasHint(key, SHOE_HINTS)

  // 标题同时有「包」和 quality jewelry 后缀时，以商品品类为准：包就是包
  if (bags && !jewelry) return 'bags'
  if (jewelry && !bags) return 'jewelry'
  if (bags && jewelry) return 'bags'
  if (shoes) return 'shoes'
  return 'unknown'
}

export function shelfFamiliesCompatible(
  productFamily: ShelfFamily,
  tagFamily: ShelfFamily,
): boolean {
  if (productFamily === 'unknown' || tagFamily === 'unknown') return true
  return productFamily === tagFamily
}

const JEWELRY_SHELF_NAMES = new Set(['jewelry', 'jewellery', '饰品', '首饰', '珠宝'].map(compact))

const JEWELRY_INTRUDER_HINTS = [
  'keychain',
  'key chain',
  'keyring',
  'key ring',
  '钥匙扣',
  '钥匙链',
  'headband',
  'hairband',
  'hair band',
  'hair hoop',
  'hair clip',
  'hairpin',
  'scrunchie',
  '发箍',
  '发带',
  '发圈',
  '发夹',
  'coin purse',
  'cardholder',
  'card holder',
  'mini bag',
  '小皮包',
  '零钱包',
  '腰带',
  '皮带',
  'belt',
].map(compact)

export function isJewelryShelfName(name?: string | null): boolean {
  const key = compact(name)
  return JEWELRY_SHELF_NAMES.has(key) || key === 'jewlery' || key === 'jewelery'
}

export function productDoesNotBelongOnJewelryShelf(input: {
  name?: string | null
  displayName?: string | null
  shortDescription?: string | null
  categoryName?: string | null
  parentCategoryName?: string | null
  relatedCategoryNames?: Array<string | null | undefined>
}): boolean {
  const primaryFamily = detectShelfFamily(input.categoryName, input.parentCategoryName)
  if (primaryFamily === 'bags' || primaryFamily === 'shoes') return true
  const relatedFamily = detectShelfFamily(...(input.relatedCategoryNames || []))
  if (primaryFamily === 'unknown' && (relatedFamily === 'bags' || relatedFamily === 'shoes')) {
    return true
  }
  return isJewelryShelfIntruder(input.displayName, input.name, input.shortDescription)
}

/** 钥匙扣 / 发箍 / 小皮包 不应出现在 Jewelry 一级列表。 */
export function isJewelryShelfIntruder(...parts: Array<string | null | undefined>): boolean {
  const family = detectShelfFamily(...parts)
  if (family === 'bags' || family === 'shoes') return true
  const key = compact(parts.filter(Boolean).join(' '))
  if (!key) return false
  return JEWELRY_INTRUDER_HINTS.some((hint) => hint.length >= 2 && key.includes(hint))
}

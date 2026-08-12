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

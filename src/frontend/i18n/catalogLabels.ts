import type { TFunction } from 'i18next'
import { translateColorStyleText } from './productSpecTranslate'
import {
  containsChinese,
  fixStorefrontLabelTypos,
  stripChineseFromTitle,
  translateTitleKeywords,
} from '@/shared/productKeywordDictionary'
import { formatPackedNameAndVolume, leftoverIsVolumeOnly } from '@/shared/storefrontLabel'

/** 类目/菜单文案别名 → i18n key */
const CATEGORY_ALIASES: Record<string, string> = {
  'in stock': 'nav.in_stock',
  instock: 'nav.in_stock',
  有货: 'nav.in_stock',
  现货: 'nav.in_stock',
  库存: 'nav.in_stock',
  '每日上新': 'nav.new',
  'daily new': 'nav.new',
  'daily new arrival': 'nav.new',
  'daily new arrivals': 'nav.new',
  newarrival: 'nav.new',
  new: 'nav.new',
  coming: 'nav.coming',
  'coming soon': 'nav.coming',
  即将上新: 'nav.coming',
  jewelry: 'nav.jewelry',
  jewellery: 'nav.jewelry',
  珠宝: 'nav.jewelry',
  首饰: 'nav.jewelry',
  配饰: 'nav.accessories',
  accessories: 'nav.accessories',
  accessory: 'nav.accessories',
  bags: 'nav.bags',
  bag: 'nav.bags',
  包: 'nav.bags',
  箱包: 'nav.bags',
  包包: 'nav.bags',
  化妆品: 'nav.cosmetics',
  cosmetics: 'nav.cosmetics',
  cosmetic: 'nav.cosmetics',
  beauty: 'nav.cosmetics',
  美妆: 'nav.cosmetics',
  鞋子: 'nav.shoes',
  鞋: 'nav.shoes',
  shoes: 'nav.shoes',
  shoe: 'nav.shoes',
  footwear: 'nav.shoes',
  // 首页推荐专区标题（专区 title 本身无多语言字段）
  流行饰品: 'home.zone_popular_jewelry',
  'popular jewelry': 'home.zone_popular_jewelry',
  'popular accessories': 'home.zone_popular_jewelry',
  包包推荐: 'home.zone_bag_picks',
  'bag picks': 'home.zone_bag_picks',
  'bag recommendations': 'home.zone_bag_picks',
  'bags recommend': 'home.zone_bag_picks',
  买家秀: 'home.buyer_show',
  'buyer show': 'home.buyer_show',
  'buyer shows': 'home.buyer_show',
}

/** 颜色名称别名 → i18n key（中英均可命中） */
const COLOR_ALIASES: Record<string, string> = {
  咖啡色: 'color.coffee',
  咖啡: 'color.coffee',
  咖色: 'color.coffee',
  coffee: 'color.coffee',
  'coffee brown': 'color.coffee',
  brown: 'color.coffee',
  土黄色: 'color.khaki',
  土黄: 'color.khaki',
  khaki: 'color.khaki',
  tan: 'color.khaki',
  卡其色: 'color.khaki',
  白色: 'color.white',
  白: 'color.white',
  white: 'color.white',
  红色: 'color.red',
  红: 'color.red',
  red: 'color.red',
  黑色: 'color.black',
  黑: 'color.black',
  black: 'color.black',
  经典黑: 'color.classic_black',
  'classic black': 'color.classic_black',
  复古棕: 'color.vintage_brown',
  'vintage brown': 'color.vintage_brown',
  粉色: 'color.pink',
  pink: 'color.pink',
  蓝色: 'color.blue',
  blue: 'color.blue',
  绿色: 'color.green',
  green: 'color.green',
  黄色: 'color.yellow',
  yellow: 'color.yellow',
  灰色: 'color.gray',
  gray: 'color.gray',
  grey: 'color.gray',
  金色: 'color.gold',
  gold: 'color.gold',
  银色: 'color.silver',
  silver: 'color.silver',
  米色: 'color.beige',
  beige: 'color.beige',
  紫色: 'color.purple',
  purple: 'color.purple',
  橙色: 'color.orange',
  orange: 'color.orange',
  如图所示: 'product.asPictured',
  如图: 'product.asPictured',
  看图: 'product.asPictured',
  见图: 'product.asPictured',
  按图: 'product.asPictured',
}

function lookupAlias(map: Record<string, string>, raw: unknown): string | undefined {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return undefined
  if (map[trimmed]) return map[trimmed]
  const lower = trimmed.toLowerCase()
  if (map[lower]) return map[lower]
  const compact = lower.replace(/\s+/g, ' ')
  return map[compact]
}

function translateByAlias(t: TFunction, map: Record<string, string>, raw?: string | null): string {
  const value = String(raw || '').trim()
  if (!value) return ''
  const key = lookupAlias(map, value)
  if (!key) return value
  const translated = t(key)
  // i18next 缺 key 时通常回传 key 本身
  return translated && translated !== key ? translated : value
}

/** 左侧导航 / 分类菜单名称
 * English storefront shows the admin category name as-is.
 * Aliases only heal Chinese (现货 → In stock) or other locales (Jewelry → Joyería).
 */
export function translateCatalogLabel(t: TFunction, raw?: string | null): string {
  const value = String(raw || '').trim()
  if (!value) return ''
  const fixed = fixStorefrontLabelTypos(value)
  const locale = String((t as { language?: string }).language || '').toLowerCase()
  if (locale.startsWith('en') && !containsChinese(fixed)) {
    return fixed
  }
  const viaAlias = translateByAlias(t, CATEGORY_ALIASES, fixed)
  if (!viaAlias) return ''
  if (!containsChinese(viaAlias)) return viaAlias
  const healed = translateTitleKeywords(viaAlias, 'en') || ''
  const clean = String(healed || viaAlias).replace(/\s+/g, ' ').trim()
  return clean || viaAlias
}

const PACKAGING_SUFFIX_RE =
  /(?:\+|\/|,|，|-)?\s*(?:gift\s*bags?|gift\s*box(?:es)?|giftbox|airplane\s*box|ship\s*box|飞机盒|快递盒|包装盒|礼品袋|礼袋|礼盒|纸盒|盒子|box)\s*[)）]?\s*$/i

function stripPackagingTail(raw: string): string {
  let value = String(raw || '').trim()
  for (let i = 0; i < 6; i += 1) {
    const next = value
      .replace(PACKAGING_SUFFIX_RE, '')
      .replace(/[（(]\s*[,，]?\s*$/g, '')
      .replace(/[,，;；|／/.+\s]+$/g, '')
      .trim()
    if (next === value) break
    value = next
  }
  return value
}

/** Strip 1688 leftover wrappers like `（ ，Gift Bag）` so swatches show a real color. */
export function sanitizeStorefrontColorLabel(
  raw?: string | null,
  opts?: { keepPackaging?: boolean },
): string {
  let value = String(raw || '')
    .normalize('NFKC')
    .trim()
  if (!value) return ''

  if (!opts?.keepPackaging) {
    value = value.replace(/[（(]([^）)]*)[）)]/g, (_, inner: string) => {
      const cleaned = stripPackagingTail(inner)
      return cleaned ? ` ${cleaned} ` : ''
    })
    value = stripPackagingTail(value)
  }

  value = value
    .replace(/^[`'""''「」]+|[`'""''「」]+$/g, '')
    .replace(/^[（(]\s*([^）)]*?)\s*[）)]$/g, '$1')
    .replace(/[（(]\s*[,，]\s*[）)]/g, '')
    .replace(/^[（(\s]+|[）)\s]+$/g, '')
    .replace(/^[,，;；|／/.\s]+|[,，;；|／/.\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!value || /^[,，;；.。·\-—–_|／/]+$/.test(value)) return ''
  if (/^(option|color|colour|n\/a|none|default|null|undefined)$/i.test(value)) return ''
  if (!opts?.keepPackaging) {
    if (/^(gift\s*bags?|gift\s*box(?:es)?|giftbox|airplane\s*box|ship\s*box)$/i.test(value)) return ''
    const compact = value.replace(/[\s（）()，,、；;·\-—–_|／/]/g, '')
    if (!compact || /^(giftbags?|giftbox(?:es)?|box)$/i.test(compact)) return ''
  }
  return value
}

const PIECE_SET_NUM: Record<string, string> = {
  一: '1',
  二: '2',
  三: '3',
  四: '4',
  五: '5',
  六: '6',
  七: '7',
  八: '8',
  九: '9',
  十: '10',
}

function translatePieceSetFallback(raw: string): string {
  const matched = String(raw || '').match(/([一二三四五六七八九十\d]+)\s*件套/)
  if (!matched) return ''
  const count = PIECE_SET_NUM[matched[1]] || matched[1]
  return `${count}-piece set`
}

/** 商品颜色规格名称 */
export function translateColorName(t: TFunction, raw?: string | null): string {
  const value = sanitizeStorefrontColorLabel(raw)
  if (!value) {
    const packagingOnly = translateColorStyleText(String(raw || '').trim(), t)
    const keptPackaging = sanitizeStorefrontColorLabel(packagingOnly, { keepPackaging: true })
    if (keptPackaging && !containsChinese(keptPackaging)) return keptPackaging
    const pieceSet = translatePieceSetFallback(String(raw || ''))
    if (pieceSet) return pieceSet
    const option = t('product.optionFallback')
    return option && option !== 'product.optionFallback' ? option : 'Option'
  }

  const normalizeColorKey = (input: string) =>
    input
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, '')
      .replace(/[＋﹢]/g, '+')

  // 1) Dedicated color word map from locale JSON (e.g. EN only). When absent, i18next returns a string.
  const dict = t('color.wordMap', { returnObjects: true }) as unknown
  if (dict && typeof dict === 'object') {
    const record = dict as Record<string, unknown>
    const direct = record[value]
    const directTranslated = typeof direct === 'string' ? direct.trim() : ''
    if (directTranslated && !containsChinese(directTranslated)) return directTranslated

    // Force match with normalization: handle whitespace/fullwidth plus variants.
    const target = normalizeColorKey(value)
    if (target) {
      for (const [k, v] of Object.entries(record)) {
        if (!k) continue
        if (normalizeColorKey(k) !== target) continue
        const translated = typeof v === 'string' ? v.trim() : ''
        if (translated && !containsChinese(translated)) return translated
      }
    }
  }

  // 2) Basic aliases (black/white/coffee/khaki...).
  const aliased = translateByAlias(t, COLOR_ALIASES, value)
  if (aliased && aliased !== value) return aliased

  // 3) Compound values (e.g. 豆沙色+礼盒 / 卡其色白+飞机盒): translate known CN tokens.
  //    Do not strip leftover Chinese — that collapses 雾暖茶香125ml to 125ml.
  const translated = translateColorStyleText(value, t)
  const cleanedTranslated = sanitizeStorefrontColorLabel(translated) || translated
  if (cleanedTranslated && !containsChinese(cleanedTranslated) && !leftoverIsVolumeOnly(cleanedTranslated)) {
    return cleanedTranslated
  }
  if (cleanedTranslated && !containsChinese(cleanedTranslated) && !containsChinese(value)) {
    return cleanedTranslated
  }
  if (/如图|看图|见图|按图/.test(value)) {
    const pictured = t('product.asPictured')
    return pictured && pictured !== 'product.asPictured' ? pictured : 'As pictured'
  }
  const packagingOnly = translateColorStyleText(String(raw || '').trim(), t)
  const keptPackaging = sanitizeStorefrontColorLabel(packagingOnly, { keepPackaging: true })
  if (keptPackaging && !containsChinese(keptPackaging) && !leftoverIsVolumeOnly(keptPackaging)) {
    return keptPackaging
  }
  const pieceSet = translatePieceSetFallback(String(raw || ''))
  if (pieceSet) return pieceSet
  const locale = String((t as { language?: string }).language || '').toLowerCase()
  if (!locale.startsWith('zh')) {
    const stripped = stripChineseFromTitle(cleanedTranslated || translated || '')
      .replace(/[-–—]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (stripped && !leftoverIsVolumeOnly(stripped)) return stripped
    const colorNum = value.match(/颜色\s*(\d+)/)
    if (colorNum) return `Color ${colorNum[1]}`
    const option = t('product.optionFallback')
    return option && option !== 'product.optionFallback' ? option : 'Option'
  }
  if (cleanedTranslated && !leftoverIsVolumeOnly(cleanedTranslated)) return cleanedTranslated
  if (containsChinese(value)) return formatPackedNameAndVolume(value)
  const option = t('product.optionFallback')
  return option && option !== 'product.optionFallback' ? option : 'Option'
}

/**
 * Translate an arbitrary product attribute VALUE (size / spec / model label).
 * Shares the same compound CN→locale keyword logic as color values, so web and
 * mobile H5 render identical translations. Numeric sizes (35 / 均码 → One Size)
 * pass through the dictionary; leftover CJK is stripped for EN/ES.
 */
export function translateAttributeValue(t: TFunction, raw?: string | null): string {
  const value = String(raw || '').trim()
  if (!value) return ''
  // Keep 盒 / 礼盒 / 件套 — they distinguish SKUs. Do not reuse translateColorName
  // first: it strips packaging tails and collapses 红盒 / 红色 into the same "Red".
  let translated = translateColorStyleText(value, t) || value
  // 35码 / 36.5码 → 35 / 36.5 so size rows never keep a trailing 码.
  translated = translated.replace(/(\d+(?:\.\d+)?)\s*码/g, '$1')
  translated = translated
    .replace(/(^|[,/+\s])配(?=\s|[A-Za-z\u4e00-\u9fff])/g, '$1With ')
    .replace(/^配\s*/, 'With ')
    .replace(/\s*\+\s*/g, ' + ')
  translated = translated.replace(/\s+/g, ' ').trim()
  const cleaned = sanitizeStorefrontColorLabel(translated, { keepPackaging: true })
  if (cleaned && !containsChinese(cleaned) && !leftoverIsVolumeOnly(cleaned)) return cleaned
  if (cleaned && !containsChinese(cleaned) && !containsChinese(value)) return cleaned
  const pieceSet = translatePieceSetFallback(value)
  if (pieceSet) return pieceSet
  const asColor = translateColorName(t, value)
  if (asColor && !/^(option|product\.optionFallback)$/i.test(asColor) && !containsChinese(asColor)) return asColor
  const locale = String((t as { language?: string }).language || '').toLowerCase()
  if (!locale.startsWith('zh')) {
    const stripped = stripChineseFromTitle(cleaned || translated || '')
      .replace(/[-–—]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (stripped && !leftoverIsVolumeOnly(stripped)) return stripped
    const colorNum = value.match(/颜色\s*(\d+)/)
    if (colorNum) return `Color ${colorNum[1]}`
    return 'Option'
  }
  if (cleaned && !leftoverIsVolumeOnly(cleaned)) return cleaned
  if (containsChinese(value)) return formatPackedNameAndVolume(value)
  return cleaned || 'Option'
}

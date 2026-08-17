import type { TFunction } from 'i18next'
import { translateColorStyleText } from './productSpecTranslate'
import {
  containsChinese,
  stripChineseFromTitle,
  translateTitleKeywords,
} from '@/shared/productKeywordDictionary'

/** 类目/菜单文案别名 → i18n key */
const CATEGORY_ALIASES: Record<string, string> = {
  'in stock': 'nav.in_stock',
  instock: 'nav.in_stock',
  有货: 'nav.in_stock',
  现货: 'nav.in_stock',
  库存: 'nav.in_stock',
  '每日上新': 'nav.daily_new',
  'daily new': 'nav.daily_new',
  'daily new arrival': 'nav.daily_new',
  'daily new arrivals': 'nav.daily_new',
  newarrival: 'nav.daily_new',
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
 * 优先展示接口已按 lang 本地化的名称；仅对少数固定别名再套一层 i18n。
 * 无匹配且仍含中文时：关键词英化 / 剥离 CJK，避免店面露出中文。
 */
export function translateCatalogLabel(t: TFunction, raw?: string | null): string {
  const viaAlias = translateByAlias(t, CATEGORY_ALIASES, raw)
  if (!viaAlias) return ''
  if (!containsChinese(viaAlias)) return viaAlias
  const healed = translateTitleKeywords(viaAlias, 'en') || ''
  const clean = stripChineseFromTitle(healed || viaAlias).replace(/\s+/g, ' ').trim()
  return clean || 'Category'
}

/** 商品颜色规格名称 */
export function translateColorName(t: TFunction, raw?: string | null): string {
  const value = String(raw || '').trim()
  if (!value) return ''

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
    if (directTranslated) return directTranslated

    // Force match with normalization: handle whitespace/fullwidth plus variants.
    const target = normalizeColorKey(value)
    if (target) {
      for (const [k, v] of Object.entries(record)) {
        if (!k) continue
        if (normalizeColorKey(k) !== target) continue
        const translated = typeof v === 'string' ? v.trim() : ''
        if (translated) return translated
      }
    }
  }

  // 2) Basic aliases (black/white/coffee/khaki...).
  const aliased = translateByAlias(t, COLOR_ALIASES, value)
  if (aliased && aliased !== value) return aliased

  // 3) Compound values (e.g. 豆沙色+礼盒 / 卡其色白+飞机盒): translate each known
  //    CN token via the shared keyword dictionary + locale overrides, keep the
  //    separators, and leave any unknown fragment as-is (never blank).
  return translateColorStyleText(value, t)
}

/**
 * Translate an arbitrary product attribute VALUE (size / spec / model label).
 * Shares the same compound CN→locale keyword logic as color values, so web and
 * mobile H5 render identical translations. Numeric sizes (35 / 均码 → One Size)
 * pass through the dictionary; unknown fragments stay untouched.
 */
export function translateAttributeValue(t: TFunction, raw?: string | null): string {
  const value = String(raw || '').trim()
  if (!value) return ''
  // Reuse the color-value path first (color.wordMap + aliases), then compounds.
  const asColor = translateColorName(t, value)
  let translated = asColor || value
  // 35码 / 36.5码 → 35 / 36.5 so size rows never keep a trailing 码.
  translated = translated.replace(/(\d+(?:\.\d+)?)\s*码/g, '$1')
  translated = translated
    .replace(/(^|[,/+\s])配(?=\s|[A-Za-z\u4e00-\u9fff])/g, '$1With ')
    .replace(/^配\s*/, 'With ')
    .replace(/\s*\+\s*/g, ' + ')
  return translated.replace(/\s+/g, ' ').trim()
}

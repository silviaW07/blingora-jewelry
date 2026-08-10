/**
 * 商品重量自动识别（前后端共享）。
 *
 * 策略（优先级从高到低）：
 *  1) 数据源已显式给出重量（表格/OneBound）→ 直接采用；
 *  2) 从标题/规格/详情文本正则提取（如 “500g / 0.5kg / 250克 / 1斤”）；
 *  3) 按商品「二级分类」兜底默认重量（下表，含中英文类目名）；
 *  4) 最终兜底 500g。
 *
 * 单位：克(g)。运营在「待上传区」仍可双击逐条覆盖。
 */
import { resolveCategorySynonyms } from '@/shared/categorySynonyms'

export const CATEGORY_DEFAULT_WEIGHT_GRAMS: Record<string, number> = {
  // 珠宝 / Jewelry（中英都要能命中：后台类目多为 Necklace/earrings）
  '耳环': 20,
  '耳钉': 20,
  '耳饰': 20,
  earring: 20,
  earrings: 20,
  earing: 20,
  '项链': 40,
  necklace: 40,
  necklaces: 40,
  '手链': 30,
  bracelet: 30,
  bracelets: 30,
  '手镯': 30,
  bangle: 30,
  bangles: 30,
  '戒指': 15,
  ring: 15,
  rings: 15,
  '脚链': 20,
  anklet: 20,
  anklets: 20,
  '胸针': 25,
  brooch: 25,
  brooches: 25,
  '吊坠': 25,
  pendant: 25,
  pendants: 25,
  // 发饰 / 珠宝套装
  '发夹': 20,
  '发绳': 20,
  '发带': 80,
  '珠宝套装': 80,
  '首饰套装': 80,
  'jewelry set': 80,
  'jewellery set': 80,
  jewelryset: 80,
  jewelleryset: 80,
  'earrings set': 80,
  'earring set': 80,
  'necklace set': 80,
  // 鞋靴
  '平底鞋': 1500,
  flats: 1500,
  '拖鞋': 1200,
  slippers: 1200,
  '凉鞋': 1200,
  sandals: 1200,
  '运动鞋': 2500,
  sneakers: 2500,
  '靴子': 2800,
  boots: 2800,
  // 美妆 / 香氛
  '口红': 60,
  lipstick: 60,
  '香水': 650,
  perfume: 650,
  '香水套装': 1200,
  'perfume set': 1200,
  // 配件
  '皮带': 250,
  belt: 250,
  belts: 250,
  '眼镜': 80,
  glasses: 80,
  sunglasses: 80,
  '手表': 180,
  watch: 180,
  watches: 180,
  '手机壳': 60,
  'phone case': 60,
  phonecase: 60,
  '钥匙扣': 120,
  keychain: 120,
  '表带': 40,
  'watch band': 40,
  // 服饰 / 服饰配件
  '帽子': 450,
  hat: 450,
  hats: 450,
  '围巾': 650,
  scarf: 650,
  '手套': 120,
  gloves: 120,
  '上衣': 450,
  top: 450,
  tops: 450,
  '裤子': 650,
  pants: 650,
  '裙子': 650,
  skirt: 650,
  dress: 650,
  // 内衣 / 运动
  '内衣': 100,
  underwear: 100,
  '袜子': 150,
  socks: 150,
  '泳衣': 150,
  swimwear: 150,
  '瑜伽服': 500,
  yoga: 500,
  '套装': 850,
  // 箱包
  '手提包': 700,
  handbag: 700,
  handbags: 700,
  tote: 700,
  '背包': 1500,
  backpack: 1500,
  '钱包': 350,
  wallet: 350,
  '化妆包': 650,
  'cosmetic bag': 650,
}

/** 无法识别且无分类兜底时的最终默认重量（克） */
export const FINAL_FALLBACK_WEIGHT_GRAMS = 500

const WEIGHT_MIN_GRAMS = 1
const WEIGHT_MAX_GRAMS = 200000 // 200kg 上限，过滤明显异常数值

const normalizeWeightKey = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

/** 分类键按长度降序，includes 兜底时优先命中更长（更具体）的类目名，如“珠宝套装”优先于“套装” */
const CATEGORY_KEYS_BY_LENGTH_DESC = Object.keys(CATEGORY_DEFAULT_WEIGHT_GRAMS).sort(
  (a, b) => b.length - a.length,
)

const CATEGORY_WEIGHT_BY_NORMALIZED = (() => {
  const map = new Map<string, number>()
  for (const [key, grams] of Object.entries(CATEGORY_DEFAULT_WEIGHT_GRAMS)) {
    map.set(normalizeWeightKey(key), grams)
    map.set(normalizeWeightKey(key).replace(/\s+/g, ''), grams)
  }
  return map
})()

function clampGrams(value: number): number | null {
  if (!Number.isFinite(value)) return null
  const rounded = Math.round(value)
  if (rounded < WEIGHT_MIN_GRAMS || rounded > WEIGHT_MAX_GRAMS) return null
  return rounded
}

/**
 * 从任意文本中提取重量（克）。仅识别明确的重量单位，避免误吞尺码/毫升/内存等数字。
 * 支持：kg / 千克 / 公斤 / 斤 / g / 克（大小写不敏感）。
 */
export function extractWeightGramsFromText(text?: string | null): number | null {
  if (!text) return null
  const s = String(text)

  // kg / 千克 / 公斤
  const kg = s.match(/(\d+(?:\.\d+)?)\s*(?:kg|千克|公斤)/i)
  if (kg) {
    const grams = clampGrams(parseFloat(kg[1]) * 1000)
    if (grams != null) return grams
  }

  // 斤（1 斤 = 500g）
  const jin = s.match(/(\d+(?:\.\d+)?)\s*斤/)
  if (jin) {
    const grams = clampGrams(parseFloat(jin[1]) * 500)
    if (grams != null) return grams
  }

  // g / 克（'g' 前必须紧跟数字，避免 mg / kg 误命中；kg 已在上面优先处理）
  const g = s.match(/(\d+(?:\.\d+)?)\s*(?:g|克)(?![a-zA-Z])/i)
  if (g) {
    const grams = clampGrams(parseFloat(g[1]))
    if (grams != null) return grams
  }

  return null
}

/** 单个二级分类名 → 默认重量；精确 / 大小写不敏感 / 包含 / 同义词 */
export function resolveCategoryDefaultWeightGrams(categoryName?: string | null): number | null {
  if (!categoryName) return null
  const name = String(categoryName).trim()
  if (!name) return null

  if (CATEGORY_DEFAULT_WEIGHT_GRAMS[name] != null) return CATEGORY_DEFAULT_WEIGHT_GRAMS[name]

  const normalized = normalizeWeightKey(name)
  const compact = normalized.replace(/\s+/g, '')
  const byNormalized = CATEGORY_WEIGHT_BY_NORMALIZED.get(normalized) ?? CATEGORY_WEIGHT_BY_NORMALIZED.get(compact)
  if (byNormalized != null) return byNormalized

  for (const key of CATEGORY_KEYS_BY_LENGTH_DESC) {
    const keyNorm = normalizeWeightKey(key)
    if (name.includes(key) || normalized.includes(keyNorm) || compact.includes(keyNorm.replace(/\s+/g, ''))) {
      return CATEGORY_DEFAULT_WEIGHT_GRAMS[key]
    }
  }

  // Necklace → 同义词含「项链」→ 走中文重量表
  for (const syn of resolveCategorySynonyms(name)) {
    const synGrams =
      CATEGORY_DEFAULT_WEIGHT_GRAMS[syn] ??
      CATEGORY_WEIGHT_BY_NORMALIZED.get(normalizeWeightKey(syn))
    if (synGrams != null) return synGrams
  }

  return null
}

/** 多个候选分类名（如匹配到的二级类目 + 源站类目）依次尝试，取第一个命中的默认重量 */
export function resolveCategoryDefaultWeightGramsFromNames(
  names?: Array<string | null | undefined> | null,
): number | null {
  if (!names || names.length === 0) return null
  // 更具体的类目名优先（jewelry set > necklace）
  const ordered = [...names]
    .map(n => String(n || '').trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  for (const n of ordered) {
    const grams = resolveCategoryDefaultWeightGrams(n)
    if (grams != null) return grams
  }
  return null
}

/**
 * 综合解析商品重量（克）。返回值必定有效（最终兜底 500）。
 * @param explicit    数据源显式重量（优先级最高）；一键校准时请勿把「历史 500 / 1g 脏数据」当 explicit
 * @param text        标题/规格/详情等可提取文本
 * @param categoryNames 候选二级分类名（用于兜底）
 */
export function resolveProductWeightGrams(input: {
  explicit?: number | null
  text?: string | null
  categoryNames?: Array<string | null | undefined> | null
}): number {
  const fromCategory = resolveCategoryDefaultWeightGramsFromNames(input.categoryNames)

  const trustOrNull = (value: number | null): number | null => {
    if (value == null) return null
    if (!isLikelyUnreliableWeightGrams(value)) return value
    // 有更合理的类目默认时，丢弃 1g / 500 等不可信值
    if (fromCategory != null && fromCategory > value) return null
    // 无类目时：1g 仍不可信（常为金重文案/0.001kg），继续往下兜底
    if (Math.round(value) <= 1) return null
    return value
  }

  const explicit =
    typeof input.explicit === 'number' && Number.isFinite(input.explicit) && input.explicit > 0
      ? Math.round(input.explicit)
      : null
  const trustedExplicit = trustOrNull(explicit)
  if (trustedExplicit != null) return trustedExplicit

  const trustedText = trustOrNull(extractWeightGramsFromText(input.text))
  if (trustedText != null) return trustedText

  if (fromCategory != null) return fromCategory

  return FINAL_FALLBACK_WEIGHT_GRAMS
}

/** 是否像「未能识别时的 500g 兜底」——一键校准遇到时应允许按类目重算 */
export function isLikelyFallbackWeightGrams(value?: number | null): boolean {
  return typeof value === 'number' && Number.isFinite(value) && Math.round(value) === FINAL_FALLBACK_WEIGHT_GRAMS
}

/**
 * 疑似误识别/脏重量：500g 兜底，或钳位下限 1g。
 * 1g 常见来源：详情「约1克」金重文案、0.001kg、表格脏数据；不应盖住类目默认（如项链 40g）。
 */
export function isLikelyUnreliableWeightGrams(value?: number | null): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  const g = Math.round(value)
  return g <= 1 || g === FINAL_FALLBACK_WEIGHT_GRAMS
}

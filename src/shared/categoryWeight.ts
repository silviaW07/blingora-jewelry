/**
 * 商品重量自动识别（前后端共享）。
 *
 * 策略（优先级从高到低）：
 *  1) 数据源已显式给出重量（表格/OneBound）→ 直接采用；
 *  2) 从标题/规格/详情文本正则提取（如 “500g / 0.5kg / 250克 / 1斤”）；
 *  3) 按商品「二级分类」兜底默认重量（下表）；
 *  4) 最终兜底 500g。
 *
 * 单位：克(g)。运营在「待上传区」仍可双击逐条覆盖。
 * 组合类目（发夹&发绳 / 拖鞋&凉鞋 / 裤子&裙子）已拆分为独立分类并赋同一重量。
 * 带 * 的为估值，同样作为默认使用。
 */
export const CATEGORY_DEFAULT_WEIGHT_GRAMS: Record<string, number> = {
  // 珠宝
  '耳环': 20,
  '项链': 40,
  '手链': 30,
  '戒指': 15,
  // 发饰 / 珠宝套装
  '发夹': 20,
  '发绳': 20,
  '发带': 80,
  '珠宝套装': 80,
  // 鞋靴
  '平底鞋': 1500,
  '拖鞋': 1200,
  '凉鞋': 1200,
  '运动鞋': 2500,
  '靴子': 2800,
  // 美妆 / 香氛
  '口红': 60,
  '香水': 650,
  '香水套装': 1200,
  // 配件
  '皮带': 250,
  '眼镜': 80,
  '手表': 180,
  '手机壳': 60,
  '钥匙扣': 120,
  '表带': 40,
  // 服饰 / 服饰配件
  '帽子': 450,
  '围巾': 650,
  '手套': 120,
  '上衣': 450,
  '裤子': 650,
  '裙子': 650,
  // 内衣 / 运动
  '内衣': 100,
  '袜子': 150,
  '泳衣': 150,
  '瑜伽服': 500,
  '套装': 850,
  // 箱包
  '手提包': 700,
  '背包': 1500,
  '钱包': 350,
  '化妆包': 650,
}

/** 无法识别且无分类兜底时的最终默认重量（克） */
export const FINAL_FALLBACK_WEIGHT_GRAMS = 500

const WEIGHT_MIN_GRAMS = 1
const WEIGHT_MAX_GRAMS = 200000 // 200kg 上限，过滤明显异常数值

/** 分类键按长度降序，includes 兜底时优先命中更长（更具体）的类目名，如“珠宝套装”优先于“套装” */
const CATEGORY_KEYS_BY_LENGTH_DESC = Object.keys(CATEGORY_DEFAULT_WEIGHT_GRAMS).sort(
  (a, b) => b.length - a.length,
)

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

/** 单个二级分类名 → 默认重量；先精确匹配，再按最长包含匹配（兼容“男士皮带/时尚耳环”等带修饰名） */
export function resolveCategoryDefaultWeightGrams(categoryName?: string | null): number | null {
  if (!categoryName) return null
  const name = String(categoryName).trim()
  if (!name) return null
  if (CATEGORY_DEFAULT_WEIGHT_GRAMS[name] != null) return CATEGORY_DEFAULT_WEIGHT_GRAMS[name]
  for (const key of CATEGORY_KEYS_BY_LENGTH_DESC) {
    if (name.includes(key)) return CATEGORY_DEFAULT_WEIGHT_GRAMS[key]
  }
  return null
}

/** 多个候选分类名（如匹配到的二级类目 + 源站类目）依次尝试，取第一个命中的默认重量 */
export function resolveCategoryDefaultWeightGramsFromNames(
  names?: Array<string | null | undefined> | null,
): number | null {
  if (!names || names.length === 0) return null
  for (const n of names) {
    const grams = resolveCategoryDefaultWeightGrams(n)
    if (grams != null) return grams
  }
  return null
}

/**
 * 综合解析商品重量（克）。返回值必定有效（最终兜底 500）。
 * @param explicit    数据源显式重量（优先级最高）
 * @param text        标题/规格/详情等可提取文本
 * @param categoryNames 候选二级分类名（用于兜底）
 */
export function resolveProductWeightGrams(input: {
  explicit?: number | null
  text?: string | null
  categoryNames?: Array<string | null | undefined> | null
}): number {
  const explicit =
    typeof input.explicit === 'number' && Number.isFinite(input.explicit) && input.explicit > 0
      ? Math.round(input.explicit)
      : null
  if (explicit != null) return explicit

  const fromText = extractWeightGramsFromText(input.text)
  if (fromText != null) return fromText

  const fromCategory = resolveCategoryDefaultWeightGramsFromNames(input.categoryNames)
  if (fromCategory != null) return fromCategory

  return FINAL_FALLBACK_WEIGHT_GRAMS
}

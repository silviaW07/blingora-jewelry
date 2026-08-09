/**
 * Auto-bind price-threshold L2 categories onto products via product_category_relations.
 * Never changes product.categoryId / brandCategoryId (primary shelf stays intact).
 *
 * Admin already created the L2 shelves — we only resolve them by name:
 * - L1 Bags (包) + min sell USD <= 13 → existing L2 "below13 usd"
 * - L1 Jewelry/饰品 + min sell USD <= 3 → existing L2 "below3 usd"
 */
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'

export const BELOW13_USD_CATEGORY_NAME = 'below13 usd'
export const BELOW3_USD_CATEGORY_NAME = 'below3 usd'

export type PriceThresholdRuleKey = 'bags_below13' | 'jewelry_below3'

export interface PriceThresholdRule {
  key: PriceThresholdRuleKey
  /** Match ACTIVE L1 category name/slug (case-insensitive) */
  l1Aliases: string[]
  /** Exact-ish match against existing L2 category.name / slug */
  l2NameAliases: string[]
  maxUsd: number
}

export const PRICE_THRESHOLD_RULES: PriceThresholdRule[] = [
  {
    key: 'bags_below13',
    l1Aliases: ['bags', 'bag', '包', '箱包', '包包'],
    l2NameAliases: ['below13 usd', 'below13usd', 'below13-usd', 'below 13 usd'],
    maxUsd: 13,
  },
  {
    key: 'jewelry_below3',
    l1Aliases: ['jewelry', 'jewellery', '饰品', '首饰', 'accessories', 'accessory', '配件'],
    l2NameAliases: ['below3 usd', 'below3usd', 'below3-usd', 'below 3 usd'],
    maxUsd: 3,
  },
]

export interface ResolvedPriceThresholdCategory {
  key: PriceThresholdRuleKey
  parentId: string
  parentName: string
  categoryId: string
  categoryName: string
  maxUsd: number
}

/** @deprecated use ResolvedPriceThresholdCategory */
export type EnsuredPriceThresholdCategory = ResolvedPriceThresholdCategory

type DbLike = {
  category: {
    findMany: (args: any) => Promise<any[]>
    findFirst: (args: any) => Promise<any | null>
  }
  product: {
    findUnique: (args: any) => Promise<any | null>
    findMany: (args: any) => Promise<any[]>
  }
  product_category_relations: {
    deleteMany: (args: any) => Promise<any>
    createMany: (args: any) => Promise<any>
  }
}

type CategoryNode = {
  id: string
  name: string
  slug?: string | null
  level: number
  parentId?: string | null
  status?: string | null
  parent?: { id: string; name: string } | null
}

function normalizeCatKey(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s/_-]+/g, '')
}

function matchesAlias(nameOrSlug: string | null | undefined, aliases: string[]): boolean {
  const key = normalizeCatKey(nameOrSlug)
  if (!key) return false
  return aliases.some((alias) => {
    const a = normalizeCatKey(alias)
    return !!a && key === a
  })
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof (value as { toNumber?: () => number })?.toNumber === 'function') {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function resolveL1Id(
  categoryId: string | null | undefined,
  categoryMap: Map<string, CategoryNode>,
): string | null {
  let current = categoryId ? categoryMap.get(categoryId) : null
  let guard = 0
  while (current && guard++ < 8) {
    if (current.level === 1 || !current.parentId) return current.id
    current = categoryMap.get(current.parentId) || null
  }
  return null
}

/** Product belongs to an L1 shelf if primary or any linked category resolves under that L1. */
export function productBelongsToL1(
  product: {
    categoryId: string
    relationCategoryIds?: string[]
  },
  l1Id: string,
  categoryMap: Map<string, CategoryNode>,
): boolean {
  const ids = [product.categoryId, ...(product.relationCategoryIds || [])].filter(Boolean)
  for (const id of ids) {
    if (resolveL1Id(id, categoryMap) === l1Id) return true
  }
  return false
}

export function resolveProductMinUsdPrice(
  product: {
    skus?: Array<{ price?: unknown }>
    costPrice?: unknown
    priceCoefficient?: unknown
  },
  usdExchangeRate: number,
): number | null {
  const skuPrices = (product.skus || [])
    .map((sku) => toNumber(sku.price))
    .filter((n): n is number => n !== null && n >= 0)
  let minRmb: number | null = null
  if (skuPrices.length > 0) {
    minRmb = Math.min(...skuPrices)
  } else {
    const cost = toNumber(product.costPrice)
    const coeff = toNumber(product.priceCoefficient) ?? 2
    if (cost !== null && cost >= 0) minRmb = cost * coeff
  }
  if (minRmb === null) return null
  return toUsdFromCny(minRmb, usdExchangeRate)
}

/**
 * Look up existing L2 shelves by name only (no create).
 * Parent L1 = that L2's parentId (admin already placed them under 包 / 饰品).
 */
export async function resolvePriceThresholdCategories(
  db: DbLike,
): Promise<ResolvedPriceThresholdCategory[]> {
  const l2Candidates = (await db.category.findMany({
    where: { level: 2, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      parent: { select: { id: true, name: true } },
    },
  })) as Array<
    CategoryNode & {
      parent?: { id: string; name: string } | null
    }
  >

  const resolved: ResolvedPriceThresholdCategory[] = []

  for (const rule of PRICE_THRESHOLD_RULES) {
    const child = l2Candidates.find(
      (cat) =>
        // 仅按名称/别名匹配：归一化已包容大小写与空格/分隔符差异，不做拼写模糊
        matchesAlias(cat.name, rule.l2NameAliases) ||
        matchesAlias(cat.slug, rule.l2NameAliases),
    )
    if (!child?.parentId) continue

    resolved.push({
      key: rule.key,
      parentId: child.parentId,
      parentName: child.parent?.name || '',
      categoryId: child.id,
      categoryName: child.name,
      maxUsd: rule.maxUsd,
    })
  }

  return resolved
}

/** @deprecated alias — categories must already exist in admin */
export const ensurePriceThresholdCategories = resolvePriceThresholdCategories

async function loadCategoryMap(db: DbLike): Promise<Map<string, CategoryNode>> {
  const rows = (await db.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      parentId: true,
      status: true,
    },
  })) as CategoryNode[]
  return new Map(rows.map((row) => [row.id, row]))
}

export interface SyncPriceThresholdResult {
  productId: string
  minUsd: number | null
  addedCategoryIds: string[]
  removedCategoryIds: string[]
  matchedKeys: PriceThresholdRuleKey[]
}

/**
 * Append/prune only the threshold L2 relation rows. Primary + brand fields untouched.
 */
export async function syncProductPriceThresholdRelations(
  db: DbLike,
  productId: string,
  options?: {
    usdExchangeRate?: number
    ensured?: ResolvedPriceThresholdCategory[]
    categoryMap?: Map<string, CategoryNode>
  },
): Promise<SyncPriceThresholdResult> {
  const ensured = options?.ensured ?? (await resolvePriceThresholdCategories(db))
  const thresholdIds = ensured.map((item) => item.categoryId)
  const empty: SyncPriceThresholdResult = {
    productId,
    minUsd: null,
    addedCategoryIds: [],
    removedCategoryIds: [],
    matchedKeys: [],
  }
  if (!thresholdIds.length) return empty

  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      categoryId: true,
      costPrice: true,
      priceCoefficient: true,
      skus: { select: { price: true } },
      relationCategories: { select: { categoryId: true } },
    },
  })
  if (!product) return empty

  const categoryMap = options?.categoryMap ?? (await loadCategoryMap(db))
  const usdExchangeRate =
    options?.usdExchangeRate ?? (await getUsdExchangeRate(db as any))
  const minUsd = resolveProductMinUsdPrice(product, usdExchangeRate)
  const relationCategoryIds = (product.relationCategories || []).map(
    (rel: { categoryId: string }) => rel.categoryId,
  )

  const shouldHaveIds: string[] = []
  const matchedKeys: PriceThresholdRuleKey[] = []
  if (minUsd !== null) {
    for (const rule of ensured) {
      const belongs = productBelongsToL1(
        { categoryId: product.categoryId, relationCategoryIds },
        rule.parentId,
        categoryMap,
      )
      if (belongs && minUsd <= rule.maxUsd) {
        shouldHaveIds.push(rule.categoryId)
        matchedKeys.push(rule.key)
      }
    }
  }

  const existingThreshold = relationCategoryIds.filter((id: string) =>
    thresholdIds.includes(id),
  )
  const toAdd = shouldHaveIds.filter((id) => !existingThreshold.includes(id))
  const toRemove = existingThreshold.filter((id: string) => !shouldHaveIds.includes(id))

  if (toRemove.length > 0) {
    await db.product_category_relations.deleteMany({
      where: {
        productId,
        categoryId: { in: toRemove },
      },
    })
  }
  if (toAdd.length > 0) {
    await db.product_category_relations.createMany({
      data: toAdd.map((categoryId) => ({
        productId,
        categoryId,
      })),
      skipDuplicates: true,
    })
  }

  return {
    productId,
    minUsd,
    addedCategoryIds: toAdd,
    removedCategoryIds: toRemove,
    matchedKeys,
  }
}

export interface AutoClassifyPriceThresholdSummary {
  scanned: number
  bound: number
  unbound: number
  skipped: number
  failed: number
  resolvedCategories: Array<{
    key: PriceThresholdRuleKey
    parent_name: string
    category_id: string
    category_name: string
    max_usd: number
  }>
  missing_targets: string[]
}

/** One-shot scan of catalog products; bind/unbind threshold L2 relations only. */
export async function autoClassifyAllProductsByPriceThreshold(
  db: DbLike,
): Promise<AutoClassifyPriceThresholdSummary> {
  const ensured = await resolvePriceThresholdCategories(db)
  const missingTargets = PRICE_THRESHOLD_RULES.filter(
    (rule) => !ensured.some((item) => item.key === rule.key),
  ).map((rule) => rule.l2NameAliases[0])

  const categoryMap = await loadCategoryMap(db)
  const usdExchangeRate = await getUsdExchangeRate(db as any)

  const products = await db.product.findMany({
    where: { status: { in: ['ACTIVE', 'DRAFT', 'INACTIVE'] } },
    select: { id: true },
    orderBy: { updatedAt: 'desc' },
  })

  let bound = 0
  let unbound = 0
  let skipped = 0
  let failed = 0

  for (const product of products) {
    try {
      const result = await syncProductPriceThresholdRelations(db, product.id, {
        ensured,
        categoryMap,
        usdExchangeRate,
      })
      if (result.addedCategoryIds.length > 0) bound += 1
      else if (result.removedCategoryIds.length > 0) unbound += 1
      else skipped += 1
    } catch {
      failed += 1
    }
  }

  return {
    scanned: products.length,
    bound,
    unbound,
    skipped,
    failed,
    resolvedCategories: ensured.map((item) => ({
      key: item.key,
      parent_name: item.parentName,
      category_id: item.categoryId,
      category_name: item.categoryName,
      max_usd: item.maxUsd,
    })),
    missing_targets: missingTargets,
  }
}

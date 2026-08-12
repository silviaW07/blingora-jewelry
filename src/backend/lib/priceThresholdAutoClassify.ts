/**
 * Auto-bind price-threshold categories onto products via product_category_relations.
 * Never changes product.categoryId / brandCategoryId (primary shelf stays intact).
 *
 * Rules:
 * - Product under L1 Bags/包 + min sell USD <= 13 → relate tag "Below 13usd" (L1 or L2)
 * - Product under L1 Jewelry/饰品 + min sell USD <= 3 → relate tag "Below 3 usd" (L1 or L2)
 */
import { randomUUID } from 'crypto'
import {
  DEFAULT_USD_EXCHANGE_RATE,
  getUsdExchangeRate,
  toUsdFromCny,
} from '@/shared/exchangeRate'
import { slugifyCategoryName } from '@/shared/categorySlug'

export const BELOW13_USD_CATEGORY_NAME = 'below13 usd'
export const BELOW3_USD_CATEGORY_NAME = 'below3 usd'

export type PriceThresholdRuleKey = 'bags_below13' | 'jewelry_below3'

export interface PriceThresholdRule {
  key: PriceThresholdRuleKey
  /** Match ACTIVE L1 category name/slug (case-insensitive) */
  l1Aliases: string[]
  /** Canonical L2 display name when auto-creating */
  l2CanonicalName: string
  /** Exact-ish match against existing L2 category.name / slug */
  l2NameAliases: string[]
  maxUsd: number
}

export const PRICE_THRESHOLD_RULES: PriceThresholdRule[] = [
  {
    key: 'bags_below13',
    l1Aliases: ['bags', 'bag', '包', '箱包', '包包'],
    l2CanonicalName: BELOW13_USD_CATEGORY_NAME,
    l2NameAliases: [
      'below13 usd',
      'below13usd',
      'below13-usd',
      'below 13 usd',
      'below 13usd',
      'Below 13usd',
      'below13',
      '低于13美元',
      '13美元以下',
    ],
    maxUsd: 13,
  },
  {
    key: 'jewelry_below3',
    l1Aliases: ['jewelry', 'jewellery', '饰品', '首饰', 'accessories', 'accessory', '配件'],
    l2CanonicalName: BELOW3_USD_CATEGORY_NAME,
    l2NameAliases: [
      'below3 usd',
      'below3usd',
      'below3-usd',
      'below 3 usd',
      'Below 3 usd',
      'below3',
      // 后台 slug 历史拼写 beloe-3-usd
      'beloe3usd',
      'beloe-3-usd',
      'beloe 3 usd',
      '低于3美元',
      '3美元以下',
    ],
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
  /** true when this run created the L2 shelf */
  created?: boolean
}

/** @deprecated use ResolvedPriceThresholdCategory */
export type EnsuredPriceThresholdCategory = ResolvedPriceThresholdCategory

type DbLike = {
  category: {
    findMany: (args: any) => Promise<any[]>
    findFirst: (args: any) => Promise<any | null>
    create: (args: any) => Promise<any>
    update: (args: any) => Promise<any>
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

/** 标题含 below13 / below3 等后缀时，即使售价高于阈值也保留关联标签 */
export function titleClaimsPriceThresholdTag(
  title: string | null | undefined,
  rule: Pick<PriceThresholdRule, 'l2NameAliases'>,
): boolean {
  const corpus = normalizeCatKey(title)
  if (!corpus) return false
  return rule.l2NameAliases.some((alias) => {
    const token = normalizeCatKey(alias)
    return token.length >= 4 && corpus.includes(token)
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

/**
 * Min USD for threshold rules (still compared as USD ≤13 / ≤3 — not CNY thresholds).
 * Catalog SKU/cost amounts are stored in CNY; convert once (same as admin USD column)
 * then compare. Do not treat raw CNY as USD.
 */
export function resolveProductMinUsdPrice(
  product: {
    skus?: Array<{ price?: unknown }>
    costPrice?: unknown
    priceCoefficient?: unknown
  },
  usdExchangeRate: number = DEFAULT_USD_EXCHANGE_RATE,
): number | null {
  const skuPrices = (product.skus || [])
    .map((sku) => toNumber(sku.price))
    .filter((n): n is number => n !== null && n >= 0)
  let minCny: number | null = null
  if (skuPrices.length > 0) {
    minCny = Math.min(...skuPrices)
  } else {
    const cost = toNumber(product.costPrice)
    const coeff = toNumber(product.priceCoefficient) ?? 2
    if (cost !== null && cost >= 0) minCny = cost * coeff
  }
  if (minCny === null) return null
  return toUsdFromCny(minCny, usdExchangeRate)
}

async function uniqueCategorySlug(db: DbLike, baseName: string): Promise<string> {
  const base = slugifyCategoryName(baseName) || `cat-${randomUUID().slice(0, 8)}`
  let slug = base.slice(0, 120)
  let n = 0
  while (n < 20) {
    const hit = await db.category.findFirst({
      where: { slug },
      select: { id: true },
    })
    if (!hit) return slug
    n += 1
    const suffix = `-${n}`
    slug = `${base.slice(0, Math.max(1, 120 - suffix.length))}${suffix}`
  }
  return `${base.slice(0, 100)}-${randomUUID().slice(0, 8)}`
}

/**
 * Resolve threshold tag categories by name (L1 or L2).
 * Scope L1 = 包/Bags or 饰品/Jewelry (used to decide which products qualify).
 * Tag category = "Below 13usd" / "Below 3 usd" (bound via relations; may itself be top-level).
 */
export async function resolvePriceThresholdCategories(
  db: DbLike,
): Promise<ResolvedPriceThresholdCategory[]> {
  const allCats = (await db.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      parentId: true,
      status: true,
      parent: { select: { id: true, name: true } },
    },
  })) as Array<
    CategoryNode & {
      parent?: { id: string; name: string } | null
    }
  >

  const l1Rows = allCats.filter(
    (cat) => cat.level === 1 && (!cat.status || cat.status === 'ACTIVE'),
  )
  const l2Rows = allCats.filter((cat) => cat.level === 2)

  const resolved: ResolvedPriceThresholdCategory[] = []

  for (const rule of PRICE_THRESHOLD_RULES) {
    // Scope: products under 包 / 饰品 (never treat the Below* shelf itself as scope)
    const scopeL1 =
      l1Rows.find(
        (cat) =>
          !matchesAlias(cat.name, rule.l2NameAliases) &&
          !matchesAlias(cat.slug, rule.l2NameAliases) &&
          (matchesAlias(cat.name, rule.l1Aliases) || matchesAlias(cat.slug, rule.l1Aliases)),
      ) || null

    const nameMatches = (cat: CategoryNode) =>
      matchesAlias(cat.name, rule.l2NameAliases) || matchesAlias(cat.slug, rule.l2NameAliases)

    // 1) L2 under scope L1
    // 2) Top-level (or any-level) category named Below* — your admin setup
    // 3) Any L2 with that name if no scope L1
    let tag: (typeof allCats)[number] | null =
      (scopeL1 ? l2Rows.find((cat) => cat.parentId === scopeL1.id && nameMatches(cat)) : null) ||
      allCats.find((cat) => nameMatches(cat)) ||
      null

    let created = false

    if (tag && tag.status && tag.status !== 'ACTIVE') {
      await db.category.update({
        where: { id: tag.id },
        data: { status: 'ACTIVE' },
      })
      tag = { ...tag, status: 'ACTIVE' }
    }

    // Only auto-create under scope L1 when nothing named Below* exists at all
    if (!tag) {
      if (!scopeL1) continue

      const slug = await uniqueCategorySlug(db, rule.l2CanonicalName)
      const createdRow = await db.category.create({
        data: {
          id: randomUUID(),
          name: rule.l2CanonicalName,
          slug,
          parentId: scopeL1.id,
          level: 2,
          status: 'ACTIVE',
          sortWeight: 0,
          isBrandCategory: false,
          path: `${scopeL1.name}/${rule.l2CanonicalName}`,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          status: true,
          level: true,
        },
      })
      tag = {
        ...createdRow,
        parent: { id: scopeL1.id, name: scopeL1.name },
      }
      l2Rows.push(tag!)
      allCats.push(tag!)
      created = true
    }

    if (!tag) continue

    // Products must belong to scope L1 (包/饰品). Tag may be a sibling top-level shelf.
    const parentId = scopeL1?.id || (tag.level === 2 ? tag.parentId : null)
    if (!parentId) continue

    resolved.push({
      key: rule.key,
      parentId,
      parentName: scopeL1?.name || tag.parent?.name || '',
      categoryId: tag.id,
      categoryName: tag.name,
      maxUsd: rule.maxUsd,
      created,
    })
  }

  return resolved
}

/** @deprecated alias — now ensures (find or create) threshold L2 shelves */
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
      name: true,
      categoryId: true,
      costPrice: true,
      priceCoefficient: true,
      skus: { select: { price: true } },
      relationCategories: { select: { categoryId: true } },
    },
  })
  if (!product) return empty

  const categoryMap = options?.categoryMap ?? (await loadCategoryMap(db))
  let usdExchangeRate = DEFAULT_USD_EXCHANGE_RATE
  try {
    usdExchangeRate = await getUsdExchangeRate(db as any, { ttlMs: 60_000 })
  } catch {
    usdExchangeRate = DEFAULT_USD_EXCHANGE_RATE
  }
  const minUsd = resolveProductMinUsdPrice(product, usdExchangeRate)
  const relationCategoryIds = (product.relationCategories || []).map(
    (rel: { categoryId: string }) => rel.categoryId,
  )

  const shouldHaveIds: string[] = []
  const matchedKeys: PriceThresholdRuleKey[] = []
  const titleCorpus = String(product.name || '')

  for (const rule of ensured) {
    const belongs = productBelongsToL1(
      { categoryId: product.categoryId, relationCategoryIds },
      rule.parentId,
      categoryMap,
    )
    const titleClaim = titleClaimsPriceThresholdTag(titleCorpus, rule)
    const priceClaim = minUsd !== null && belongs && minUsd <= rule.maxUsd
    if (priceClaim || (titleClaim && belongs)) {
      shouldHaveIds.push(rule.categoryId)
      matchedKeys.push(rule.key)
    }
  }

  const existingThreshold = relationCategoryIds.filter((id: string) =>
    thresholdIds.includes(id),
  )
  const toAdd = shouldHaveIds.filter((id) => !existingThreshold.includes(id))
  const toRemove = existingThreshold.filter((id: string) => {
    if (!shouldHaveIds.includes(id)) {
      // 标题显式写了 below13/below3 后缀时，不因售价超标而摘掉标签
      const rule = ensured.find((item) => item.categoryId === id)
      if (rule && titleClaimsPriceThresholdTag(titleCorpus, rule)) return false
      return true
    }
    return false
  })

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
  created_categories: string[]
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
  const createdCategories = ensured
    .filter((item) => item.created)
    .map((item) => item.categoryName)

  const missingTargets = PRICE_THRESHOLD_RULES.filter(
    (rule) => !ensured.some((item) => item.key === rule.key),
  ).map((rule) => {
    const l1Hint = rule.l1Aliases.slice(0, 2).join('/')
    return `${rule.l2CanonicalName}（需同时有一级「${l1Hint}」用于判定商品归属）`
  })

  // Reload map after possible creates so new L2 parents resolve correctly
  const categoryMap = await loadCategoryMap(db)

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
    created_categories: createdCategories,
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

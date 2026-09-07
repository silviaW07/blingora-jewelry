'use server'

// ===== Enums =====

/** 
 * 库存状态：现货(IN_STOCK) | 库存告急(LOW_STOCK) | 缺货(OUT_OF_STOCK) 
 */
export type StockStatusEnum = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

/** 
 * 排序方式：上新时间(NEWEST) | 价格升序(PRICE_ASC) | 价格降序(PRICE_DESC) | 热度排序(POPULARITY) 
 */
export type SortByEnum = 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'POPULARITY'

// ===== Data Structures =====

export interface CategoryDisplayConfig {
  showChildrenByDefault: boolean
  allowChildrenCollapse: boolean
  showBrandFilter: boolean
  brandFilterCollapsedRows: number
}

export interface CategoryChildItem {
  category_id: string
  category_name: string
  category_slug: string | null
  image_url?: string | null
}

export interface BrandCategoryItem {
  category_id: string
  category_name: string
  category_slug: string | null
  product_count: number
  image_url?: string | null
}

export interface CategoryItem {
  category_id: string
  category_name: string
  category_slug: string | null
  parent_category_id: string | null
  level: number
  image_url?: string | null
  display_config: CategoryDisplayConfig
  children: CategoryChildItem[]
  brand_options: BrandCategoryItem[]
}

export interface CategoryDetail {
  category_id: string
  category_name: string
  category_description: string | null
  product_count: number
  current_category_id: string
  current_category_level: number
  parent_category_id: string | null
  display_config: CategoryDisplayConfig
  show_brand_filter: boolean
}

export interface CategoryPosterItem {
  poster_id: string
  title: string
  subtitle: string | null
  image_url: string | null
  link_text: string | null
  link_url: string | null
  category_id: string | null
  sort_weight: number
}

export type KeywordSceneArea = 'LEFT_NAV' | 'RECOMMENDATION' | 'BOTH'

export interface KeywordGroupItem {
  group_id: string
  group_name: string
  scene_area: KeywordSceneArea
  scene_slot_key: string | null
  homepage_sort_weight: number
  sort_weight: number
}

export interface KeywordItem {
  keyword_id: string
  keyword_label: string
  category_id: string | null
  linked_category_ids: string[]
  sort_weight: number
  group_id: string
  group_name: string
  scene_area: KeywordSceneArea
}

export interface SideNavZoneItem {
  item_id: string
  category_id: string
  category_name: string
  category_slug: string | null
  level: number
  parent_category_id: string | null
  parent_category_name: string | null
  product_count: number
}

export interface SideNavZoneSection {
  zone_id: string
  title: string
  items: SideNavZoneItem[]
}

export interface ProductItem {
  product_id: string
  product_slug: string
  product_name: string
  main_image_url: string
  short_description: string | null
  rating_average: number
  rating_count: number
  stock_status: StockStatusEnum
  price: number
  original_price: number | null
  has_discount: boolean
  sku_count: number
  first_sku_id: string
  first_sku_price_rmb: number
  created_at_timestamp: number
  sort_weight: number
  brand_category_id: string | null
  brand_category_name: string | null
  /** 颜色/规格缩略图（去重后），用于列表卡片展示 */
  variant_thumbnails: string[]
  /** 起订量（来自 tradeInfoJson.minOrderQty） */
  min_order_quantity: number | null
  /** SKU 最高价（USD），用于区间展示 */
  price_max: number | null
}

// ===== Input / Output =====

export interface GetCategoryListInput {
  /** 语言码：en / zh / es（兼容 zh-CN） */
  lang?: string
}

export interface GetCategoryListOutput {
  list: CategoryItem[]
}

export interface GetCategoryDetailInput {
  category_id: string
  /** 语言码：en / zh / es（兼容 zh-CN） */
  lang?: string
}

export interface GetCategoryDetailOutput {
  detail: CategoryDetail | null
}

export interface ResolveCategoryRouteKeyInput {
  /** URL 中的 /category/[slug] 段：优先按 slug 匹配，其次按 id */
  routeKey: string
}

export interface ResolveCategoryRouteKeyOutput {
  categoryId: string
  categorySlug: string | null
}

export interface GetCategoryPosterListInput {
  category_id?: string
}

export interface GetCategoryPosterListOutput {
  list: CategoryPosterItem[]
}

export interface GetKeywordGroupListInput {
  group_id?: string
  scene_area?: KeywordSceneArea
  scene_slot_key?: string
}

export interface GetKeywordGroupListOutput {
  list: KeywordGroupItem[]
}

export interface GetKeywordListInput {
  group_id?: string
  scene_area?: KeywordSceneArea
  scene_slot_key?: string
}

export interface GetKeywordListOutput {
  list: KeywordItem[]
}

export interface GetCategorySideNavZonesOutput {
  zones: SideNavZoneSection[]
}

export interface CategoryTopPromotionConfig {
  enabled: boolean
  message: string | null
  end_time: string | null
  background_color: string | null
  text_color: string | null
  /** sm | md | lg 或像素数值 */
  font_size?: 'sm' | 'md' | 'lg' | number | null
}

export interface GetCategoryTopPromotionOutput {
  promotion: CategoryTopPromotionConfig | null
}

export interface GetProductListInput {
  category_id?: string
  brand_category_id?: string
  keyword_id?: string
  keyword_group_id?: string
  search_keyword?: string
  stock_status?: StockStatusEnum[]
  sort_by?: SortByEnum
  page?: number
  page_size?: number
  min_price?: number
  max_price?: number
  has_discount?: boolean
  min_rating?: number
  /** 语言码：en / zh / es（兼容 zh-CN） */
  lang?: string
}

export interface GetProductListOutput {
  list: ProductItem[]
  total: number
}

export interface GetAvailableBrandFiltersInput {
  category_id?: string
  keyword_id?: string
  keyword_group_id?: string
  search_keyword?: string
  stock_status?: StockStatusEnum[]
  min_price?: number
  max_price?: number
  has_discount?: boolean
  min_rating?: number
  /** 语言码：en / zh / es（兼容 zh-CN） */
  lang?: string
}

export interface GetAvailableBrandFiltersOutput {
  list: BrandCategoryItem[]
}

export interface AddToCartInput {
  product_id: string
  product_sku_id: string
  quantity: number
}

export interface AddToCartOutput {
  success: boolean
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import { readHomeRecommendZonesWithCache } from '@/backend/actions/homeRecommendZoneCache'
import {
  requireRole, getAuthContext,
  withResult, UserRole
} from '@/frontend/action_utils'
import {
  normalizeProductLang,
  pickProductTranslation,
  resolveCategoryDisplayName,
  resolveProductDisplayName,
} from '@/frontend/i18n/productTranslation'
import {
  pickFrontPricingCategoryCoeffs,
  resolveFrontRmbSellingPrice,
  toDecimalNumber,
} from '@/shared/priceCoefficient'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'
import { loadPricingPromotionConfig } from '@/shared/pricingPromotionConfig'
import { applySiteWideListedUsd, getSiteWidePercentCoef } from '@/shared/pricingPromotionCalc'
import {
  collectBrandKeywordTexts,
  collectTranslationSearchTexts,
  productMatchesSearchTokens,
  tokenizeProductSearch,
} from '@/shared/productSearch'
import { normalizePosterLinkUrl } from '@/shared/posterLink'
import { isStorefrontQtyAllowed } from '@/shared/storefrontQty'
import { storefrontError } from '@/frontend/utils/storefrontErrors'
import { isProductTypeCategory } from '@/shared/categoryMatchGuards'
import {
  isJewelryShelfIntruder,
  isJewelryShelfName,
  productDoesNotBelongOnJewelryShelf,
} from '@/shared/categoryShelfFamily'
import { storefrontVisibilityWhere } from '@/shared/storefrontProductVisibility'
import { priceThresholdMaxUsdForCategory, productFitsPriceThresholdUsd } from '@/shared/priceThreshold'

const DEFAULT_BRAND_COLLAPSED_ROWS = 3
const CATEGORY_TOP_PROMOTION_TITLE = 'CATEGORY_TOP_PROMOTION'
const DEFAULT_KEYWORD_SCENE_AREAS: KeywordSceneArea[] = ['BOTH', 'LEFT_NAV', 'RECOMMENDATION']
/** 列表卡片最多加载的 SKU 行数（缩略图 + 默认规格）；全量 min/max 价另走 groupBy */
const PRODUCT_LIST_SKU_TAKE = 8
const CATEGORY_CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000
const CATEGORY_LIST_CACHE_TTL_MS = 90_000
const categoryContextCache = new Map<string, { at: number; value: ResolvedCategoryContext }>()
const categoryListServerCache = new Map<string, { at: number; value: GetCategoryListOutput }>()
const posterListCache = new Map<string, { at: number; value: GetCategoryPosterListOutput }>()

const normalizeSceneValue = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

const parseCategoryDisplayConfig = (rawConfig: unknown): CategoryDisplayConfig => {
  const config = typeof rawConfig === 'object' && rawConfig !== null ? rawConfig as Record<string, unknown> : {}
  const collapsedRows = Number(config.brandFilterCollapsedRows)

  return {
    showChildrenByDefault: config.showChildrenByDefault !== false,
    allowChildrenCollapse: config.allowChildrenCollapse !== false,
    showBrandFilter: config.showBrandFilter === true,
    brandFilterCollapsedRows: Number.isFinite(collapsedRows) && collapsedRows > 0 ? collapsedRows : DEFAULT_BRAND_COLLAPSED_ROWS
  }
}

const normalizeKeywordSceneArea = (value?: string | null): KeywordSceneArea | undefined => {
  if (value === 'LEFT_NAV' || value === 'RECOMMENDATION' || value === 'BOTH') {
    return value
  }

  return undefined
}

const resolveKeywordSceneAreas = (sceneArea?: KeywordSceneArea): KeywordSceneArea[] => {
  if (sceneArea === 'LEFT_NAV') {
    return ['LEFT_NAV', 'BOTH']
  }

  if (sceneArea === 'RECOMMENDATION') {
    return ['RECOMMENDATION', 'BOTH']
  }

  if (sceneArea === 'BOTH') {
    return ['BOTH']
  }

  return DEFAULT_KEYWORD_SCENE_AREAS
}

const buildKeywordGroupOrderBy = () => ([
  { homepageSortWeight: 'desc' as const },
  { sortWeight: 'desc' as const },
  { createdAt: 'asc' as const }
])

const collectVariantThumbnails = (
  skus: Array<{ imageUrl?: string | null }>,
  mainImageUrl?: string | null,
): string[] => {
  const urls: string[] = []
  const seen = new Set<string>()

  for (const sku of skus) {
    const url = sku.imageUrl?.trim()
    if (!url || seen.has(url)) continue
    seen.add(url)
    urls.push(url)
  }

  const mainUrl = mainImageUrl?.trim()
  if (mainUrl && !seen.has(mainUrl) && urls.length === 0) {
    urls.push(mainUrl)
  }

  return urls
}

const toUsdPrice = (rmbPrice: number | null | undefined, exchangeRate: number): number => {
  if (typeof rmbPrice !== 'number' || Number.isNaN(rmbPrice)) {
    return 0
  }

  return toUsdFromCny(rmbPrice, exchangeRate)
}

const normalizePromotionText = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

const normalizePromotionBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  return fallback
}

const normalizePromotionDate = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (!normalized) {
      return null
    }

    const parsed = new Date(normalized)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  return null
}

const parseCategoryTopPromotion = (rawContent: unknown, fallbackActive: boolean): CategoryTopPromotionConfig | null => {
  const content = typeof rawContent === 'object' && rawContent !== null ? rawContent as Record<string, unknown> : null

  if (!content) {
    return null
  }

  const message = normalizePromotionText(content.message ?? content.text ?? content.title)
  const endTime = normalizePromotionDate(content.end_time ?? content.endTime ?? content.endsAt)
  const backgroundColor = normalizePromotionText(content.background_color ?? content.backgroundColor ?? content.bgColor)
  const textColor = normalizePromotionText(content.text_color ?? content.textColor ?? content.color)
  const enabled = normalizePromotionBoolean(content.enabled, fallbackActive)
  const fontRaw = content.font_size ?? content.fontSize ?? content.fontSizePx
  let font_size: CategoryTopPromotionConfig['font_size'] = null
  if (fontRaw === 'sm' || fontRaw === 'md' || fontRaw === 'lg') {
    font_size = fontRaw
  } else if (fontRaw != null && fontRaw !== '') {
    const n = Number(fontRaw)
    if (Number.isFinite(n) && n > 0) font_size = Math.round(n)
  }

  return {
    enabled,
    message,
    end_time: endTime,
    background_color: backgroundColor,
    text_color: textColor,
    font_size,
  }
}

type ResolvedCategoryContext = {
  rootCategoryId?: string
  rootCategoryName?: string
  matchedCategoryId?: string
  matchedCategoryName?: string
  matchedCategoryLevel?: number
  descendantCategoryIds: string[]
  categoryIdsForQuery: string[]
}

const isJewelryListContext = (context: ResolvedCategoryContext) =>
  isJewelryShelfName(context.matchedCategoryName) || isJewelryShelfName(context.rootCategoryName)

const jewelryShelfExcludeWhere = () => {
  const nameNeedles = [
    '钥匙扣',
    '钥匙链',
    '发箍',
    '发带',
    '发圈',
    '发夹',
    '小皮包',
    '零钱包',
    'keychain',
    'key chain',
    'keyring',
    'headband',
    'hairband',
    'hair band',
    'hair clip',
    'hairpin',
    'mini bag',
    'coin purse',
    'cardholder',
    'card holder',
    '腰带',
    '皮带',
    'belt',
  ]
  return {
    AND: [
      ...nameNeedles.map((needle) => ({ NOT: { name: { contains: needle } } })),
      { NOT: { category: { name: { contains: 'bag' } } } },
      { NOT: { category: { parent: { name: { contains: 'bag' } } } } },
      { NOT: { category: { name: { contains: '鞋' } } } },
      { NOT: { category: { name: { contains: 'shoe' } } } },
    ],
  }
}

const keepJewelryShelfRecord = (p: {
  name?: string | null
  shortDescription?: string | null
  category?: { name?: string | null; parent?: { name?: string | null } | null } | null
  relationCategories?: Array<{ category?: { name?: string | null } | null }>
}, displayName?: string) =>
  !productDoesNotBelongOnJewelryShelf({
    name: p.name,
    displayName,
    shortDescription: p.shortDescription,
    categoryName: p.category?.name,
    parentCategoryName: p.category?.parent?.name,
    relatedCategoryNames: (p.relationCategories || []).map((rel) => rel.category?.name),
  })

const keepJewelryShelfItem = (item: { product_name: string; short_description: string | null }) =>
  !isJewelryShelfIntruder(item.product_name, item.short_description)

const hasCategoryParentId = (parentId?: string | null) => {
  const text = String(parentId || '').trim()
  return text.length > 0 && text !== '0'
}

/** 与后台分类树一致：无父级且不是二级，视为一级（兼容 level=0/3 脏数据） */
const isStorefrontLevel1 = (cat: { level?: number | null; parentId?: string | null }) =>
  !hasCategoryParentId(cat.parentId) && Number(cat.level) !== 2

/** 有父级即二级，不要求 level === 2（商品筛选上下文用） */
const isStorefrontLevel2 = (cat: { parentId?: string | null }) => hasCategoryParentId(cat.parentId)

/** 前台顶栏/侧栏导航二级：与后台分类树一致，须 level=2 且为真实货架（排除 Material/silver/品质筛选等标签类目） */
const isStorefrontNavChild = (
  child: {
    level?: number | null
    parentId?: string | null
    name?: string | null
    isBrandCategory?: boolean | null
  },
  parent: { id: string; name?: string | null },
) =>
  child.parentId === parent.id &&
  Number(child.level) === 2 &&
  isProductTypeCategory({
    name: child.name,
    parentName: parent.name,
    isBrandCategory: child.isBrandCategory,
  })

const resolveCategoryContext = async (categoryId?: string): Promise<ResolvedCategoryContext> => {
  if (!categoryId) {
    return {
      descendantCategoryIds: [],
      categoryIdsForQuery: []
    }
  }

  const cached = categoryContextCache.get(categoryId)
  if (cached && Date.now() - cached.at < CATEGORY_CONTEXT_CACHE_TTL_MS) {
    return cached.value
  }

  const currentCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      level: true,
      parentId: true,
      status: true,
      parent: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    }
  })

  if (!currentCategory || currentCategory.status !== 'ACTIVE') {
    const empty = {
      descendantCategoryIds: [],
      categoryIdsForQuery: []
    }
    categoryContextCache.set(categoryId, { at: Date.now(), value: empty })
    return empty
  }

  // L1 = 无父级且不是二级。有父级的类目即使 level 标成 1 也按二级查自己，避免 popular products 这类脏数据点进去变成空列表。
  const isL1 = isStorefrontLevel1(currentCategory)
  if (isL1) {
    const descendants = await prisma.category.findMany({
      where: {
        parentId: currentCategory.id,
        status: 'ACTIVE'
      },
      select: {
        id: true
      }
    })
    const descendantCategoryIds = descendants.map((child) => child.id)
    const resolved = {
      rootCategoryId: currentCategory.id,
      rootCategoryName: currentCategory.name,
      matchedCategoryId: currentCategory.id,
      matchedCategoryName: currentCategory.name,
      matchedCategoryLevel: currentCategory.level || 1,
      descendantCategoryIds,
      categoryIdsForQuery: Array.from(new Set([currentCategory.id, ...descendantCategoryIds]))
    }
    categoryContextCache.set(categoryId, { at: Date.now(), value: resolved })
    return resolved
  }

  const resolved = {
    rootCategoryId: currentCategory.parent?.status === 'ACTIVE' ? currentCategory.parent.id : currentCategory.parentId || undefined,
    rootCategoryName: currentCategory.parent?.status === 'ACTIVE' ? currentCategory.parent.name : undefined,
    matchedCategoryId: currentCategory.id,
    matchedCategoryName: currentCategory.name,
    matchedCategoryLevel: currentCategory.level,
    descendantCategoryIds: [],
    categoryIdsForQuery: [currentCategory.id]
  }
  categoryContextCache.set(categoryId, { at: Date.now(), value: resolved })
  return resolved
}

const buildProductWhere = (
  context: ResolvedCategoryContext,
  brandCategoryId?: string,
  keywordId?: string,
  keywordGroupId?: string,
  searchKeyword?: string,
) => {
  const vis = storefrontVisibilityWhere()
  const where: any = {
    status: vis.status,
    AND: [...vis.AND],
  }

  const orConditions: any[] = []

  if (context.categoryIdsForQuery.length > 0) {
    // Primary categoryId in (L1 + L2 children)
    orConditions.push({
      categoryId: {
        in: context.categoryIdsForQuery
      },
      category: {
        status: 'ACTIVE'
      }
    })
    // 品牌字段命中（Brand 货架商品常写在 brandCategoryId，而主类目是 Handbag）
    orConditions.push({
      brandCategoryId: {
        in: context.categoryIdsForQuery
      }
    })
    // product_category_relations to L1 or any expanded L2
    orConditions.push({
      relationCategories: {
        some: {
          categoryId: {
            in: context.categoryIdsForQuery
          },
          category: {
            status: 'ACTIVE'
          }
        }
      }
    })
    // Safety net: primary category is any ACTIVE direct child of the L1 root
    if (context.rootCategoryId && (context.matchedCategoryLevel === 1 || context.categoryIdsForQuery.includes(context.rootCategoryId))) {
      orConditions.push({
        category: {
          parentId: context.rootCategoryId,
          status: 'ACTIVE'
        }
      })
    }
  } else if (context.rootCategoryId) {
    where.category = {
      status: 'ACTIVE',
      OR: [
        { id: context.rootCategoryId },
        { parentId: context.rootCategoryId }
      ]
    }
  } else {
    where.category = { status: 'ACTIVE' }
  }

  if (orConditions.length > 0) {
    where.OR = orConditions
  }

  if (brandCategoryId) {
    // 品牌货架三路命中（去重靠 OR）：
    // 1) brandCategoryId 主品牌字段
    // 2) 主类目 categoryId（历史误把品牌当主类目的商品）
    // 3) product_category_relations 关联绑定
    const brandMatchOr = [
      { brandCategoryId },
      { categoryId: brandCategoryId },
      {
        relationCategories: {
          some: {
            categoryId: brandCategoryId,
            category: { status: 'ACTIVE' },
          },
        },
      },
    ]
    if (where.OR) {
      // 已有类目 OR 条件时，与品牌条件做 AND 组合，避免语义被覆盖
      where.AND = [...(where.AND || []), { OR: where.OR }, { OR: brandMatchOr }]
      delete where.OR
    } else {
      where.OR = brandMatchOr
    }
  }

  if (keywordId) {
    where.relationKeywords = {
      some: {
        keywordId
      }
    }
  }

  if (keywordGroupId) {
    where.keywordGroupLinks = {
      some: {
        keywordGroupId
      }
    }
  }

  // Search tokens are NOT applied in Prisma here on purpose:
  // English storefront titles live in translationsJson, and MySQL LIKE on
  // product.name alone misses "chanel bag" when the stored name is Chinese/CL.
  // Token AND fuzzy matching runs in-memory after fetch (see getProductList).
  void searchKeyword

  return where
}

// ===== Actions =====

/**
 * 获取活跃一级分类及其二级分类（用于目录树展示）
 */
export const getCategoryList = withResult(async (input?: GetCategoryListInput): Promise<GetCategoryListOutput> => {
  const lang = normalizeProductLang(input?.lang)
  const cachedList = categoryListServerCache.get(lang)
  if (cachedList && Date.now() - cachedList.at < CATEGORY_LIST_CACHE_TTL_MS) {
    return cachedList.value
  }

  const categories = await prisma.category.findMany({
    where: {
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      level: true,
      parentId: true,
      isBrandCategory: true,
      sortWeight: true,
      createdAt: true,
      imageUrl: true,
      iconUrl: true,
      translationsJson: true,
      categoryDisplayConfigJson: true,
      navConfig: {
        select: {
          isVisible: true,
          navTitle: true,
        },
      },
    },
    orderBy: [
      { sortWeight: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  const mainCategories = categories.filter(
    cat => isStorefrontLevel1(cat) && !cat.isBrandCategory && cat.navConfig?.isVisible !== false,
  )
  const childCategories = categories.filter(cat => isStorefrontLevel2(cat) && !cat.isBrandCategory)
  const brandCategories = categories.filter(cat => cat.isBrandCategory)
  // Brand shelf = isBrandCategory L1 OR a top-level category named Brand/品牌
  // (some installs forget isBrandCategory on the shelf itself).
  const BRAND_SHELF_NAME_RE = /^(brand|brands|品牌)$/i
  const brandShelfIds = new Set([
    ...brandCategories.filter((brand) => isStorefrontLevel1(brand)).map((brand) => brand.id),
    ...categories
      .filter(
        (cat) =>
          isStorefrontLevel1(cat) && BRAND_SHELF_NAME_RE.test(String(cat.name || '').trim()),
      )
      .map((cat) => cat.id),
  ])
  // Brand chips: isBrandCategory L2 tags, plus any L2 under a Brand shelf even if the flag is missing.
  const brandTagCategories = categories.filter((cat) => {
    if (!isStorefrontLevel2(cat)) return false
    if (cat.isBrandCategory) return true
    return Boolean(cat.parentId && brandShelfIds.has(cat.parentId))
  })
  const brandIds = brandTagCategories.map((brand) => brand.id)

  // Brand 商品数：主类目 / brandCategoryId / 关联类目 去重统计（与前台品牌列表口径一致）
  const brandProductCount = new Map<string, number>()
  if (brandIds.length > 0) {
    const [byCategory, byBrandCategory, byRelation] = await Promise.all([
      prisma.product.groupBy({
        by: ['categoryId'],
        where: { ...storefrontVisibilityWhere(), categoryId: { in: brandIds } },
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ['brandCategoryId'],
        where: { ...storefrontVisibilityWhere(), brandCategoryId: { in: brandIds } },
        _count: { _all: true },
      }),
      prisma.product_category_relations.groupBy({
        by: ['categoryId'],
        where: {
          categoryId: { in: brandIds },
          product: storefrontVisibilityWhere(),
        },
        _count: { _all: true },
      }),
    ])
    const addCount = (id: string | null | undefined, count: number) => {
      if (!id) return
      brandProductCount.set(id, (brandProductCount.get(id) || 0) + count)
    }
    for (const row of byCategory) addCount(row.categoryId, row._count._all)
    for (const row of byBrandCategory) addCount(row.brandCategoryId, row._count._all)
    for (const row of byRelation) addCount(row.categoryId, row._count._all)
  }

  const output: GetCategoryListOutput = {
    list: mainCategories.map(cat => {
      const fallbackName = cat.navConfig?.navTitle?.trim() || cat.name
      return {
        category_id: cat.id,
        category_name: resolveCategoryDisplayName(cat.translationsJson, fallbackName, lang),
        category_slug: cat.slug,
        parent_category_id: cat.parentId,
        level: cat.level,
        image_url: cat.imageUrl || cat.iconUrl || null,
        display_config: parseCategoryDisplayConfig(cat.categoryDisplayConfigJson),
        children: childCategories
          .filter(child => isStorefrontNavChild(child, cat))
          .slice()
          .sort((a, b) => b.sortWeight - a.sortWeight || a.name.localeCompare(b.name, 'zh-CN'))
          .map(child => ({
            category_id: child.id,
            category_name: resolveCategoryDisplayName(child.translationsJson, child.name, lang),
            category_slug: child.slug,
            image_url: child.imageUrl || child.iconUrl || null,
          })),
        brand_options: brandTagCategories
          .map(brand => ({
            category_id: brand.id,
            category_name: resolveCategoryDisplayName(brand.translationsJson, brand.name, lang),
            category_slug: brand.slug,
            product_count: brandProductCount.get(brand.id) || 0,
            image_url: brand.imageUrl || brand.iconUrl || null,
          }))
          .sort((a, b) => b.product_count - a.product_count || a.category_name.localeCompare(b.category_name, 'zh-CN'))
      }
    })
  }
  categoryListServerCache.set(lang, { at: Date.now(), value: output })
  return output
})

/**
 * 根据 URL 路由键解析分类：先按 slug，再按 id（兼容旧链接把 id 写进 /category/[…]）
 */
export const resolveCategoryRouteKey = withResult(
  async (input: ResolveCategoryRouteKeyInput): Promise<ResolveCategoryRouteKeyOutput> => {
    const routeKey = String(input.routeKey || '').trim()
    if (!routeKey) {
      return { categoryId: '', categorySlug: null }
    }

    const bySlug = await prisma.category.findFirst({
      where: {
        status: 'ACTIVE',
        slug: routeKey,
      },
      select: { id: true, slug: true },
    })
    if (bySlug) {
      return {
        categoryId: bySlug.id,
        categorySlug: bySlug.slug || null,
      }
    }

    const byId = await prisma.category.findFirst({
      where: {
        status: 'ACTIVE',
        id: routeKey,
      },
      select: { id: true, slug: true },
    })
    if (byId) {
      return {
        categoryId: byId.id,
        categorySlug: byId.slug || null,
      }
    }

    return { categoryId: '', categorySlug: null }
  },
)

/**
 * 获取特定分类详情与该分类下的有效商品数（用于分类标题区展示）
 */
export const getCategoryDetail = withResult(async (input: GetCategoryDetailInput): Promise<GetCategoryDetailOutput> => {
  const lang = normalizeProductLang(input.lang)
  const category = await prisma.category.findUnique({
    where: { id: input.category_id },
    include: {
      parent: true
    }
  })

  if (!category || category.status !== 'ACTIVE') {
    return { detail: null }
  }

  // L1: self. L2 with ACTIVE non-brand parent: use parent as main.
  // Brand shelf L2 (parent name Brand / isBrandCategory): treat self as main
  // so SIDE_NAV brand clicks stay on Lv/COACH/… instead of collapsing to Brand L1.
  // Orphan / parent-missing L2: also treat self as main.
  const parentIsBrandShelf =
    !!category.parent &&
    (category.parent.isBrandCategory ||
      String(category.parent.name || '').trim().toLowerCase() === 'brand')
  const mainCategory = category.level === 1
    ? category
    : category.parent &&
        category.parent.status === 'ACTIVE' &&
        !category.parent.isBrandCategory &&
        !parentIsBrandShelf
      ? category.parent
      : category.level === 2
        ? category
        : null

  if (!mainCategory) {
    return { detail: null }
  }

  const categoryContext = await resolveCategoryContext(category.id)
  const productCount = await prisma.product.count({
    where: buildProductWhere(categoryContext)
  })

  const displayConfig = parseCategoryDisplayConfig(mainCategory.categoryDisplayConfigJson)

  return {
    detail: {
      category_id: mainCategory.id,
      category_name: resolveCategoryDisplayName(category.translationsJson, category.name, lang),
      category_description: category.description || mainCategory.description,
      product_count: productCount,
      current_category_id: category.id,
      current_category_level: category.level,
      parent_category_id:
        category.level === 2 && mainCategory.id !== category.id ? mainCategory.id : null,
      display_config: displayConfig,
      show_brand_filter: displayConfig.showBrandFilter
    }
  }
})

/**
 * 分类管理「海报配置」(sitesetting HOMEPAGE_POSTER)，仅在某一级分类页生效。
 */
type HomepagePosterSettingItem = {
  id?: string
  title?: string
  image_url?: string
  imageUrl?: string
  link?: string | null
  sort_weight?: number
  sortWeight?: number
  is_active?: boolean
  isActive?: boolean
}

async function loadConfiguredCategoryPosters(categoryId?: string | null): Promise<CategoryPosterItem[]> {
  const settings = await prisma.sitesetting.findMany({
    where: { settingType: 'HOMEPAGE_POSTER', isActive: true },
    orderBy: [{ sortWeight: 'desc' }, { createdAt: 'asc' }],
  })

  const items: CategoryPosterItem[] = []
  for (const setting of settings) {
    const payload = (setting.contentJson ?? {}) as {
      categoryId?: string | null
      items?: HomepagePosterSettingItem[]
    }
    const configCategoryId = String(payload.categoryId || '').trim()
    if (categoryId && configCategoryId !== categoryId) continue
    if (!categoryId && !configCategoryId) continue

    for (const [index, raw] of (payload.items ?? []).entries()) {
      const active = raw.is_active ?? raw.isActive
      if (active === false) continue
      const imageUrl = String(raw.image_url || raw.imageUrl || '').trim()
      if (!imageUrl) continue
      items.push({
        poster_id: String(raw.id || `poster-${setting.id}-${index}`),
        title: String(raw.title || `海报 ${index + 1}`),
        subtitle: null,
        image_url: imageUrl,
        link_text: null,
        link_url: normalizePosterLinkUrl(raw.link),
        category_id: configCategoryId || null,
        sort_weight: Number(raw.sort_weight ?? raw.sortWeight ?? index),
      })
    }
  }

  return items.sort((a, b) => b.sort_weight - a.sort_weight)
}

async function loadCategoryBannerPosters(): Promise<CategoryPosterItem[]> {
  const bannerRecords = await prisma.categorybanner.findMany({
    where: { isEnabled: true },
    orderBy: [{ sortWeight: 'desc' }, { updatedAt: 'desc' }],
  })
  return bannerRecords.map((banner) => ({
    poster_id: banner.id,
    title: banner.title || '首页横幅',
    subtitle: null,
    image_url: banner.imageUrl,
    link_text: null,
    link_url: normalizePosterLinkUrl(banner.linkUrl),
    category_id: null,
    sort_weight: Number(banner.sortWeight ?? 0),
  }))
}

/**
 * 读取目录页海报：
 * - 首页 / 未进具体分类：Banner 轮播图管理（categorybanner）
 * - 某一级分类页：该分类「海报配置」优先，否则回退 Banner 轮播
 */
export const getCategoryPosterList = withResult(async (input: GetCategoryPosterListInput): Promise<GetCategoryPosterListOutput> => {
  const cacheKey = String(input.category_id || '')
  const cachedPosters = posterListCache.get(cacheKey)
  if (cachedPosters && Date.now() - cachedPosters.at < CATEGORY_LIST_CACHE_TTL_MS) {
    return cachedPosters.value
  }

  const categoryContext = input.category_id
    ? await resolveCategoryContext(input.category_id)
    : null
  const mainCategoryId = categoryContext?.rootCategoryId

  let list: CategoryPosterItem[] = []

  if (mainCategoryId) {
    const categoryPosters = await loadConfiguredCategoryPosters(mainCategoryId)
    if (categoryPosters.length > 0) {
      list = categoryPosters
    }
  }

  if (!list.length) {
    list = await loadCategoryBannerPosters()
  }

  const output: GetCategoryPosterListOutput = {
    list: [...list].sort((a, b) => b.sort_weight - a.sort_weight),
  }
  posterListCache.set(cacheKey, { at: Date.now(), value: output })
  return output
})

/**
 * 获取分类页顶部促销配置，复用站点配置存储并兼容空配置降级。
 */
export const getCategoryTopPromotion = withResult(async (): Promise<GetCategoryTopPromotionOutput> => {
  const setting = await prisma.sitesetting.findFirst({
    where: {
      title: CATEGORY_TOP_PROMOTION_TITLE
    },
    orderBy: [
      { isActive: 'desc' },
      { sortWeight: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  if (!setting) {
    return {
      promotion: null
    }
  }

  return {
    promotion: parseCategoryTopPromotion(setting.contentJson, setting.isActive)
  }
})

/**
 * 获取关键词分组，支持按专区与分组 ID 独立读取。
 */
export const getKeywordGroupList = withResult(async (input: GetKeywordGroupListInput = {}): Promise<GetKeywordGroupListOutput> => {
  const sceneAreas = resolveKeywordSceneAreas(normalizeKeywordSceneArea(input.scene_area))
  const sceneSlotKey = normalizeSceneValue(input.scene_slot_key)

  const groups = await prisma.keywordgroup.findMany({
    where: {
      isActive: true,
      ...(input.group_id ? { id: input.group_id } : {}),
      ...(sceneSlotKey ? { sceneSlotKey } : {}),
      sceneArea: {
        in: sceneAreas
      }
    },
    orderBy: buildKeywordGroupOrderBy()
  })

  return {
    list: groups.map((group) => ({
      group_id: group.id,
      group_name: group.floorTitle?.trim() || group.name,
      scene_area: group.sceneArea as KeywordSceneArea,
      scene_slot_key: group.sceneSlotKey || null,
      homepage_sort_weight: group.homepageSortWeight,
      sort_weight: group.sortWeight
    }))
  }
})

/**
 * 获取关键词项，支持按专区过滤并允许通过分组 ID 独立读取。
 */
export const getKeywordList = withResult(async (input: GetKeywordListInput = {}): Promise<GetKeywordListOutput> => {
  const sceneAreas = resolveKeywordSceneAreas(normalizeKeywordSceneArea(input.scene_area))
  const sceneSlotKey = normalizeSceneValue(input.scene_slot_key)

  const groups = await prisma.keywordgroup.findMany({
    where: {
      isActive: true,
      ...(input.group_id ? { id: input.group_id } : {}),
      ...(sceneSlotKey ? { sceneSlotKey } : {}),
      sceneArea: {
        in: sceneAreas
      }
    },
    include: {
      keywords: {
        where: {
          isActive: true
        },
        orderBy: [
          { sortWeight: 'desc' },
          { createdAt: 'asc' }
        ],
        include: {
          categoryLinks: {
            orderBy: [
              { createdAt: 'asc' }
            ]
          }
        }
      }
    },
    orderBy: buildKeywordGroupOrderBy()
  })

  return {
    list: groups.flatMap((group) => group.keywords.map((keyword) => ({
      keyword_id: keyword.id,
      keyword_label: keyword.keyword,
      category_id: keyword.categoryLinks[0]?.categoryId || null,
      linked_category_ids: keyword.categoryLinks.map((link) => link.categoryId),
      sort_weight: keyword.sortWeight,
      group_id: group.id,
      group_name: group.floorTitle?.trim() || group.name,
      scene_area: group.sceneArea as KeywordSceneArea
    })))
      .sort((a, b) => b.sort_weight - a.sort_weight || a.keyword_label.localeCompare(b.keyword_label, 'zh-CN'))
  }
})

/**
 * 获取首页推荐专区中的左侧导航专区数据，用于首页顶部 Banner 左侧导航展示。
 */
export const getCategorySideNavZones = withResult(async (input?: {
  lang?: string
}): Promise<GetCategorySideNavZonesOutput> => {
  const lang = normalizeProductLang(input?.lang)
  const zones = await readHomeRecommendZonesWithCache()
  const categoryIds = Array.from(
    new Set(
      zones
        .filter((zone) => zone.zoneType === 'SIDE_NAV')
        .flatMap((zone) =>
          zone.items
            .map((item) => item.categoryId || item.category?.id || null)
            .filter((id): id is string => Boolean(id)),
        ),
    ),
  )
  const freshCategories = categoryIds.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          level: true,
          parentId: true,
          translationsJson: true,
          parent: {
            select: {
              name: true,
              translationsJson: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      })
    : []
  const freshCategoryMap = new Map(freshCategories.map((category) => [category.id, category]))

  return {
    zones: zones
      .filter((zone) => zone.zoneType === 'SIDE_NAV')
      .map((zone) => ({
        zone_id: zone.id,
        title: zone.title,
        items: zone.items.reduce<SideNavZoneItem[]>((acc, item) => {
          const categoryId = item.categoryId || item.category?.id
          const category = (categoryId && freshCategoryMap.get(categoryId)) || item.category
          if (item.entityType !== 'SIDE_NAV' || !category || category.status !== 'ACTIVE') {
            return acc
          }

          acc.push({
            item_id: item.id,
            category_id: category.id,
            category_name: resolveCategoryDisplayName(category.translationsJson, category.name, lang),
            category_slug: category.slug,
            level: category.level,
            parent_category_id: category.parentId,
            parent_category_name: category.parent
              ? resolveCategoryDisplayName(category.parent.translationsJson, category.parent.name, lang)
              : null,
            product_count: category._count.products
          })

          return acc
        }, [])
      }))
      .filter((zone) => zone.items.length > 0)
  }
})

// ===== 商品列表：结果短 TTL 缓存（进程内，键=归一化查询参数） =====
const LIST_CACHE_TTL_MS = Number(process.env.PRODUCT_LIST_CACHE_TTL_MS || 45_000)
const LIST_CACHE_MAX = 300
const productListCache = new Map<string, { at: number; value: GetProductListOutput }>()

function buildListCacheKey(input: GetProductListInput, lang: string, siteWideCoef: number | null): string {
  return JSON.stringify({
    c: input.category_id || '',
    b: input.brand_category_id || '',
    k: input.keyword_id || '',
    kg: input.keyword_group_id || '',
    s: input.search_keyword || '',
    st: input.stock_status || null,
    sort: input.sort_by || 'NEWEST',
    min: input.min_price ?? null,
    max: input.max_price ?? null,
    disc: input.has_discount ? 1 : 0,
    mr: input.min_rating ?? null,
    p: input.page || 1,
    ps: input.page_size || 60,
    lang,
    sw: siteWideCoef,
  })
}

function getCachedList(key: string): GetProductListOutput | null {
  const hit = productListCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > LIST_CACHE_TTL_MS) {
    productListCache.delete(key)
    return null
  }
  return hit.value
}

function setCachedList(key: string, value: GetProductListOutput): void {
  if (productListCache.size >= LIST_CACHE_MAX) {
    const oldestKey = productListCache.keys().next().value
    if (oldestKey !== undefined) productListCache.delete(oldestKey)
  }
  productListCache.set(key, { at: Date.now(), value })
}

/** 将单个商品记录映射为前台列表卡片项（价格系数换算 / 库存 / 缩略图等）。 */
function toCreatedAtTimestamp(value: Date | string | number | null | undefined): number {
  if (value == null || value === '') return 0
  if (value instanceof Date) {
    const ms = value.getTime()
    return Number.isNaN(ms) ? 0 : ms
  }
  const ms = new Date(value).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

function mapProductRecordToItem(
  p: any,
  lang: ReturnType<typeof normalizeProductLang>,
  exchangeRate: number,
  opts?: {
    skuPriceMinRmb?: number | null
    skuPriceMaxRmb?: number | null
    stockStatus?: StockStatusEnum
    siteWideCoef?: number | null
  },
): ProductItem {
  const skus = p.skus
  const skuCount = skus.length
  const sortedSkus = [...skus].sort((a: any, b: any) => a.price.toNumber() - b.price.toNumber())
  const defaultSku = sortedSkus.length > 0 ? sortedSkus[0] : null

  let stockStatus: StockStatusEnum = 'OUT_OF_STOCK'
  if (opts?.stockStatus) {
    stockStatus = opts.stockStatus
  } else if (skus.some((s: any) => s.stockStatus === 'IN_STOCK')) {
    stockStatus = 'IN_STOCK'
  } else if (skus.some((s: any) => s.stockStatus === 'LOW_STOCK')) {
    stockStatus = 'LOW_STOCK'
  }

  const pricingCoeffs = pickFrontPricingCategoryCoeffs({
    primary: p.category,
    relations: (p.relationCategories || []).map((rel: any) => rel.category),
  })
  const priceRmb = resolveFrontRmbSellingPrice({
    skuPriceRmb: opts?.skuPriceMinRmb ?? (defaultSku ? defaultSku.price.toNumber() : 0),
    costPrice: p.costPrice,
    ...pricingCoeffs,
  })
  const cost = toDecimalNumber(p.costPrice)
  const originalPriceRmb =
    cost !== null && cost > 0
      ? Number((priceRmb * 1.1).toFixed(2))
      : defaultSku?.originalPrice
        ? defaultSku.originalPrice.toNumber()
        : null
  const priceNum = toUsdPrice(priceRmb, exchangeRate)
  const originalPriceNum = originalPriceRmb !== null ? toUsdPrice(originalPriceRmb, exchangeRate) : null
  const usdPrices =
    opts?.skuPriceMinRmb != null && opts?.skuPriceMaxRmb != null
      ? [
          toUsdPrice(
            resolveFrontRmbSellingPrice({
              skuPriceRmb: opts.skuPriceMinRmb,
              costPrice: p.costPrice,
              ...pricingCoeffs,
            }),
            exchangeRate,
          ),
          toUsdPrice(
            resolveFrontRmbSellingPrice({
              skuPriceRmb: opts.skuPriceMaxRmb,
              costPrice: p.costPrice,
              ...pricingCoeffs,
            }),
            exchangeRate,
          ),
        ]
      : skus
          .map((sku: any) =>
            toUsdPrice(
              resolveFrontRmbSellingPrice({
                skuPriceRmb: sku.price.toNumber(),
                costPrice: p.costPrice,
                ...pricingCoeffs,
              }),
              exchangeRate,
            ),
          )
          .filter((value: number) => Number.isFinite(value) && value > 0)
  const priceMax = usdPrices.length > 0 ? Math.max(...usdPrices) : null
  const listed = applySiteWideListedUsd({
    price: priceNum,
    priceMax: priceMax && priceMax > priceNum ? priceMax : null,
    originalPrice: originalPriceNum,
    coef: opts?.siteWideCoef ?? null,
  })
  const minOrderQuantity = Math.max(1, Number((p.tradeInfoJson as any)?.minOrderQty ?? 0) || 1)
  const translated = pickProductTranslation((p as { translationsJson?: unknown }).translationsJson, lang)

  return {
    product_id: p.id,
    product_slug: p.slug,
    product_name: resolveProductDisplayName(
      p.name,
      (p as { translationsJson?: unknown }).translationsJson,
      lang,
      {
        categoryName: p.category?.name,
        parentCategoryName: p.category?.parent?.name,
        shortDescription: translated?.shortDescription?.trim() || p.shortDescription,
      },
    ),
    main_image_url: p.mainImageUrl,
    short_description: translated?.shortDescription?.trim() || p.shortDescription,
    rating_average: p.ratingAverage,
    rating_count: p.ratingCount,
    stock_status: stockStatus,
    price: listed.price,
    original_price: listed.originalPrice,
    has_discount: listed.hasDiscount,
    sku_count: skuCount,
    first_sku_id: defaultSku ? defaultSku.id : '',
    first_sku_price_rmb: priceRmb,
    created_at_timestamp: toCreatedAtTimestamp(p.createdAt),
    sort_weight: p.sortWeight,
    brand_category_id: p.brandCategoryId,
    brand_category_name: p.brandCategory?.name || null,
    variant_thumbnails: collectVariantThumbnails(skus, p.mainImageUrl),
    min_order_quantity: minOrderQuantity,
    price_max: listed.priceMax && listed.priceMax > listed.price ? listed.priceMax : null,
  }
}

async function loadCategoryPinIds(categoryId?: string | null): Promise<string[]> {
  const id = String(categoryId || '').trim()
  if (!id) return []
  try {
    const rows = await prisma.product_category_relations.findMany({
      where: { categoryId: id, sortWeight: { gt: 0 } },
      orderBy: [{ sortWeight: 'desc' }, { updatedAt: 'desc' }],
      select: { productId: true },
      take: 60,
    })
    return rows.map((row) => row.productId)
  } catch {
    return []
  }
}

function applyPinOrderToIds(pinIds: string[], orderedIds: string[]): string[] {
  if (!pinIds.length || !orderedIds.length) return orderedIds
  const present = new Set(orderedIds)
  const pinned = pinIds.filter((id) => present.has(id))
  if (!pinned.length) return orderedIds
  const pinSet = new Set(pinned)
  return [...pinned, ...orderedIds.filter((id) => !pinSet.has(id))]
}

/**
 * 获取商品列表，支持多重条件筛选、排序和分页。
 */
export const getProductList = withResult(async (input: GetProductListInput): Promise<GetProductListOutput> => {
  const page = input.page && input.page > 0 ? input.page : 1
  // Cap at 60 so xl:grid-cols-5 pages fill evenly (12 rows)
  const pageSize = Math.min(
    60,
    input.page_size && input.page_size > 0 ? input.page_size : 60,
  )
  const lang = normalizeProductLang(input.lang)

  const [exchangeRate, pricingConfig, listingCategory] = await Promise.all([
    getUsdExchangeRate(prisma, { ttlMs: 60_000 }),
    loadPricingPromotionConfig(prisma),
    input.category_id
      ? prisma.category.findUnique({
          where: { id: input.category_id },
          select: { name: true, slug: true },
        })
      : Promise.resolve(null),
  ])
  const siteWideCoef = getSiteWidePercentCoef(pricingConfig)
  const thresholdCap = priceThresholdMaxUsdForCategory(listingCategory?.name, listingCategory?.slug)

  const cacheKey = buildListCacheKey(input, lang, siteWideCoef)
  const cachedOutput = getCachedList(cacheKey)
  if (cachedOutput) return cachedOutput

  const categoryContext = await resolveCategoryContext(input.category_id)

  const dbWhere: any = buildProductWhere(
    categoryContext,
    input.brand_category_id,
    input.keyword_id,
    input.keyword_group_id,
    input.search_keyword,
  )

  if (input.min_rating !== undefined) {
    dbWhere.ratingAverage = { gte: input.min_rating }
  }

  const searchTokens = tokenizeProductSearch(input.search_keyword)
  // Broad SQL prefilter (any token hits any field). Exact token-AND + EN titles
  // in translationsJson are applied in-memory below — never require contiguous phrase.
  if (searchTokens.length > 0) {
    const tokenOr = (token: string) => ({
      OR: [
        { name: { contains: token } },
        { shortDescription: { contains: token } },
        { productCode: { contains: token } },
        { slug: { contains: token } },
        { skus: { some: { skuCode: { contains: token } } } },
        { brandCategory: { name: { contains: token } } },
        { category: { name: { contains: token } } },
        { relationCategories: { some: { category: { name: { contains: token } } } } },
      ],
    })
    dbWhere.AND = [
      ...(Array.isArray(dbWhere.AND) ? dbWhere.AND : dbWhere.AND ? [dbWhere.AND] : []),
      { OR: searchTokens.map(tokenOr) },
    ]
  }

  const jewelryShelf = isJewelryListContext(categoryContext)
  if (jewelryShelf) {
    dbWhere.AND = [
      ...(Array.isArray(dbWhere.AND) ? dbWhere.AND : dbWhere.AND ? [dbWhere.AND] : []),
      jewelryShelfExcludeWhere(),
    ]
  }

  // 列表卡片只需价格/库存/编码/图；只 select 必要字段，避免每个商品拖回
  // detailText / detailContentJson / galleryJson 等大字段。
  const listSelect = {
    id: true,
    slug: true,
    name: true,
    productCode: true,
    mainImageUrl: true,
    shortDescription: true,
    translationsJson: true,
    costPrice: true,
    tradeInfoJson: true,
    ratingAverage: true,
    ratingCount: true,
    createdAt: true,
    sortWeight: true,
    brandCategoryId: true,
    skus: {
      select: {
        id: true,
        skuCode: true,
        imageUrl: true,
        price: true,
        originalPrice: true,
        stockStatus: true,
      },
      orderBy: [{ createdAt: 'asc' as const }, { skuCode: 'asc' as const }],
      take: PRODUCT_LIST_SKU_TAKE,
    },
    brandCategory: {
      select: {
        name: true,
        brandKeywordsJson: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        level: true,
        priceCoefficient: true,
        isBrandCategory: true,
        parentId: true,
        parent: {
          select: {
            name: true,
            priceCoefficient: true,
            isBrandCategory: true,
          },
        },
      },
    },
    relationCategories: {
      select: {
        category: {
          select: {
            id: true,
            name: true,
            level: true,
            status: true,
            parentId: true,
            priceCoefficient: true,
            isBrandCategory: true,
            parent: {
              select: {
                name: true,
                priceCoefficient: true,
                isBrandCategory: true,
              },
            },
          },
        },
      },
    },
  }

  // Fast path: SQL orderBy + skip/take when we can avoid in-memory price/search scans.
  // Price sort uses SKU min-price ranking (approximate vs coefficient USD, but paginates correctly).
  const sortBy = input.sort_by || 'NEWEST'
  const wantsPriceSort = sortBy === 'PRICE_ASC' || sortBy === 'PRICE_DESC'
  const canPushdownPaginate =
    searchTokens.length === 0 &&
    input.min_price === undefined &&
    input.max_price === undefined &&
    !input.has_discount &&
    thresholdCap == null &&
    (sortBy === 'NEWEST' || sortBy === 'POPULARITY' || wantsPriceSort)

  if (input.stock_status && input.stock_status.length > 0) {
    dbWhere.AND = [
      ...(Array.isArray(dbWhere.AND) ? dbWhere.AND : dbWhere.AND ? [dbWhere.AND] : []),
      { skus: { some: { stockStatus: { in: input.stock_status } } } },
    ]
  }

  const pinIds = await loadCategoryPinIds(input.category_id)
  const restWhere = pinIds.length
    ? { AND: [dbWhere, { id: { notIn: pinIds } }] }
    : dbWhere

  // Slow-path ceiling: never pull thousands of fat product+SKU rows for Accessories-scale L1s.
  const listTake = thresholdCap != null ? 2500 : searchTokens.length > 0 ? 500 : 800

  if (canPushdownPaginate && wantsPriceSort) {
    const [total, priceRows] = await Promise.all([
      prisma.product.count({ where: dbWhere }),
      prisma.productsku.groupBy({
        by: ['productId'],
        where: { product: dbWhere },
        _min: { price: true },
      }),
    ])

    const ranked = priceRows
      .map((row) => ({
        productId: row.productId,
        minPrice: row._min.price != null ? Number(row._min.price) : Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) =>
        sortBy === 'PRICE_DESC' ? b.minPrice - a.minPrice : a.minPrice - b.minPrice,
      )

    const rankedIds = applyPinOrderToIds(
      pinIds,
      ranked.map((row) => row.productId),
    )
    const skip = (page - 1) * pageSize
    const pageIds = rankedIds.slice(skip, skip + pageSize)
    const pageRows =
      pageIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: pageIds } },
            select: listSelect,
          })
        : []
    const byId = new Map(pageRows.map((row) => [row.id, row]))
    const orderedRows = pageIds.map((id) => byId.get(id)).filter(Boolean) as typeof pageRows

    const [skuPriceAggs, skuStockRows] =
      pageIds.length > 0
        ? await Promise.all([
            prisma.productsku.groupBy({
              by: ['productId'],
              where: { productId: { in: pageIds } },
              _min: { price: true },
              _max: { price: true },
            }),
            prisma.productsku.findMany({
              where: { productId: { in: pageIds } },
              select: { productId: true, stockStatus: true },
            }),
          ])
        : [[], []]

    const skuPriceAggByProduct = new Map(
      skuPriceAggs.map((row) => [
        row.productId,
        {
          min: row._min.price != null ? row._min.price.toNumber() : null,
          max: row._max.price != null ? row._max.price.toNumber() : null,
        },
      ]),
    )
    const stockByProduct = new Map<string, StockStatusEnum>()
    for (const row of skuStockRows) {
      const current = stockByProduct.get(row.productId)
      const next = row.stockStatus as StockStatusEnum
      if (next === 'IN_STOCK') {
        stockByProduct.set(row.productId, 'IN_STOCK')
      } else if (next === 'LOW_STOCK' && current !== 'IN_STOCK') {
        stockByProduct.set(row.productId, 'LOW_STOCK')
      } else if (!current) {
        stockByProduct.set(row.productId, 'OUT_OF_STOCK')
      }
    }

    const priceSortOutput: GetProductListOutput = {
      list: orderedRows.map((p) => {
        const agg = skuPriceAggByProduct.get(p.id)
        return mapProductRecordToItem(p, lang, exchangeRate, {
          skuPriceMinRmb: agg?.min ?? null,
          skuPriceMaxRmb: agg?.max ?? null,
          stockStatus: stockByProduct.get(p.id),
          siteWideCoef,
        })
      }),
      total,
    }
    setCachedList(cacheKey, priceSortOutput)
    return priceSortOutput
  }

  if (canPushdownPaginate) {
    const orderBy =
      sortBy === 'POPULARITY'
        ? [{ sortWeight: 'desc' as const }, { ratingCount: 'desc' as const }, { id: 'desc' as const }]
        : input.keyword_group_id
          ? [{ sortWeight: 'desc' as const }, { createdAt: 'desc' as const }, { id: 'desc' as const }]
          : [{ createdAt: 'desc' as const }, { id: 'desc' as const }]

    const pinnedHits = pinIds.length
      ? await prisma.product.findMany({
          where: { AND: [dbWhere, { id: { in: pinIds } }] },
          select: { id: true },
        })
      : []
    const pinnedOrderedIds = pinIds.filter((id) => pinnedHits.some((row) => row.id === id))
    const restSkip = Math.max(0, (page - 1) * pageSize - pinnedOrderedIds.length)
    const restTake =
      page === 1 ? Math.max(0, pageSize - pinnedOrderedIds.length) : pageSize

    const [restTotal, restRows, pinnedRows] = await Promise.all([
      prisma.product.count({ where: restWhere }),
      restTake > 0
        ? prisma.product.findMany({
            where: restWhere,
            select: listSelect,
            orderBy,
            skip: restSkip,
            take: restTake,
          })
        : Promise.resolve([]),
      page === 1 && pinnedOrderedIds.length
        ? prisma.product.findMany({
            where: { id: { in: pinnedOrderedIds } },
            select: listSelect,
          })
        : Promise.resolve([]),
    ])

    const pinnedById = new Map(pinnedRows.map((row) => [row.id, row]))
    const orderedPinned = page === 1
      ? pinnedOrderedIds.map((id) => pinnedById.get(id)).filter(Boolean)
      : []
    const pageRows = [...orderedPinned, ...restRows] as typeof restRows
    const total = restTotal + pinnedOrderedIds.length

    const productIds = pageRows.map((p) => p.id)
    const [skuPriceAggs, skuStockRows] =
      productIds.length > 0
        ? await Promise.all([
            prisma.productsku.groupBy({
              by: ['productId'],
              where: { productId: { in: productIds } },
              _min: { price: true },
              _max: { price: true },
            }),
            prisma.productsku.findMany({
              where: { productId: { in: productIds } },
              select: { productId: true, stockStatus: true },
            }),
          ])
        : [[], []]

    const skuPriceAggByProduct = new Map(
      skuPriceAggs.map((row) => [
        row.productId,
        {
          min: row._min.price != null ? row._min.price.toNumber() : null,
          max: row._max.price != null ? row._max.price.toNumber() : null,
        },
      ]),
    )
    const stockByProduct = new Map<string, StockStatusEnum>()
    for (const row of skuStockRows) {
      const current = stockByProduct.get(row.productId)
      const next = row.stockStatus as StockStatusEnum
      if (next === 'IN_STOCK') {
        stockByProduct.set(row.productId, 'IN_STOCK')
      } else if (next === 'LOW_STOCK' && current !== 'IN_STOCK') {
        stockByProduct.set(row.productId, 'LOW_STOCK')
      } else if (!current) {
        stockByProduct.set(row.productId, 'OUT_OF_STOCK')
      }
    }

    const fastOutput: GetProductListOutput = {
      list: pageRows.map((p) => {
        const agg = skuPriceAggByProduct.get(p.id)
        return mapProductRecordToItem(p, lang, exchangeRate, {
          skuPriceMinRmb: agg?.min ?? null,
          skuPriceMaxRmb: agg?.max ?? null,
          stockStatus: stockByProduct.get(p.id),
          siteWideCoef,
        })
      }),
      total,
    }
    setCachedList(cacheKey, fastOutput)
    return fastOutput
  }

  const dbProducts = await prisma.product.findMany({
    where: dbWhere,
    select: listSelect,
    take: listTake
  })

  let items: ProductItem[] = dbProducts
    .filter((p) => {
      if (!searchTokens.length) return true
      const translationTexts = collectTranslationSearchTexts(
        (p as { translationsJson?: unknown }).translationsJson,
      )
      const displayName = resolveProductDisplayName(
        p.name,
        (p as { translationsJson?: unknown }).translationsJson,
        lang,
      )
      const brandKeywords = collectBrandKeywordTexts(
        (p.brandCategory as { brandKeywordsJson?: unknown } | null)?.brandKeywordsJson,
      )
      const relatedCategoryNames = (p.relationCategories || [])
        .map((rel) => rel.category?.name)
        .filter(Boolean)
      return productMatchesSearchTokens(searchTokens, [
        p.name,
        displayName,
        p.shortDescription,
        (p as { productCode?: string | null }).productCode,
        (p as { slug?: string | null }).slug,
        p.brandCategory?.name,
        p.category?.name,
        p.category?.parent?.name,
        ...brandKeywords,
        ...relatedCategoryNames,
        ...translationTexts,
        ...p.skus.map((sku) => sku.skuCode),
      ])
    })
    .map((p) => mapProductRecordToItem(p, lang, exchangeRate, { siteWideCoef }))

  if (jewelryShelf) {
    const allowedIds = new Set(
      dbProducts.filter((row) => keepJewelryShelfRecord(row)).map((row) => row.id),
    )
    items = items.filter(
      (item) => allowedIds.has(item.product_id) && keepJewelryShelfItem(item),
    )
  }

  if (thresholdCap != null) {
    items = items.filter((item) =>
      productFitsPriceThresholdUsd(item.price, item.price_max, thresholdCap),
    )
  }

  if (input.min_price !== undefined) {
    items = items.filter(i => i.price >= input.min_price!)
  }

  if (input.max_price !== undefined) {
    items = items.filter(i => i.price <= input.max_price!)
  }

  if (input.has_discount) {
    items = items.filter(i => i.has_discount)
  }

  // stock_status already pushed into SQL where when present

  items.sort((a, b) => {
    switch (sortBy) {
      case 'PRICE_ASC':
        return a.price - b.price
      case 'PRICE_DESC':
        return b.price - a.price
      case 'POPULARITY':
        if (b.sort_weight !== a.sort_weight) return b.sort_weight - a.sort_weight
        return b.rating_count - a.rating_count
      case 'NEWEST':
      default:
        if (input.keyword_group_id) {
          if (b.sort_weight !== a.sort_weight) return b.sort_weight - a.sort_weight
        }
        return b.created_at_timestamp - a.created_at_timestamp
    }
  })

  if (pinIds.length) {
    const pinIndex = new Map(pinIds.map((id, index) => [id, index]))
    const pinnedItems = items
      .filter((item) => pinIndex.has(item.product_id))
      .sort((a, b) => (pinIndex.get(a.product_id) ?? 0) - (pinIndex.get(b.product_id) ?? 0))
    const restItems = items.filter((item) => !pinIndex.has(item.product_id))
    items = [...pinnedItems, ...restItems]
  }

  const total = items.length
  const skip = (page - 1) * pageSize

  const output: GetProductListOutput = {
    list: items.slice(skip, skip + pageSize),
    total
  }
  setCachedList(cacheKey, output)
  return output
})

const BRAND_FACET_CACHE_TTL_MS = Number(process.env.BRAND_FACET_CACHE_TTL_MS || 45_000)
const BRAND_FACET_CACHE_MAX = 200
const brandFacetCache = new Map<string, { at: number; value: GetAvailableBrandFiltersOutput }>()

/** 后台改绑定/上下架后立刻失效前台列表与导航缓存，避免点进二级类目仍看到旧空列表。 */
export function invalidateStorefrontCatalogCaches() {
  productListCache.clear()
  categoryListServerCache.clear()
  categoryContextCache.clear()
  posterListCache.clear()
  brandFacetCache.clear()
}

function buildBrandFacetCacheKey(input: GetAvailableBrandFiltersInput, lang: string): string {
  return JSON.stringify({
    c: input.category_id || '',
    k: input.keyword_id || '',
    kg: input.keyword_group_id || '',
    s: input.search_keyword || '',
    st: input.stock_status || null,
    min: input.min_price ?? null,
    max: input.max_price ?? null,
    disc: input.has_discount ? 1 : 0,
    mr: input.min_rating ?? null,
    lang,
  })
}

function resolveProductBrandCategoryId(p: {
  brandCategoryId: string | null
  category: { id: string; isBrandCategory: boolean; status?: string } | null
  relationCategories: Array<{ category: { id: string; isBrandCategory: boolean; status: string } | null }>
}): string | null {
  if (p.brandCategoryId) return p.brandCategoryId
  if (p.category?.isBrandCategory && p.category.status !== 'INACTIVE') return p.category.id
  for (const rel of p.relationCategories || []) {
    const cat = rel.category
    if (cat?.isBrandCategory && cat.status === 'ACTIVE') return cat.id
  }
  return null
}

/**
 * 当前列表上下文下可用的品牌快捷筛选项（按商品数降序）。
 * 不含 brand_category_id 条件，便于在已选品牌时仍可切换其它品牌。
 *
 * Fast path: SQL groupBy on brandCategoryId only — never load thousands of
 * product+SKU rows (that was freezing Accessories / large L1 listings).
 */
export const getAvailableBrandFilters = withResult(
  async (input: GetAvailableBrandFiltersInput): Promise<GetAvailableBrandFiltersOutput> => {
    const lang = normalizeProductLang(input.lang)
    const cacheKey = buildBrandFacetCacheKey(input, lang)
    const cached = brandFacetCache.get(cacheKey)
    if (cached && Date.now() - cached.at < BRAND_FACET_CACHE_TTL_MS) {
      return cached.value
    }

    const categoryContext = await resolveCategoryContext(input.category_id)
    // Scope to category / keyword only. Skip price/stock/search token scans —
    // those required loading SKUs and made L1 pages multi-second.
    const dbWhere = buildProductWhere(
      categoryContext,
      undefined,
      input.keyword_id,
      input.keyword_group_id,
      undefined,
    )

    if (input.min_rating !== undefined) {
      dbWhere.ratingAverage = { gte: input.min_rating }
    }

    const addBrandCount = (id: string | null | undefined, n: number) => {
      if (!id || n <= 0) return
      brandCounts.set(id, (brandCounts.get(id) || 0) + n)
    }

    const brandCounts = new Map<string, number>()
    const [byBrandField, byPrimaryCategory, byRelation] = await Promise.all([
      prisma.product.groupBy({
        by: ['brandCategoryId'],
        where: {
          ...dbWhere,
          brandCategoryId: { not: null },
        },
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ['categoryId'],
        where: {
          ...dbWhere,
          category: { isBrandCategory: true, status: 'ACTIVE' },
        },
        _count: { _all: true },
      }),
      prisma.product_category_relations.groupBy({
        by: ['categoryId'],
        where: {
          product: dbWhere,
          category: { isBrandCategory: true, status: 'ACTIVE' },
        },
        _count: { _all: true },
      }),
    ])

    for (const row of byBrandField) addBrandCount(row.brandCategoryId, row._count._all)
    for (const row of byPrimaryCategory) addBrandCount(row.categoryId, row._count._all)
    for (const row of byRelation) addBrandCount(row.categoryId, row._count._all)

    if (brandCounts.size === 0) {
      const empty: GetAvailableBrandFiltersOutput = { list: [] }
      brandFacetCache.set(cacheKey, { at: Date.now(), value: empty })
      return empty
    }

    const brandIds = Array.from(brandCounts.keys())
    const brandRows = await prisma.category.findMany({
      where: {
        id: { in: brandIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        iconUrl: true,
        translationsJson: true,
        isBrandCategory: true,
      },
    })

    const list: BrandCategoryItem[] = brandRows
      .map((brand) => ({
        category_id: brand.id,
        category_name: resolveCategoryDisplayName(brand.translationsJson, brand.name, lang),
        category_slug: brand.slug,
        product_count: brandCounts.get(brand.id) || 0,
        image_url: brand.imageUrl || brand.iconUrl || null,
      }))
      .filter((item) => item.product_count > 0)
      .sort(
        (a, b) =>
          b.product_count - a.product_count ||
          a.category_name.localeCompare(b.category_name, 'zh-CN'),
      )

    const output: GetAvailableBrandFiltersOutput = { list }
    if (brandFacetCache.size >= BRAND_FACET_CACHE_MAX) {
      const oldestKey = brandFacetCache.keys().next().value
      if (oldestKey !== undefined) brandFacetCache.delete(oldestKey)
    }
    brandFacetCache.set(cacheKey, { at: Date.now(), value: output })
    return output
  },
)

/**
 * 将商品加入购物车 (仅限 CUSTOMER，单规格或具体已选规格)
 */
export const addToCart = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: AddToCartInput): Promise<AddToCartOutput> => {
    const { userId } = getAuthContext()

    if (input.quantity <= 0) {
      throw storefrontError('checkout.errors.qtyInvalid')
    }

    const sku = await prisma.productsku.findUnique({
      where: { id: input.product_sku_id },
      include: {
        product: { include: { category: true } },
      },
    })

    if (
      !sku ||
      sku.productId !== input.product_id ||
      sku.product.status !== 'ACTIVE' ||
      sku.product.category.status !== 'ACTIVE'
    ) {
      throw storefrontError(
        !sku || sku.productId !== input.product_id
          ? 'checkout.errors.skuInvalid'
          : 'product.errors.unavailable',
      )
    }

    if (!isStorefrontQtyAllowed(sku.stock, input.quantity)) {
      throw storefrontError('product.errors.outOfStock')
    }

    let cart = await prisma.cart.findUnique({
      where: { accountId: userId },
      select: { id: true },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { account: { connect: { id: userId } } },
        select: { id: true },
      })
    }

    const existingItem = await prisma.cartitem.findFirst({
      where: {
        cartId: cart.id,
        productSkuId: sku.id,
        engravingText: null,
        engravingFont: null,
      },
      select: { id: true, quantity: true },
    })

    if (existingItem) {
      const newQuantity = existingItem.quantity + input.quantity
      if (newQuantity > sku.stock) {
        throw storefrontError('product.errors.outOfStock')
      }
      await prisma.cartitem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity, status: 'VALID' },
      })
    } else {
      await prisma.cartitem.create({
        data: {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: sku.productId } },
          productSku: { connect: { id: sku.id } },
          quantity: input.quantity,
          status: 'VALID',
        },
      })
    }

    return { success: true }
  }),
)

export interface GetWishlistProductsInput {
  product_ids: string[]
  lang?: string
}

export interface GetWishlistProductsOutput {
  list: ProductItem[]
}

/**
 * 按本地心愿单 ID 批量取商品卡片（保持传入顺序；已下架/不存在的跳过）。
 */
export const getWishlistProducts = withResult(async (
  input: GetWishlistProductsInput,
): Promise<GetWishlistProductsOutput> => {
  const ids = Array.from(
    new Set((input.product_ids || []).map(id => String(id || '').trim()).filter(Boolean)),
  ).slice(0, 200)
  if (!ids.length) return { list: [] }

  const lang = normalizeProductLang(input.lang)
  const [exchangeRate, pricingConfig] = await Promise.all([
    getUsdExchangeRate(prisma, { ttlMs: 60_000 }),
    loadPricingPromotionConfig(prisma),
  ])
  const siteWideCoef = getSiteWidePercentCoef(pricingConfig)

  const rows = await prisma.product.findMany({
    where: {
      id: { in: ids },
      ...storefrontVisibilityWhere(),
      category: { status: 'ACTIVE' },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      mainImageUrl: true,
      shortDescription: true,
      translationsJson: true,
      costPrice: true,
      tradeInfoJson: true,
      ratingAverage: true,
      ratingCount: true,
      createdAt: true,
      sortWeight: true,
      brandCategoryId: true,
      skus: {
        select: {
          id: true,
          skuCode: true,
          imageUrl: true,
          price: true,
          originalPrice: true,
          stockStatus: true,
        },
        orderBy: [{ createdAt: 'asc' as const }, { skuCode: 'asc' as const }],
      },
      brandCategory: {
        select: { name: true, brandKeywordsJson: true },
      },
      category: {
        select: {
          id: true,
          name: true,
          level: true,
          priceCoefficient: true,
          isBrandCategory: true,
          parentId: true,
          parent: {
            select: {
              name: true,
              priceCoefficient: true,
              isBrandCategory: true,
            },
          },
        },
      },
      relationCategories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              level: true,
              status: true,
              parentId: true,
              priceCoefficient: true,
              isBrandCategory: true,
              parent: {
                select: {
                  name: true,
                  priceCoefficient: true,
                  isBrandCategory: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const byId = new Map(rows.map(row => [row.id, row]))
  const list = ids
    .map(id => byId.get(id))
    .filter(Boolean)
    .map(row => mapProductRecordToItem(row, lang, exchangeRate, { siteWideCoef }))

  return { list }
})

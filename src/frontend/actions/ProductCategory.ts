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

const DEFAULT_BRAND_COLLAPSED_ROWS = 3
const CATEGORY_TOP_PROMOTION_TITLE = 'CATEGORY_TOP_PROMOTION'
const DEFAULT_KEYWORD_SCENE_AREAS: KeywordSceneArea[] = ['BOTH', 'LEFT_NAV', 'RECOMMENDATION']

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
  matchedCategoryId?: string
  matchedCategoryLevel?: number
  descendantCategoryIds: string[]
  categoryIdsForQuery: string[]
}

const resolveCategoryContext = async (categoryId?: string): Promise<ResolvedCategoryContext> => {
  if (!categoryId) {
    return {
      descendantCategoryIds: [],
      categoryIdsForQuery: []
    }
  }

  const currentCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      level: true,
      parentId: true,
      status: true,
      parent: {
        select: {
          id: true,
          status: true
        }
      }
    }
  })

  if (!currentCategory || currentCategory.status !== 'ACTIVE') {
    return {
      descendantCategoryIds: [],
      categoryIdsForQuery: []
    }
  }

  // L1 = level 1 or root (no parent). Expand to all ACTIVE direct L2 children.
  const isL1 = currentCategory.level === 1 || !currentCategory.parentId
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
    return {
      rootCategoryId: currentCategory.id,
      matchedCategoryId: currentCategory.id,
      matchedCategoryLevel: currentCategory.level || 1,
      descendantCategoryIds,
      categoryIdsForQuery: Array.from(new Set([currentCategory.id, ...descendantCategoryIds]))
    }
  }

  return {
    rootCategoryId: currentCategory.parent?.status === 'ACTIVE' ? currentCategory.parent.id : currentCategory.parentId || undefined,
    matchedCategoryId: currentCategory.id,
    matchedCategoryLevel: currentCategory.level,
    descendantCategoryIds: [],
    categoryIdsForQuery: [currentCategory.id]
  }
}

const buildProductWhere = (
  context: ResolvedCategoryContext,
  brandCategoryId?: string,
  keywordId?: string,
  keywordGroupId?: string,
  searchKeyword?: string,
) => {
  const where: any = {
    status: 'ACTIVE',
    category: {
      status: 'ACTIVE'
    }
  }

  const orConditions: any[] = []

  if (context.categoryIdsForQuery.length > 0) {
    // Primary categoryId in (L1 + L2 children)
    orConditions.push({
      categoryId: {
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
      ...where.category,
      OR: [
        { id: context.rootCategoryId },
        { parentId: context.rootCategoryId }
      ]
    }
  }

  if (orConditions.length > 0) {
    where.OR = orConditions
  }

  if (brandCategoryId) {
    where.brandCategoryId = brandCategoryId
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

  const normalizedSearchKeyword = typeof searchKeyword === 'string' ? searchKeyword.trim() : ''
  if (normalizedSearchKeyword) {
    // MySQL 不支持 Prisma mode:'insensitive'；依赖库表 utf8mb4_unicode_ci 做大小写不敏感 LIKE
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          {
            name: {
              contains: normalizedSearchKeyword,
            },
          },
          {
            skus: {
              some: {
                skuCode: {
                  contains: normalizedSearchKeyword,
                },
              },
            },
          },
        ],
      },
    ]
  }

  return where
}

// ===== Actions =====

/**
 * 获取活跃一级分类及其二级分类（用于目录树展示）
 */
export const getCategoryList = withResult(async (input?: GetCategoryListInput): Promise<GetCategoryListOutput> => {
  const lang = normalizeProductLang(input?.lang)
  const categories = await prisma.category.findMany({
    where: {
      status: 'ACTIVE'
    },
    include: {
      products: {
        where: { status: 'ACTIVE' },
        select: { id: true }
      },
      navConfig: true
    },
    orderBy: [
      { sortWeight: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  const mainCategories = categories.filter(cat => cat.level === 1 && !cat.isBrandCategory && cat.navConfig?.isVisible !== false)
  const childCategories = categories.filter(cat => cat.level === 2 && !cat.isBrandCategory)
  const brandCategories = categories.filter(cat => cat.isBrandCategory)

  return {
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
          .filter(child => child.parentId === cat.id)
          .slice()
          .sort((a, b) => b.sortWeight - a.sortWeight || a.name.localeCompare(b.name, 'zh-CN'))
          .map(child => ({
            category_id: child.id,
            category_name: resolveCategoryDisplayName(child.translationsJson, child.name, lang),
            category_slug: child.slug,
            image_url: child.imageUrl || child.iconUrl || null,
          })),
        brand_options: brandCategories
          .filter(brand => brand.parentId === cat.id)
          .map(brand => ({
            category_id: brand.id,
            category_name: resolveCategoryDisplayName(brand.translationsJson, brand.name, lang),
            category_slug: brand.slug,
            product_count: brand.products.length,
            image_url: brand.imageUrl || brand.iconUrl || null,
          }))
          .sort((a, b) => b.product_count - a.product_count || a.category_name.localeCompare(b.category_name, 'zh-CN'))
      }
    })
  }
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
 * 读取目录页海报，优先返回与当前一级分类关联的数据。
 */
export const getCategoryPosterList = withResult(async (input: GetCategoryPosterListInput): Promise<GetCategoryPosterListOutput> => {
  const categoryContext = await resolveCategoryContext(input.category_id)
  const mainCategoryId = categoryContext.rootCategoryId
  const bannerRecords = await prisma.categorybanner.findMany({
    where: {
      isEnabled: true
    },
    orderBy: [
      { sortWeight: 'desc' },
      { updatedAt: 'desc' }
    ]
  })

  const posterList = bannerRecords.map((banner) => ({
    poster_id: banner.id,
    title: banner.title || '首页横幅',
    subtitle: null,
    image_url: banner.imageUrl,
    link_text: null,
    link_url: banner.linkUrl || null,
    category_id: null,
    sort_weight: Number(banner.sortWeight ?? 0)
  }))

  const sortedPosterList = mainCategoryId
    ? [
        ...posterList.filter(item => item.category_id === mainCategoryId),
        ...posterList.filter(item => !item.category_id),
        ...posterList.filter(item => item.category_id && item.category_id !== mainCategoryId)
      ]
    : posterList

  return {
    list: [...sortedPosterList].sort((a, b) => b.sort_weight - a.sort_weight)
  }
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

/**
 * 获取商品列表，支持多重条件筛选、排序和分页。
 */
export const getProductList = withResult(async (input: GetProductListInput): Promise<GetProductListOutput> => {
  const page = input.page && input.page > 0 ? input.page : 1
  const pageSize = input.page_size && input.page_size > 0 ? input.page_size : 24
  const lang = normalizeProductLang(input.lang)
  const exchangeRate = await getUsdExchangeRate(prisma)
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

  const dbProducts = await prisma.product.findMany({
    where: dbWhere,
    include: {
      skus: true,
      brandCategory: true,
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
        include: {
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
      relationKeywords: {
        select: {
          keywordId: true
        }
      },
      keywordGroupLinks: {
        select: {
          keywordGroupId: true,
          sortWeight: true
        }
      }
    },
    take: 2000
  })

  const normalizedSearchKeyword =
    typeof input.search_keyword === 'string' ? input.search_keyword.trim().toLowerCase() : ''

  let items: ProductItem[] = dbProducts
    .filter((p) => {
      if (!normalizedSearchKeyword) return true
      const nameMatched = (p.name || '').toLowerCase().includes(normalizedSearchKeyword)
      const skuMatched = p.skus.some((sku) =>
        (sku.skuCode || '').toLowerCase().includes(normalizedSearchKeyword),
      )
      return nameMatched || skuMatched
    })
    .map((p) => {
    const skus = p.skus
    const skuCount = skus.length
    const sortedSkus = [...skus].sort((a, b) => a.price.toNumber() - b.price.toNumber())
    const defaultSku = sortedSkus.length > 0 ? sortedSkus[0] : null

    let stockStatus: StockStatusEnum = 'OUT_OF_STOCK'
    if (skus.some(s => s.stockStatus === 'IN_STOCK')) {
      stockStatus = 'IN_STOCK'
    } else if (skus.some(s => s.stockStatus === 'LOW_STOCK')) {
      stockStatus = 'LOW_STOCK'
    }

    const pricingCoeffs = pickFrontPricingCategoryCoeffs({
      primary: p.category,
      relations: (p.relationCategories || []).map((rel) => rel.category),
    })
    const priceRmb = resolveFrontRmbSellingPrice({
      skuPriceRmb: defaultSku ? defaultSku.price.toNumber() : 0,
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
    const hasDiscount = originalPriceNum !== null && originalPriceNum > priceNum
    const usdPrices = skus
      .map((sku) =>
        toUsdPrice(
          resolveFrontRmbSellingPrice({
            skuPriceRmb: sku.price.toNumber(),
            costPrice: p.costPrice,
            ...pricingCoeffs,
          }),
          exchangeRate,
        ),
      )
      .filter((value) => Number.isFinite(value) && value > 0)
    const priceMax =
      usdPrices.length > 0 ? Math.max(...usdPrices) : null
    const minOrderQuantity = Math.max(1, Number((p.tradeInfoJson as any)?.minOrderQty ?? 0) || 1)
    const translated = pickProductTranslation((p as { translationsJson?: unknown }).translationsJson, lang)

    return {
      product_id: p.id,
      product_slug: p.slug,
      product_name: resolveProductDisplayName(
        p.name,
        (p as { translationsJson?: unknown }).translationsJson,
        lang,
      ),
      main_image_url: p.mainImageUrl,
      short_description: translated?.shortDescription?.trim() || p.shortDescription,
      rating_average: p.ratingAverage,
      rating_count: p.ratingCount,
      stock_status: stockStatus,
      price: priceNum,
      original_price: originalPriceNum,
      has_discount: hasDiscount,
      sku_count: skuCount,
      first_sku_id: defaultSku ? defaultSku.id : '',
      first_sku_price_rmb: priceRmb,
      created_at_timestamp: p.createdAt.getTime(),
      sort_weight: p.sortWeight,
      brand_category_id: p.brandCategoryId,
      brand_category_name: p.brandCategory?.name || null,
      variant_thumbnails: collectVariantThumbnails(skus, p.mainImageUrl),
      min_order_quantity: minOrderQuantity,
      price_max: priceMax && priceMax > priceNum ? priceMax : null,
    }
  })

  if (input.min_price !== undefined) {
    items = items.filter(i => i.price >= input.min_price!)
  }

  if (input.max_price !== undefined) {
    items = items.filter(i => i.price <= input.max_price!)
  }

  if (input.has_discount) {
    items = items.filter(i => i.has_discount)
  }

  if (input.stock_status && input.stock_status.length > 0) {
    items = items.filter(i => input.stock_status!.includes(i.stock_status))
  }

  const sortBy = input.sort_by || 'NEWEST'
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

  const total = items.length
  const skip = (page - 1) * pageSize

  return {
    list: items.slice(skip, skip + pageSize),
    total
  }
})

/**
 * 将商品加入购物车 (仅限 CUSTOMER，单规格或具体已选规格)
 */
export const addToCart = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: AddToCartInput): Promise<AddToCartOutput> => {
    const { userId } = getAuthContext()

    const product = await prisma.product.findUnique({
      where: { id: input.product_id },
      include: { category: true }
    })

    if (!product || product.status !== 'ACTIVE' || product.category.status !== 'ACTIVE') {
      throw new Error('该商品不存在或已下架')
    }

    const sku = await prisma.productsku.findUnique({
      where: { id: input.product_sku_id }
    })

    if (!sku || sku.productId !== input.product_id) {
      throw new Error('请求的商品规格无效')
    }

    if (input.quantity <= 0) {
      throw new Error('加购数量必须大于零')
    }

    if (sku.stock < input.quantity) {
      throw new Error('商品库存不足')
    }

    let cart = await prisma.cart.findUnique({
      where: { accountId: userId }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          account: { connect: { id: userId } }
        }
      })
    }

    const existingItem = await prisma.cartitem.findFirst({
      where: {
        cartId: cart.id,
        productSkuId: sku.id,
        engravingText: null,
        engravingFont: null
      }
    })

    if (existingItem) {
      const newQuantity = existingItem.quantity + input.quantity
      if (newQuantity > sku.stock) {
        throw new Error('加购后数量超过了当前商品库存上限')
      }

      await prisma.cartitem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          status: 'VALID'
        }
      })
    } else {
      await prisma.cartitem.create({
        data: {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: product.id } },
          productSku: { connect: { id: sku.id } },
          quantity: input.quantity,
          status: 'VALID'
        }
      })
    }

    return { success: true }
  })
)
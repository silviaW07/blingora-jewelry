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
}

export interface BrandCategoryItem {
  category_id: string
  category_name: string
  category_slug: string | null
  product_count: number
}

export interface CategoryItem {
  category_id: string
  category_name: string
  category_slug: string | null
  parent_category_id: string | null
  level: number
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
  sort_weight: number
}

export interface KeywordItem {
  keyword_id: string
  keyword_label: string
  category_id: string | null
  sort_weight: number
  group_id: string
  group_name: string
  scene_area: KeywordSceneArea
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
}

// ===== Input / Output =====

export interface GetCategoryListOutput {
  list: CategoryItem[]
}

export interface GetCategoryDetailInput {
  category_id: string
}

export interface GetCategoryDetailOutput {
  detail: CategoryDetail | null
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
}

export interface GetKeywordGroupListOutput {
  list: KeywordGroupItem[]
}

export interface GetKeywordListInput {
  group_id?: string
  scene_area?: KeywordSceneArea
}

export interface GetKeywordListOutput {
  list: KeywordItem[]
}

export interface CategoryTopPromotionConfig {
  enabled: boolean
  message: string | null
  end_time: string | null
  background_color: string | null
  text_color: string | null
}

export interface GetCategoryTopPromotionOutput {
  promotion: CategoryTopPromotionConfig | null
}

export interface GetProductListInput {
  category_id?: string
  brand_category_id?: string
  stock_status?: StockStatusEnum[]
  sort_by?: SortByEnum
  page?: number
  page_size?: number
  min_price?: number
  max_price?: number
  has_discount?: boolean
  min_rating?: number
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
import {
  requireRole, getAuthContext,
  withResult, UserRole
} from '@/frontend/action_utils'

const USD_EXCHANGE_RATE = 6.5
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

const toUsdPrice = (rmbPrice: number | null | undefined): number => {
  if (typeof rmbPrice !== 'number' || Number.isNaN(rmbPrice)) {
    return 0
  }

  return Number((rmbPrice / USD_EXCHANGE_RATE).toFixed(2))
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

  return {
    enabled,
    message,
    end_time: endTime,
    background_color: backgroundColor,
    text_color: textColor
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
) => {
  const where: any = {
    status: 'ACTIVE',
    category: {
      status: 'ACTIVE'
    }
  }

  const orConditions: any[] = []

  if (context.categoryIdsForQuery.length > 0) {
    orConditions.push({
      categoryId: {
        in: context.categoryIdsForQuery
      }
    })
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

  return where
}

// ===== Actions =====

/**
 * 获取活跃一级分类及其二级分类（用于目录树展示）
 */
export const getCategoryList = withResult(async (): Promise<GetCategoryListOutput> => {
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
    list: mainCategories.map(cat => ({
      category_id: cat.id,
      category_name: cat.navConfig?.navTitle?.trim() || cat.name,
      category_slug: cat.slug,
      parent_category_id: cat.parentId,
      level: cat.level,
      display_config: parseCategoryDisplayConfig(cat.categoryDisplayConfigJson),
      children: childCategories
        .filter(child => child.parentId === cat.id)
        .map(child => ({
          category_id: child.id,
          category_name: child.name,
          category_slug: child.slug
        })),
      brand_options: brandCategories
        .filter(brand => brand.parentId === cat.id)
        .map(brand => ({
          category_id: brand.id,
          category_name: brand.name,
          category_slug: brand.slug,
          product_count: brand.products.length
        }))
        .sort((a, b) => b.product_count - a.product_count || a.category_name.localeCompare(b.category_name, 'zh-CN'))
    }))
  }
})

/**
 * 获取特定分类详情与该分类下的有效商品数（用于分类标题区展示）
 */
export const getCategoryDetail = withResult(async (input: GetCategoryDetailInput): Promise<GetCategoryDetailOutput> => {
  const category = await prisma.category.findUnique({
    where: { id: input.category_id },
    include: {
      parent: true
    }
  })

  if (!category || category.status !== 'ACTIVE') {
    return { detail: null }
  }

  const mainCategory = category.level === 1
    ? category
    : category.parent && category.parent.status === 'ACTIVE' && !category.parent.isBrandCategory
      ? category.parent
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
      category_name: category.name,
      category_description: category.description || mainCategory.description,
      product_count: productCount,
      current_category_id: category.id,
      current_category_level: category.level,
      parent_category_id: category.level === 2 ? mainCategory.id : null,
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
  const activeSettings = await prisma.sitesetting.findMany({
    where: {
      settingType: 'HOMEPAGE_POSTER',
      isActive: true
    },
    orderBy: [
      { sortWeight: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  const posterList = activeSettings.flatMap((setting) => {
    const rawContent = setting.contentJson as any
    const candidateItems = Array.isArray(rawContent)
      ? rawContent
      : Array.isArray(rawContent?.items)
        ? rawContent.items
        : [rawContent]

    return candidateItems
      .filter(Boolean)
      .map((item: any, index: number) => ({
        poster_id: item.id || `${setting.id}-${index}`,
        title: item.title || setting.title,
        subtitle: item.subtitle || setting.subtitle || null,
        image_url: item.imageUrl || setting.imageUrl || null,
        link_text: item.linkText || item.buttonText || item.ctaText || null,
        link_url: item.linkUrl || item.href || item.url || null,
        category_id: item.categoryId || rawContent?.categoryId || null,
        sort_weight: Number(item.sortWeight ?? setting.sortWeight ?? 0)
      }))
      .filter((item) => !!item.image_url)

      .sort((a, b) => b.sort_weight - a.sort_weight)
  })

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

  const groups = await prisma.keywordgroup.findMany({
    where: {
      isActive: true,
      ...(input.group_id ? { id: input.group_id } : {}),
      sceneArea: {
        in: sceneAreas
      }
    },
    orderBy: [
      { sortWeight: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  return {
    list: groups.map((group) => ({
      group_id: group.id,
      group_name: group.name,
      scene_area: group.sceneArea as KeywordSceneArea,
      sort_weight: group.sortWeight
    }))
  }
})

/**
 * 获取关键词项，支持按专区过滤并允许通过分组 ID 独立读取。
 */
export const getKeywordList = withResult(async (input: GetKeywordListInput = {}): Promise<GetKeywordListOutput> => {
  const sceneAreas = resolveKeywordSceneAreas(normalizeKeywordSceneArea(input.scene_area))

  const groups = await prisma.keywordgroup.findMany({
    where: {
      isActive: true,
      ...(input.group_id ? { id: input.group_id } : {}),
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
    orderBy: [
      { sortWeight: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  return {
    list: groups.flatMap((group) => group.keywords.map((keyword) => ({
      keyword_id: keyword.id,
      keyword_label: keyword.keyword,
      category_id: keyword.categoryLinks[0]?.categoryId || null,
      sort_weight: keyword.sortWeight,
      group_id: group.id,
      group_name: group.name,
      scene_area: group.sceneArea as KeywordSceneArea
    })))
      .sort((a, b) => b.sort_weight - a.sort_weight || a.keyword_label.localeCompare(b.keyword_label, 'zh-CN'))
  }
})

/**
 * 获取商品列表，支持多重条件筛选、排序和分页。
 */
export const getProductList = withResult(async (input: GetProductListInput): Promise<GetProductListOutput> => {
  const page = input.page && input.page > 0 ? input.page : 1
  const pageSize = input.page_size && input.page_size > 0 ? input.page_size : 24
  const categoryContext = await resolveCategoryContext(input.category_id)

  const dbWhere: any = buildProductWhere(categoryContext, input.brand_category_id)

  if (input.min_rating !== undefined) {
    dbWhere.ratingAverage = { gte: input.min_rating }
  }

  const dbProducts = await prisma.product.findMany({
    where: dbWhere,
    include: {
      skus: true,
      brandCategory: true
    },
    take: 2000
  })

  let items: ProductItem[] = dbProducts.map((p) => {
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

    const priceRmb = defaultSku ? defaultSku.price.toNumber() : 0
    const originalPriceRmb = defaultSku?.originalPrice ? defaultSku.originalPrice.toNumber() : null
    const priceNum = toUsdPrice(priceRmb)
    const originalPriceNum = originalPriceRmb !== null ? toUsdPrice(originalPriceRmb) : null
    const hasDiscount = originalPriceNum !== null && originalPriceNum > priceNum

    return {
      product_id: p.id,
      product_slug: p.slug,
      product_name: p.name,
      main_image_url: p.mainImageUrl,
      short_description: p.shortDescription,
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
      brand_category_name: p.brandCategory?.name || null
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

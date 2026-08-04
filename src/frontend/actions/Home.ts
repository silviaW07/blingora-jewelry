'use server'

import {
  addToCart,
  getCategoryDetail,
  getCategoryList,
  getProductList,
  type ProductItem,
  type StockStatusEnum,
} from '@/frontend/actions/ProductCategory'
import { readHomeRecommendZonesWithCache } from '@/backend/actions/homeRecommendZoneCache'
import prisma from '@/tools/prisma'
import { withResult } from '@/frontend/action_utils'
import {
  buildLast6Months,
  formatMonthLabel,
  getDateKeyRange,
  getLast6MonthsRangeStart,
  getMonthDateRange,
  toDateKey,
  toDateLabel,
  toMonthKey,
} from '@/frontend/utils/dailyNewArrival'
import { normalizeProductLang, pickProductTranslation, resolveCategoryDisplayName, resolveProductDisplayName } from '@/frontend/i18n/productTranslation'
import {
  pickFrontPricingCategoryCoeffs,
  resolveFrontRmbSellingPrice,
  toDecimalNumber,
} from '@/shared/priceCoefficient'
import { optimizeCatalogImageUrl, resolveCategoryCardImageUrl } from '@/shared/imageUrl'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'

type HomeRecommendZoneType = 'PRODUCT' | 'CATEGORY' | 'SIDE_NAV'

export interface HomeRecommendProductCard {
  itemId: string
  entityType: 'PRODUCT'
  productId: string
  categoryId: string | null
  productName: string
  productSlug: string
  imageUrl: string | null
  shortDescription: string | null
  /** ACTIVE=可售商品；DRAFT=快速发图展示商品（无价格/规格） */
  status: 'ACTIVE' | 'DRAFT' | string
  price: number | null
  originalPrice: number | null
  ratingAverage: number
  ratingCount: number
  skuCount: number
  defaultSkuId: string | null
}

export interface HomeRecommendCategoryCard {
  itemId: string
  entityType: 'CATEGORY'
  categoryId: string
  categoryName: string
  categorySlug: string | null
  imageUrl: string | null
  description: string | null
  productCount: number
  /** 该类目下最新 ACTIVE 商品（主分类或 relationCategories），按 createdAt desc */
  latestProducts: HomeRecommendProductCard[]
}

const DEFAULT_CATEGORY_LATEST_PRODUCT_LIMIT = 4

export interface HomeRecommendSideNavItem {
  itemId: string
  entityType: 'SIDE_NAV'
  categoryId: string
  categoryName: string
  categorySlug: string | null
  level: number
  parentCategoryId: string | null
  parentCategoryName: string | null
  productCount: number
}

export interface HomeRecommendZoneSection {
  zoneId: string
  title: string
  zoneType: HomeRecommendZoneType
  pcCols: 3 | 4 | 5
  mobileCols: 1 | 2
  pcRows: number
  sortWeight: number
  items: Array<HomeRecommendProductCard | HomeRecommendCategoryCard | HomeRecommendSideNavItem>
}

const toUsdPrice = (rmbPrice: number | null | undefined, exchangeRate: number): number => {
  if (typeof rmbPrice !== 'number' || Number.isNaN(rmbPrice) || rmbPrice <= 0) {
    return 0
  }

  return toUsdFromCny(rmbPrice, exchangeRate)
}

const normalizePcCols = (value: number): 3 | 4 | 5 => {
  if (value === 3 || value === 5) {
    return value
  }

  return 4
}

const normalizeMobileCols = (value: number): 1 | 2 => {
  return value === 1 ? 1 : 2
}

const normalizePcRows = (value: number): number => {
  if (!Number.isFinite(value)) return 2
  const rows = Math.floor(value)
  if (rows < 1) return 1
  if (rows > 12) return 12
  return rows
}

export const getHomeRecommendZones = async (input?: {
  lang?: string
}): Promise<{ zones: HomeRecommendZoneSection[] }> => {
  const lang = normalizeProductLang(input?.lang)
  const exchangeRate = await getUsdExchangeRate(prisma)
  const zones = await readHomeRecommendZonesWithCache()

  // 专区结构可缓存，但分类名称会在后台改名后过期；每次请求按 ID 回源最新名称/翻译
  const categoryIds = Array.from(
    new Set(
      zones.flatMap((zone) =>
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
          imageUrl: true,
          bannerImageUrl: true,
          description: true,
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

  // 类目卡封面：无 imageUrl 时回退到该类目下商品主图，避免前端关键词搜图长时间转圈
  const categoryIdsNeedingCover = freshCategories
    .filter((category) => !String(category.imageUrl || '').trim() && !String(category.bannerImageUrl || '').trim())
    .map((category) => category.id)
  const coverImageByCategoryId = new Map<string, string>()
  if (categoryIdsNeedingCover.length > 0) {
    const coverProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { categoryId: { in: categoryIdsNeedingCover } },
          { relationCategories: { some: { categoryId: { in: categoryIdsNeedingCover } } } },
        ],
      },
      select: {
        categoryId: true,
        mainImageUrl: true,
        relationCategories: {
          where: { categoryId: { in: categoryIdsNeedingCover } },
          select: { categoryId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(400, categoryIdsNeedingCover.length * 8),
    })

    for (const product of coverProducts) {
      const imageUrl = optimizeCatalogImageUrl(product.mainImageUrl, 640)
      if (!imageUrl) continue
      if (product.categoryId && categoryIdsNeedingCover.includes(product.categoryId) && !coverImageByCategoryId.has(product.categoryId)) {
        coverImageByCategoryId.set(product.categoryId, imageUrl)
      }
      for (const relation of product.relationCategories) {
        if (!coverImageByCategoryId.has(relation.categoryId)) {
          coverImageByCategoryId.set(relation.categoryId, imageUrl)
        }
      }
    }
  }

  // 商品数：主分类 + 多分类关联一起统计，避免类目卡长期显示 0
  const productCountByCategoryId = new Map<string, number>()
  if (categoryIds.length > 0) {
    const [primaryCounts, relationCounts] = await Promise.all([
      prisma.product.groupBy({
        by: ['categoryId'],
        where: {
          status: 'ACTIVE',
          categoryId: { in: categoryIds },
        },
        _count: { _all: true },
      }),
      prisma.product_category_relations.groupBy({
        by: ['categoryId'],
        where: {
          categoryId: { in: categoryIds },
          product: { status: 'ACTIVE' },
        },
        _count: { _all: true },
      }),
    ])
    for (const row of primaryCounts) {
      productCountByCategoryId.set(row.categoryId, (productCountByCategoryId.get(row.categoryId) || 0) + row._count._all)
    }
    for (const row of relationCounts) {
      productCountByCategoryId.set(row.categoryId, (productCountByCategoryId.get(row.categoryId) || 0) + row._count._all)
    }
  }

  // CATEGORY 专区：按类目拉取最新 ACTIVE 商品（主分类 + 多分类关联），供卡片展示图/标题/价
  const categoryZoneCategoryIds = Array.from(
    new Set(
      zones
        .filter((zone) => zone.zoneType === 'CATEGORY')
        .flatMap((zone) =>
          zone.items
            .filter((item) => item.entityType === 'CATEGORY')
            .map((item) => item.categoryId || item.category?.id || null)
            .filter((id): id is string => Boolean(id)),
        ),
    ),
  )
  const maxLatestPerCategory = Math.max(
    DEFAULT_CATEGORY_LATEST_PRODUCT_LIMIT,
    ...zones
      .filter((zone) => zone.zoneType === 'CATEGORY')
      .map((zone) => normalizePcCols(zone.pcCols)),
  )
  const latestProductsByCategoryId = new Map<string, HomeRecommendProductCard[]>()

  if (categoryZoneCategoryIds.length > 0) {
    const latestCandidates = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { categoryId: { in: categoryZoneCategoryIds } },
          { relationCategories: { some: { categoryId: { in: categoryZoneCategoryIds } } } },
        ],
        skus: { some: {} },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        mainImageUrl: true,
        shortDescription: true,
        status: true,
        categoryId: true,
        costPrice: true,
        ratingAverage: true,
        ratingCount: true,
        translationsJson: true,
        createdAt: true,
        skus: {
          select: {
            id: true,
            price: true,
            originalPrice: true,
          },
          orderBy: { price: 'asc' },
        },
        category: {
          select: {
            name: true,
            level: true,
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
        relationCategories: {
          select: {
            categoryId: true,
            category: {
              select: {
                name: true,
                level: true,
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
      orderBy: { createdAt: 'desc' },
      take: Math.min(500, categoryZoneCategoryIds.length * maxLatestPerCategory * 4),
    })

    const mapLatestProductCard = (
      product: (typeof latestCandidates)[number],
      itemIdPrefix: string,
    ): HomeRecommendProductCard | null => {
      const sortedSkus = [...product.skus].sort((a, b) => a.price.toNumber() - b.price.toNumber())
      const defaultSku = sortedSkus[0]
      if (!defaultSku) return null

      const pricingCoeffs = pickFrontPricingCategoryCoeffs({
        primary: product.category,
        relations: (product.relationCategories || []).map((rel) => rel.category),
      })
      const priceRmb = resolveFrontRmbSellingPrice({
        skuPriceRmb: defaultSku.price.toNumber(),
        costPrice: product.costPrice,
        ...pricingCoeffs,
      })
      const cost = toDecimalNumber(product.costPrice)
      const originalPriceRmb =
        cost !== null && cost > 0
          ? Number((priceRmb * 1.1).toFixed(2))
          : defaultSku.originalPrice
            ? defaultSku.originalPrice.toNumber()
            : null
      const translatedName = resolveProductDisplayName(
        product.name,
        product.translationsJson,
        lang,
      )

      return {
        itemId: `${itemIdPrefix}-${product.id}`,
        entityType: 'PRODUCT' as const,
        productId: product.id,
        categoryId: product.categoryId,
        productName: translatedName,
        productSlug: product.slug,
        imageUrl: optimizeCatalogImageUrl(product.mainImageUrl, 720),
        shortDescription: product.shortDescription,
        status: product.status,
        price: toUsdPrice(priceRmb, exchangeRate),
        originalPrice: originalPriceRmb !== null ? toUsdPrice(originalPriceRmb, exchangeRate) : null,
        ratingAverage: product.ratingAverage,
        ratingCount: product.ratingCount,
        skuCount: product.skus.length,
        defaultSkuId: defaultSku.id,
      }
    }

    for (const product of latestCandidates) {
      const linkedCategoryIds = new Set<string>()
      if (product.categoryId && categoryZoneCategoryIds.includes(product.categoryId)) {
        linkedCategoryIds.add(product.categoryId)
      }
      for (const relation of product.relationCategories) {
        if (categoryZoneCategoryIds.includes(relation.categoryId)) {
          linkedCategoryIds.add(relation.categoryId)
        }
      }

      for (const linkedCategoryId of linkedCategoryIds) {
        const bucket = latestProductsByCategoryId.get(linkedCategoryId) || []
        if (bucket.length >= maxLatestPerCategory) continue
        const card = mapLatestProductCard(product, `cat-latest-${linkedCategoryId}`)
        if (!card) continue
        bucket.push(card)
        latestProductsByCategoryId.set(linkedCategoryId, bucket)
      }
    }
  }

  const result = zones
    .map((zone): HomeRecommendZoneSection => {
      const categoryLatestLimit =
        zone.zoneType === 'CATEGORY'
          ? Math.max(DEFAULT_CATEGORY_LATEST_PRODUCT_LIMIT, normalizePcCols(zone.pcCols))
          : DEFAULT_CATEGORY_LATEST_PRODUCT_LIMIT
      const items = zone.items.reduce<Array<HomeRecommendProductCard | HomeRecommendCategoryCard | HomeRecommendSideNavItem>>((acc, item) => {
        if (item.entityType === 'PRODUCT') {
          const product = item.product
          if (!product || (product.status !== 'ACTIVE' && product.status !== 'DRAFT')) {
            return acc
          }

          const isDraft = product.status === 'DRAFT'
          const sortedSkus = [...product.skus].sort((a, b) => a.price.toNumber() - b.price.toNumber())
          const defaultSku = sortedSkus[0]

          // 草稿展示商品允许无 SKU；上架商品仍需至少一个 SKU 才展示
          if (!isDraft && !defaultSku) {
            return acc
          }

          const pricingCoeffs = pickFrontPricingCategoryCoeffs({
            primary: (product as {
              category?: Parameters<typeof pickFrontPricingCategoryCoeffs>[0]['primary']
              relationCategories?: Array<{ category?: Parameters<typeof pickFrontPricingCategoryCoeffs>[0]['primary'] }>
            }).category,
            relations: (
              (product as {
                relationCategories?: Array<{ category?: Parameters<typeof pickFrontPricingCategoryCoeffs>[0]['primary'] }>
              }).relationCategories || []
            ).map((rel) => rel.category),
          })
          const priceRmb = defaultSku
            ? resolveFrontRmbSellingPrice({
                skuPriceRmb: defaultSku.price.toNumber(),
                costPrice: product.costPrice,
                ...pricingCoeffs,
              })
            : null
          const cost = toDecimalNumber(product.costPrice)
          const originalPriceRmb =
            priceRmb === null
              ? null
              : cost !== null && cost > 0
                ? Number((priceRmb * 1.1).toFixed(2))
                : defaultSku?.originalPrice
                  ? defaultSku.originalPrice.toNumber()
                  : null
          const price = priceRmb !== null ? toUsdPrice(priceRmb, exchangeRate) : null
          const originalPrice = originalPriceRmb !== null ? toUsdPrice(originalPriceRmb, exchangeRate) : null
          const translatedName = resolveProductDisplayName(
            product.name,
            (product as { translationsJson?: unknown }).translationsJson,
            lang,
          )

          acc.push({
            itemId: item.id,
            entityType: 'PRODUCT' as const,
            productId: product.id,
            categoryId: product.categoryId,
            productName: translatedName,
            productSlug: product.slug,
            imageUrl: optimizeCatalogImageUrl(product.mainImageUrl, 720),
            shortDescription: product.shortDescription,
            status: product.status,
            price,
            originalPrice,
            ratingAverage: product.ratingAverage,
            ratingCount: product.ratingCount,
            skuCount: product.skus.length,
            defaultSkuId: defaultSku?.id || null,
          })

          return acc
        }

        const cachedCategory = item.category
        const categoryId = item.categoryId || cachedCategory?.id
        const category = (categoryId && freshCategoryMap.get(categoryId)) || cachedCategory
        if (!category || category.status !== 'ACTIVE') {
          return acc
        }

        const categoryName = resolveCategoryDisplayName(
          (category as { translationsJson?: unknown }).translationsJson,
          category.name,
          lang,
        )
        const parentCategoryName = category.parent
          ? resolveCategoryDisplayName(
              (category.parent as { translationsJson?: unknown }).translationsJson,
              category.parent.name,
              lang,
            )
          : null

        if (item.entityType === 'SIDE_NAV') {
          acc.push({
            itemId: item.id,
            entityType: 'SIDE_NAV' as const,
            categoryId: category.id,
            categoryName,
            categorySlug: category.slug,
            level: category.level,
            parentCategoryId: category.parentId,
            parentCategoryName,
            productCount: category._count.products,
          })

          return acc
        }

        acc.push({
          itemId: item.id,
          entityType: 'CATEGORY' as const,
          categoryId: category.id,
          categoryName,
          categorySlug: category.slug,
          imageUrl: resolveCategoryCardImageUrl(
            category.imageUrl,
            category.bannerImageUrl,
            coverImageByCategoryId.get(category.id) || null,
          ),
          description: category.description,
          productCount: productCountByCategoryId.get(category.id) ?? category._count.products,
          latestProducts: (latestProductsByCategoryId.get(category.id) || []).slice(0, categoryLatestLimit),
        })

        return acc
      }, [])

      // 激活专区即使暂无有效明细也保留，保证绿灯专区数量与前台区块一致
      return {
        zoneId: zone.id,
        title: zone.title,
        zoneType: zone.zoneType,
        pcCols: normalizePcCols(zone.pcCols),
        mobileCols: normalizeMobileCols(zone.mobileCols),
        pcRows: normalizePcRows((zone as { pcRows?: number }).pcRows ?? 2),
        sortWeight: zone.sortWeight,
        items,
      }
    })

  return {
    zones: result,
  }
}

export { getCategoryList, getCategoryDetail, getProductList }

export const getHomeCategoryGuide = getCategoryList

export const getHomeFeaturedProducts = async (input?: {
  categoryId?: string
  lang?: string
}) => {
  const selectedCategoryId = input?.categoryId?.trim() || ''
  const [detailResult, productResult] = await Promise.all([
    selectedCategoryId
      ? getCategoryDetail({ category_id: selectedCategoryId, lang: input?.lang })
      : Promise.resolve({ detail: null }),
    getProductList({ category_id: selectedCategoryId || undefined, lang: input?.lang }),
  ])

  return {
    selectedCategoryId: selectedCategoryId || null,
    bannerCategory: detailResult.detail
      ? {
          categoryId: detailResult.detail.category_id,
          categoryName: detailResult.detail.category_name,
          categoryDescription: detailResult.detail.category_description,
          imageUrl: null,
          bannerImageUrl: null,
          slug: null,
          productCount: detailResult.detail.product_count,
        }
      : null,
    products: productResult.list.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      productCode: item.product_slug,
      mainImageUrl: item.main_image_url,
      ratingAverage: item.rating_average,
      ratingCount: item.rating_count,
      tradeInfo: null,
      sellingPoints: item.short_description
        ? [
            {
              title: 'Category Highlight',
              content: item.short_description,
            },
          ]
        : null,
      defaultSkuId: item.first_sku_id,
      price: item.price,
      originalPrice: item.original_price,
      deliveryDays: null,
      brandCategoryId: item.brand_category_id,
      brandName: item.brand_category_name,
    })),
  }
}

export const getBrandShelf = async (input?: {
  categoryId?: string
  lang?: string
}) => {
  const productResult = await getProductList({
    category_id: input?.categoryId?.trim() || undefined,
    sort_by: 'POPULARITY',
    page_size: 24,
    lang: input?.lang,
  })

  const grouped = new Map<string, Array<{
    brandName: string
    productId: string
    productName: string
    productCode: string
    mainImageUrl: string
    defaultSkuId: string
    price: number
    originalPrice: number | null
    ratingAverage: number
    ratingCount: number
    shortDescription: string | null
  }>>()

  productResult.list.forEach((item) => {
    const brandName = item.brand_category_name || '精选推荐'
    const current = grouped.get(brandName) || []
    current.push({
      brandName,
      productId: item.product_id,
      productName: item.product_name,
      productCode: item.product_slug,
      mainImageUrl: item.main_image_url,
      defaultSkuId: item.first_sku_id,
      price: item.price,
      originalPrice: item.original_price,
      ratingAverage: item.rating_average,
      ratingCount: item.rating_count,
      shortDescription: item.short_description,
    })
    grouped.set(brandName, current)
  })

  return {
    brands: Array.from(grouped.entries()).map(([brandName, items]) => ({
      brandName,
      items: items.slice(0, 8),
    })),
  }
}

export const getHomeReviewSection = async () => ({
  summary: {
    averageRating: 0,
    totalReviews: 0,
    highlightTags: [],
  },
  reviews: [],
})

export const getHomeSceneKeywordGroups = async () => ({
  floors: [],
})

export const addCartItem = async (input: {
  productId: string
  productSkuId: string
}) => {
  await addToCart({
    product_id: input.productId,
    product_sku_id: input.productSkuId,
    quantity: 1,
  })
}

export interface DailyNewArrivalMonthCard {
  year: number
  month: number
  monthKey: string
  label: string
  productCount: number
}

export interface GetDailyNewArrivalCalendarOutput {
  months: DailyNewArrivalMonthCard[]
  totalActiveProducts: number
}

export interface GetDailyNewArrivalProductsInput {
  /** 可选：指定年月则只返回该月；不传则返回最近 6 个月（含当月）全部上新 */
  year?: number
  month?: number
  lang?: string
}

export interface GetDailyNewArrivalProductsOutput {
  list: ProductItem[]
  total: number
}

const mapActiveProductToItem = (
  product: {
  id: string
  slug: string
  name: string
  mainImageUrl: string
  shortDescription: string | null
  ratingAverage: number
  ratingCount: number
  sortWeight: number
  createdAt: Date
  brandCategoryId: string | null
  brandCategory: { name: string } | null
  costPrice?: unknown
  tradeInfoJson?: unknown
  translationsJson?: unknown
  category?: {
    name?: string | null
    level?: number | null
    priceCoefficient?: unknown
    isBrandCategory?: boolean | null
    parent?: {
      name?: string | null
      priceCoefficient?: unknown
      isBrandCategory?: boolean | null
    } | null
  } | null
  relationCategories?: Array<{
    category?: {
      name?: string | null
      level?: number | null
      priceCoefficient?: unknown
      isBrandCategory?: boolean | null
      parent?: {
        name?: string | null
        priceCoefficient?: unknown
        isBrandCategory?: boolean | null
      } | null
    } | null
  }>
  skus: Array<{
    id: string
    imageUrl?: string | null
    price: { toNumber: () => number }
    originalPrice: { toNumber: () => number } | null
    stockStatus: string
  }>
},
  exchangeRate: number,
  lang?: string,
): ProductItem => {
  const skus = product.skus
  const translated = pickProductTranslation(product.translationsJson, normalizeProductLang(lang))
  const displayName = resolveProductDisplayName(
    product.name,
    product.translationsJson,
    lang,
  )
  const skuCount = skus.length
  const sortedSkus = [...skus].sort((a, b) => a.price.toNumber() - b.price.toNumber())
  const defaultSku = sortedSkus.length > 0 ? sortedSkus[0] : null

  let stockStatus: StockStatusEnum = 'OUT_OF_STOCK'
  if (skus.some((sku) => sku.stockStatus === 'IN_STOCK')) {
    stockStatus = 'IN_STOCK'
  } else if (skus.some((sku) => sku.stockStatus === 'LOW_STOCK')) {
    stockStatus = 'LOW_STOCK'
  }

  const pricingCoeffs = pickFrontPricingCategoryCoeffs({
    primary: product.category,
    relations: (product.relationCategories || []).map((rel) => rel.category),
  })
  const priceRmb = resolveFrontRmbSellingPrice({
    skuPriceRmb: defaultSku ? defaultSku.price.toNumber() : 0,
    costPrice: product.costPrice,
    ...pricingCoeffs,
  })
  const cost = toDecimalNumber(product.costPrice)
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
          costPrice: product.costPrice,
          ...pricingCoeffs,
        }),
        exchangeRate,
      ),
    )
    .filter((value) => Number.isFinite(value) && value > 0)
  const priceMax = usdPrices.length > 0 ? Math.max(...usdPrices) : null
  const minOrderQuantity = Math.max(1, Number((product.tradeInfoJson as any)?.minOrderQty ?? 0) || 1)

  const variantThumbnails: string[] = []
  const seen = new Set<string>()
  for (const sku of skus) {
    const url = sku.imageUrl?.trim()
    if (!url || seen.has(url)) continue
    seen.add(url)
    variantThumbnails.push(url)
  }
  if (variantThumbnails.length === 0 && product.mainImageUrl?.trim()) {
    variantThumbnails.push(product.mainImageUrl.trim())
  }

  return {
    product_id: product.id,
    product_slug: product.slug,
    product_name: displayName,
    main_image_url: product.mainImageUrl,
    short_description: translated?.shortDescription?.trim() || product.shortDescription,
    rating_average: product.ratingAverage,
    rating_count: product.ratingCount,
    stock_status: stockStatus,
    price: priceNum,
    original_price: originalPriceNum,
    has_discount: hasDiscount,
    sku_count: skuCount,
    first_sku_id: defaultSku ? defaultSku.id : '',
    first_sku_price_rmb: priceRmb,
    created_at_timestamp: product.createdAt.getTime(),
    sort_weight: product.sortWeight,
    brand_category_id: product.brandCategoryId,
    brand_category_name: product.brandCategory?.name || null,
    variant_thumbnails: variantThumbnails,
    min_order_quantity: minOrderQuantity,
    price_max: priceMax && priceMax > priceNum ? priceMax : null,
  }
}

const activeListedProductWhere = {
  status: 'ACTIVE' as const,
  category: {
    status: 'ACTIVE' as const,
  },
}

/**
 * 读取已上架商品，按 createdAt 归入最近 6 个月（New 月历）。
 * 故意不查 publishedAt：线上 Prisma client / 列不同步时会整页 500。
 */
export const getDailyNewArrivalCalendar = withResult(async (): Promise<GetDailyNewArrivalCalendarOutput> => {
  const months = buildLast6Months()
  const rangeStart = getLast6MonthsRangeStart()
  const monthKeys = new Set(months.map((item) => item.monthKey))
  const countMap = new Map(months.map((item) => [item.monthKey, 0]))

  const [totalActiveProducts, productsInRange] = await Promise.all([
    prisma.product.count({
      where: activeListedProductWhere,
    }),
    prisma.product.findMany({
      where: {
        ...activeListedProductWhere,
        createdAt: { gte: rangeStart },
      },
      select: {
        createdAt: true,
      },
    }),
  ])

  productsInRange.forEach((product) => {
    const anchor = product.createdAt
    const monthKey = toMonthKey(anchor.getFullYear(), anchor.getMonth() + 1)
    if (!monthKeys.has(monthKey)) {
      return
    }

    countMap.set(monthKey, (countMap.get(monthKey) || 0) + 1)
  })

  return {
    months: months.map((item) => ({
      year: item.year,
      month: item.month,
      monthKey: item.monthKey,
      label: formatMonthLabel(item.year, item.month),
      productCount: countMap.get(item.monthKey) || 0,
    })),
    totalActiveProducts,
  }
})

/**
 * 上新商品列表：按 createdAt 时间窗筛选，倒序。
 * - 传 year+month：该月
 * - 不传：最近 6 个月（含当月）
 */
export const getDailyNewArrivalProducts = withResult(async (
  input: GetDailyNewArrivalProductsInput = {},
): Promise<GetDailyNewArrivalProductsOutput> => {
  const hasMonth =
    Number.isInteger(Number(input.year)) &&
    Number.isInteger(Number(input.month)) &&
    Number(input.month) >= 1 &&
    Number(input.month) <= 12

  let rangeStart: Date
  let rangeEnd: Date | undefined

  if (hasMonth) {
    const year = Number(input.year)
    const month = Number(input.month)
    const range = getMonthDateRange(year, month)
    rangeStart = range.start
    rangeEnd = range.end
  } else {
    rangeStart = getLast6MonthsRangeStart()
    rangeEnd = undefined
  }

  const dbProducts = await prisma.product.findMany({
    where: {
      ...activeListedProductWhere,
      createdAt: rangeEnd
        ? { gte: rangeStart, lt: rangeEnd }
        : { gte: rangeStart },
    },
    include: {
      skus: true,
      brandCategory: true,
      category: {
        select: {
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
              name: true,
              level: true,
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
    orderBy: {
      createdAt: 'desc',
    },
  })

  const exchangeRate = await getUsdExchangeRate(prisma)
  const list = dbProducts
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((product) => mapActiveProductToItem(product, exchangeRate, input.lang))

  return {
    list,
    total: list.length,
  }
})

// ===== Coming 新品预告（未上架 / 预告按日） =====

export interface ComingSoonDateCard {
  /** YYYY-MM-DD — used for sort + stable key */
  date_key: string
  /** MM/DD display only */
  date_label: string
  /** Preview image for that day (admin product main image) */
  preview_image_url: string | null
  /** Product used for wishlist / detail */
  preview_product_id: string
  preview_product_slug: string | null
  preview_product_name: string
}

export interface GetComingSoonDateCardsOutput {
  cards: ComingSoonDateCard[]
}

export interface ComingSoonProductItem {
  product_id: string
  product_slug: string | null
  product_name: string
  main_image_url: string
  status?: string | null
}

export interface GetComingSoonProductsByDateInput {
  /** YYYY-MM-DD local calendar day */
  date_key: string
  lang?: string
}

export interface GetComingSoonProductsByDateOutput {
  date_key: string
  date_label: string
  list: ComingSoonProductItem[]
}

type ComingSoonProductRow = {
  id: string
  slug: string
  name: string
  mainImageUrl: string
  status?: string
  publishedAt: Date | null
  createdAt: Date
  sortWeight: number
  translationsJson?: unknown
}

const comingTeaserSelect = {
  id: true,
  slug: true,
  name: true,
  mainImageUrl: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  sortWeight: true,
  translationsJson: true,
} as const

const buildComingTeaserWhere = (teaserCategoryIds: string[]) =>
  teaserCategoryIds.length > 0
    ? {
        OR: [
          { status: { in: ['DRAFT', 'PREORDER', 'INACTIVE'] as const } },
          { categoryId: { in: teaserCategoryIds } },
        ],
      }
    : {
        status: { in: ['DRAFT', 'PREORDER', 'INACTIVE'] as const },
      }

const loadComingTeaserCategoryIds = async () => {
  const teaserCategories = await prisma.category.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { name: { contains: '预告' } },
        { name: { contains: '未上架' } },
        { name: { contains: 'Coming' } },
        { name: { contains: 'coming' } },
      ],
    },
    select: { id: true },
    take: 50,
  })
  return teaserCategories.map((c) => c.id)
}

/**
 * Shared product source for Coming:
 * DRAFT / PREORDER / INACTIVE, or teaser categories; soft ACTIVE fallback for demos.
 */
const loadComingSoonProductRows = async (take = 500): Promise<ComingSoonProductRow[]> => {
  const teaserCategoryIds = await loadComingTeaserCategoryIds()
  let products = await prisma.product.findMany({
    where: buildComingTeaserWhere(teaserCategoryIds),
    select: comingTeaserSelect,
    orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
    take,
  })

  if (products.length === 0) {
    products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        category: { status: 'ACTIVE' },
      },
      select: comingTeaserSelect,
      orderBy: [{ createdAt: 'desc' }],
      take: Math.min(80, take),
    })
  }

  return products
}

const mapComingSoonProductItem = (
  product: ComingSoonProductRow,
  lang?: string,
): ComingSoonProductItem => ({
  product_id: product.id,
  product_slug: product.slug || null,
  product_name: resolveProductDisplayName(product.name, product.translationsJson, lang),
  main_image_url: product.mainImageUrl || '',
  status: product.status || null,
})

/**
 * Coming 页日期卡片（legacy 摘要）：
 * - 来源：未上架/预告类商品（DRAFT / PREORDER / INACTIVE），或类目名含 预告|Coming|未上架
 * - 归日：优先 publishedAt（管理员配置的预告/计划日期），否则 createdAt
 * - 排序：日期降序（新的在前）
 * - 卡片：每日一张，预览图取该日第一条商品主图；不返回数量文案
 */
export const getComingSoonDateCards = withResult(
  async (): Promise<GetComingSoonDateCardsOutput> => {
    const products = await loadComingSoonProductRows(500)

    const byDay = new Map<
      string,
      {
        label: string
        product: ComingSoonProductRow
        anchorMs: number
      }
    >()

    for (const product of products) {
      const anchor = product.publishedAt || product.createdAt
      const key = toDateKey(anchor)
      if (!byDay.has(key)) {
        byDay.set(key, {
          label: toDateLabel(anchor),
          product,
          anchorMs: anchor.getTime(),
        })
      }
    }

    const cards: ComingSoonDateCard[] = Array.from(byDay.entries())
      .sort((a, b) => b[1].anchorMs - a[1].anchorMs)
      .map(([date_key, row]) => ({
        date_key,
        date_label: row.label,
        preview_image_url: row.product.mainImageUrl || null,
        preview_product_id: row.product.id,
        preview_product_slug: row.product.slug || null,
        preview_product_name: row.product.name || '',
      }))

    return { cards }
  },
)

/**
 * Coming 页按日商品列表：
 * - 与 getComingSoonDateCards 同源
 * - 归日：publishedAt ?? createdAt 落在 date_key 当天
 * - 排序：sortWeight desc → createdAt desc
 */
export const getComingSoonProductsByDate = withResult(
  async (input: GetComingSoonProductsByDateInput): Promise<GetComingSoonProductsByDateOutput> => {
    const range = getDateKeyRange(input.date_key)
    if (!range) {
      return {
        date_key: String(input.date_key || ''),
        date_label: '',
        list: [],
      }
    }

    const date_key = toDateKey(range.start)
    const date_label = toDateLabel(range.start)

    const products = await loadComingSoonProductRows(500)
    const list = products
      .filter((product) => {
        const anchor = product.publishedAt || product.createdAt
        return toDateKey(anchor) === date_key
      })
      .map((product) => mapComingSoonProductItem(product, input.lang))

    return { date_key, date_label, list }
  },
)

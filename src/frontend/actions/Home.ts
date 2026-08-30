'use server'

import {
  addToCart,
  getCategoryDetail,
  getCategoryList,
  getProductList,
  type ProductItem,
  type StockStatusEnum,
} from '@/frontend/actions/ProductCategory'
import {
  readAssembledHomeRecommendZones,
  readHomeRecommendZonesWithCache,
  writeAssembledHomeRecommendZones,
} from '@/backend/actions/homeRecommendZoneCache'
import prisma from '@/tools/prisma'
import { withResult } from '@/frontend/action_utils'
import {
  buildLast6Months,
  formatMonthLabel,
  getDateKeyRange,
  getMonthDateRange,
  isDateKeyProductName,
  toDateKey,
  toDateLabel,
} from '@/frontend/utils/dailyNewArrival'
import { normalizeProductLang, pickProductTranslation, resolveCategoryDisplayName, resolveProductDisplayName } from '@/frontend/i18n/productTranslation'
import {
  pickFrontPricingCategoryCoeffs,
  resolveFrontRmbSellingPrice,
  toDecimalNumber,
} from '@/shared/priceCoefficient'
import { optimizeCatalogImageUrl, resolveCategoryCardImageUrl, resolveCategoryShelfImageUrl } from '@/shared/imageUrl'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'
import { loadPricingPromotionConfig } from '@/shared/pricingPromotionConfig'
import { applySiteWideListedUsd, getSiteWidePercentCoef } from '@/shared/pricingPromotionCalc'
import { isStorefrontVisibleProduct, storefrontVisibilityWhere } from '@/shared/storefrontProductVisibility'

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
  /** 展示使用：min（兼容旧逻辑） */
  price: number | null
  /** 多 SKU 价格范围（USD） */
  priceMin: number | null
  priceMax: number | null
  /** 规格/颜色等“可选项”列表（用于首页直接切换价格） */
  skuOptions: Array<{
    skuId: string
    label: string
    price: number | null
    originalPrice: number | null
  }>
  originalPrice: number | null
  ratingAverage: number
  ratingCount: number
  skuCount: number
  defaultSkuId: string | null
  /** DB 原始商品名（Coming 快速发图为 YYYY-MM-DD，用于按日归组） */
  rawProductName?: string | null
  /** 创建时间戳，原始名非日期时用于归日 */
  createdAtTimestamp?: number | null
}

export interface HomeRecommendCategoryCard {
  itemId: string
  entityType: 'CATEGORY'
  categoryId: string
  categoryName: string
  categorySlug: string | null
  imageUrl: string | null
  /** 后台分类主图；商品图加载慢/失败时前端用它兜底 */
  fallbackImageUrl: string | null
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

const buildSkuOptionLabel = (sku: any, index: number): string => {
  // Prefer existing label-like fields. Keep it simple: only need a short, stable display string on home cards.
  const sizeLabel = typeof sku?.sizeLabel === 'string' ? sku.sizeLabel.trim() : ''
  if (sizeLabel) return sizeLabel

  const skuCode = typeof sku?.skuCode === 'string' ? sku.skuCode.trim() : ''
  if (skuCode) return skuCode

  const attrs = Array.isArray(sku?.attributeJson) ? sku.attributeJson : null
  if (attrs && attrs.length > 0) {
    const values = attrs
      .map((a: any) => (a && typeof a.value === 'string' ? a.value.trim() : ''))
      .filter(Boolean)
    if (values.length) return values.join(' / ')
  }

  return `Option ${index + 1}`
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
  const cachedAssembled = readAssembledHomeRecommendZones<HomeRecommendZoneSection[]>(lang)
  if (cachedAssembled?.length) {
    return { zones: cachedAssembled }
  }

  const [exchangeRate, pricingConfig] = await Promise.all([
    getUsdExchangeRate(prisma),
    loadPricingPromotionConfig(prisma),
  ])
  const siteWideCoef = getSiteWidePercentCoef(pricingConfig)
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
          iconUrl: true,
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
  const productZoneSourceCategoryIds = Array.from(
    new Set(
      zones
        .filter((zone) => zone.zoneType === 'PRODUCT')
        .flatMap((zone) =>
          zone.items
            .filter((item) => item.entityType === 'CATEGORY')
            .map((item) => item.categoryId || item.category?.id || null)
            .filter((id): id is string => Boolean(id)),
        ),
    ),
  )
  const productZoneChildCategories =
    productZoneSourceCategoryIds.length > 0
      ? await prisma.category.findMany({
          where: {
            parentId: { in: productZoneSourceCategoryIds },
            status: 'ACTIVE',
          },
          select: { id: true, parentId: true },
        })
      : []
  const productZoneExpandMap = new Map<string, Set<string>>()
  for (const categoryId of productZoneSourceCategoryIds) {
    productZoneExpandMap.set(categoryId, new Set([categoryId]))
  }
  for (const child of productZoneChildCategories) {
    if (!child.parentId) continue
    const bucket = productZoneExpandMap.get(child.parentId) || new Set([child.parentId])
    bucket.add(child.id)
    productZoneExpandMap.set(child.parentId, bucket)
  }
  const productZoneQueryIds = Array.from(
    new Set([
      ...productZoneSourceCategoryIds,
      ...productZoneChildCategories.map((item) => item.id),
    ]),
  )
  const fetchCategoryIds = Array.from(new Set([...categoryZoneCategoryIds, ...productZoneQueryIds]))
  const maxProductZoneItemsPerCategory = productZoneSourceCategoryIds.length > 0
    ? Math.max(
        80,
        ...zones
          .filter((zone) => zone.zoneType === 'PRODUCT')
          .map((zone) => normalizePcCols(zone.pcCols) * Math.max(2, (zone as { pcRows?: number }).pcRows ?? 2)),
      )
    : 0
  const maxLatestPerCategory = Math.max(
    DEFAULT_CATEGORY_LATEST_PRODUCT_LIMIT,
    ...zones
      .filter((zone) => zone.zoneType === 'CATEGORY')
      .map((zone) => normalizePcCols(zone.pcCols)),
    maxProductZoneItemsPerCategory,
  )
  const productCountByCategoryId = new Map<string, number>()
  const loadProductCounts = async () => {
    if (categoryIds.length === 0) return
    const [primaryCounts, relationCounts] = await Promise.all([
      prisma.product.groupBy({
        by: ['categoryId'],
        where: {
          ...storefrontVisibilityWhere(),
          categoryId: { in: categoryIds },
        },
        _count: { _all: true },
      }),
      prisma.product_category_relations.groupBy({
        by: ['categoryId'],
        where: {
          categoryId: { in: categoryIds },
          product: storefrontVisibilityWhere(),
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

  const latestProductsByCategoryId = new Map<string, HomeRecommendProductCard[]>()

  if (fetchCategoryIds.length > 0) {
    const latestTake = Math.min(800, Math.max(24, fetchCategoryIds.length * Math.max(maxLatestPerCategory, 8)))
    const [, latestCandidates] = await Promise.all([
      loadProductCounts(),
      prisma.product.findMany({
      where: {
        ...storefrontVisibilityWhere(),
        mainImageUrl: { not: '' },
        OR: [
          { categoryId: { in: fetchCategoryIds } },
          { brandCategoryId: { in: fetchCategoryIds } },
          { relationCategories: { some: { categoryId: { in: fetchCategoryIds } } } },
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
        brandCategoryId: true,
        costPrice: true,
        ratingAverage: true,
        ratingCount: true,
        translationsJson: true,
        createdAt: true,
        skus: {
          select: {
            id: true,
            skuCode: true,
            price: true,
            originalPrice: true,
          },
          orderBy: { price: 'asc' },
          take: 6,
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
      take: latestTake,
    }),
    ])

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
      const skuSellingRmbPrices = product.skus
        .map((sku) =>
          resolveFrontRmbSellingPrice({
            skuPriceRmb: sku.price.toNumber(),
            costPrice: product.costPrice,
            ...pricingCoeffs,
          }),
        )
        .filter((n) => Number.isFinite(n) && n > 0)

      const priceMinRmb = skuSellingRmbPrices.length ? Math.min(...skuSellingRmbPrices) : null
      const priceMaxRmb = skuSellingRmbPrices.length ? Math.max(...skuSellingRmbPrices) : null

      const priceMinUsd = priceMinRmb !== null ? toUsdPrice(priceMinRmb, exchangeRate) : null
      const priceMaxUsd = priceMaxRmb !== null ? toUsdPrice(priceMaxRmb, exchangeRate) : null

      const priceRmb = priceMinRmb !== null ? priceMinRmb : resolveFrontRmbSellingPrice({
        skuPriceRmb: defaultSku.price.toNumber(),
        costPrice: product.costPrice,
        ...pricingCoeffs,
      })

      const cost = toDecimalNumber(product.costPrice)
      const skuOptions = sortedSkus
        .map((sku, index) => {
          const priceRmb = resolveFrontRmbSellingPrice({
            skuPriceRmb: sku.price.toNumber(),
            costPrice: product.costPrice,
            ...pricingCoeffs,
          })
          const priceUsd = priceRmb > 0 ? toUsdPrice(priceRmb, exchangeRate) : null
          const originalPriceRmb =
            cost !== null && cost > 0
              ? Number((priceRmb * 1.1).toFixed(2))
              : sku.originalPrice
                ? sku.originalPrice.toNumber()
                : null
          return {
            skuId: sku.id,
            label: buildSkuOptionLabel(sku, index),
            price: priceUsd,
            originalPrice: originalPriceRmb !== null && originalPriceRmb > 0 ? toUsdPrice(originalPriceRmb, exchangeRate) : null,
          }
        })
        .filter((opt) => opt.skuId && opt.price !== null)
        .slice(0, 6)

      const originalPriceRmb =
        cost !== null && cost > 0
          ? Number((priceRmb * 1.1).toFixed(2))
          : defaultSku.originalPrice
            ? defaultSku.originalPrice.toNumber()
            : null
      const originalUsd = originalPriceRmb !== null ? toUsdPrice(originalPriceRmb, exchangeRate) : null
      const listed = applySiteWideListedUsd({
        price: priceMinUsd ?? 0,
        priceMax: priceMaxUsd,
        originalPrice: originalUsd,
        coef: siteWideCoef,
      })
      const saleSkuOptions = skuOptions.map((opt) => {
        if (opt.price == null) return opt
        const skuListed = applySiteWideListedUsd({
          price: opt.price,
          originalPrice: opt.originalPrice,
          coef: siteWideCoef,
        })
        return { ...opt, price: skuListed.price, originalPrice: skuListed.originalPrice }
      })
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
        imageUrl: optimizeCatalogImageUrl(product.mainImageUrl, 400),
        shortDescription: product.shortDescription,
        status: product.status,
        price: listed.price > 0 ? listed.price : priceMinUsd,
        priceMin: listed.price > 0 ? listed.price : priceMinUsd,
        priceMax: listed.priceMax,
        skuOptions: saleSkuOptions,
        originalPrice: listed.originalPrice,
        ratingAverage: product.ratingAverage,
        ratingCount: product.ratingCount,
        skuCount: product.skus.length,
        defaultSkuId: defaultSku.id,
        rawProductName: product.name || null,
        createdAtTimestamp: product.createdAt
          ? new Date(product.createdAt).getTime()
          : null,
      }
    }

    for (const product of latestCandidates) {
      const linkedCategoryIds = new Set<string>()
      if (product.categoryId && fetchCategoryIds.includes(product.categoryId)) {
        linkedCategoryIds.add(product.categoryId)
      }
      if (product.brandCategoryId && fetchCategoryIds.includes(product.brandCategoryId)) {
        linkedCategoryIds.add(product.brandCategoryId)
      }
      for (const relation of product.relationCategories) {
        if (fetchCategoryIds.includes(relation.categoryId)) {
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
  } else {
    await loadProductCounts()
  }

  const result = zones
    .map((zone): HomeRecommendZoneSection => {
      const categoryLatestLimit =
        zone.zoneType === 'CATEGORY'
          ? Math.max(DEFAULT_CATEGORY_LATEST_PRODUCT_LIMIT, normalizePcCols(zone.pcCols))
          : DEFAULT_CATEGORY_LATEST_PRODUCT_LIMIT
      let items = zone.items.reduce<Array<HomeRecommendProductCard | HomeRecommendCategoryCard | HomeRecommendSideNavItem>>((acc, item) => {
        if (zone.zoneType === 'PRODUCT' && item.entityType === 'CATEGORY') {
          return acc
        }
        if (item.entityType === 'PRODUCT') {
          const product = item.product
          if (!product || !isStorefrontVisibleProduct(product)) {
            return acc
          }

          const sortedSkus = [...product.skus].sort((a, b) => a.price.toNumber() - b.price.toNumber())
          const defaultSku = sortedSkus[0]

          if (!defaultSku) {
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
          const skuSellingRmbPrices = product.skus
            .map((sku) =>
              resolveFrontRmbSellingPrice({
                skuPriceRmb: sku.price.toNumber(),
                costPrice: product.costPrice,
                ...pricingCoeffs,
              }),
            )
            .filter((n) => Number.isFinite(n) && n > 0)

          const priceMinRmb = skuSellingRmbPrices.length ? Math.min(...skuSellingRmbPrices) : null
          const priceMaxRmb = skuSellingRmbPrices.length ? Math.max(...skuSellingRmbPrices) : null

          const priceMin = priceMinRmb !== null ? toUsdPrice(priceMinRmb, exchangeRate) : null
          const priceMax = priceMaxRmb !== null ? toUsdPrice(priceMaxRmb, exchangeRate) : null

          const priceRmb = priceMinRmb !== null
            ? priceMinRmb
            : defaultSku
              ? resolveFrontRmbSellingPrice({
                  skuPriceRmb: defaultSku.price.toNumber(),
                  costPrice: product.costPrice,
                  ...pricingCoeffs,
                })
              : null

          const cost = toDecimalNumber(product.costPrice)
          const skuOptions = sortedSkus
            .map((sku, index) => {
              const skuPriceRmb = resolveFrontRmbSellingPrice({
                skuPriceRmb: sku.price.toNumber(),
                costPrice: product.costPrice,
                ...pricingCoeffs,
              })
              const priceUsd = skuPriceRmb > 0 ? toUsdPrice(skuPriceRmb, exchangeRate) : null
              const originalPriceRmb =
                cost !== null && cost > 0
                  ? Number((skuPriceRmb * 1.1).toFixed(2))
                  : sku.originalPrice
                    ? sku.originalPrice.toNumber()
                    : null
              return {
                skuId: sku.id,
                label: buildSkuOptionLabel(sku, index),
                price: priceUsd,
                originalPrice:
                  originalPriceRmb !== null && originalPriceRmb > 0
                    ? toUsdPrice(originalPriceRmb, exchangeRate)
                    : null,
              }
            })
            .filter((opt) => opt.skuId && opt.price !== null)
            .slice(0, 6)
          const originalPriceRmb =
            priceRmb === null
              ? null
              : cost !== null && cost > 0
                ? Number((priceRmb * 1.1).toFixed(2))
                : defaultSku?.originalPrice
                  ? defaultSku.originalPrice.toNumber()
                  : null

          const listed = applySiteWideListedUsd({
            price: priceMin ?? 0,
            priceMax,
            originalPrice: originalPriceRmb !== null ? toUsdPrice(originalPriceRmb, exchangeRate) : null,
            coef: siteWideCoef,
          })
          const saleSkuOptions = skuOptions.map((opt) => {
            if (opt.price == null) return opt
            const skuListed = applySiteWideListedUsd({
              price: opt.price,
              originalPrice: opt.originalPrice,
              coef: siteWideCoef,
            })
            return { ...opt, price: skuListed.price, originalPrice: skuListed.originalPrice }
          })
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
            imageUrl: optimizeCatalogImageUrl(product.mainImageUrl, 400),
            shortDescription: product.shortDescription,
            status: product.status,
            price: listed.price > 0 ? listed.price : priceMin,
            priceMin: listed.price > 0 ? listed.price : priceMin,
            priceMax: listed.priceMax,
            skuOptions: saleSkuOptions,
            originalPrice: listed.originalPrice,
            ratingAverage: product.ratingAverage,
            ratingCount: product.ratingCount,
            skuCount: product.skus.length,
            defaultSkuId: defaultSku?.id || null,
            rawProductName: product.name || null,
            createdAtTimestamp: product.createdAt
              ? new Date(product.createdAt).getTime()
              : null,
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

        const shelfImage = resolveCategoryShelfImageUrl(
          category.imageUrl,
          category.bannerImageUrl,
          (category as { iconUrl?: string | null }).iconUrl,
        )
        acc.push({
          itemId: item.id,
          entityType: 'CATEGORY' as const,
          categoryId: category.id,
          categoryName,
          categorySlug: category.slug,
          imageUrl: resolveCategoryCardImageUrl(
            category.imageUrl,
            category.bannerImageUrl,
            (category as { iconUrl?: string | null }).iconUrl,
          ),
          fallbackImageUrl: shelfImage,
          description: category.description,
          productCount: productCountByCategoryId.get(category.id) ?? category._count.products,
          latestProducts: (latestProductsByCategoryId.get(category.id) || []).slice(0, categoryLatestLimit),
        })

        return acc
      }, [])

      if (zone.zoneType === 'PRODUCT') {
        const selectedCategoryIds = zone.items
          .filter((item) => item.entityType === 'CATEGORY')
          .map((item) => item.categoryId || item.category?.id || null)
          .filter((id): id is string => Boolean(id))
        const productItems = items.filter(
          (item): item is HomeRecommendProductCard => item.entityType === 'PRODUCT',
        )
        if (selectedCategoryIds.length > 0) {
          const seen = new Set(productItems.map((item) => item.productId))
          const dynamicProducts: HomeRecommendProductCard[] = []
          for (const categoryId of selectedCategoryIds) {
            const queryIds = productZoneExpandMap.get(categoryId) || new Set([categoryId])
            for (const queryId of queryIds) {
              for (const card of latestProductsByCategoryId.get(queryId) || []) {
                if (seen.has(card.productId)) continue
                seen.add(card.productId)
                dynamicProducts.push({
                  ...card,
                  itemId: `zone-${zone.id}-${card.productId}`,
                })
              }
            }
          }
          items = [...productItems, ...dynamicProducts]
        } else {
          items = productItems
        }
      }

      // 激活专区即使暂无有效明细也保留，保证绿灯专区数量与前台区块一致
      return {
        zoneId: zone.id,
        title: resolveCategoryDisplayName(null, zone.title, lang),
        zoneType: zone.zoneType,
        pcCols: normalizePcCols(zone.pcCols),
        mobileCols: normalizeMobileCols(zone.mobileCols),
        pcRows: normalizePcRows((zone as { pcRows?: number }).pcRows ?? 2),
        sortWeight: zone.sortWeight,
        items,
      }
    })

  writeAssembledHomeRecommendZones(lang, result)
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
    const brandName = item.brand_category_name || 'Featured'
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
  /** 可选：指定年月则只返回该月；不传则默认当月（避免一次扫 6 个月） */
  year?: number
  month?: number
  lang?: string
  page?: number
  page_size?: number
}

export interface GetDailyNewArrivalProductsOutput {
  list: ProductItem[]
  total: number
}

const DAILY_NEW_CACHE_TTL_MS = Number(process.env.DAILY_NEW_CACHE_TTL_MS || 45_000)
type DailyNewCacheEntry<T> = { expiresAt: number; value: T }
const dailyNewCalendarCache = new Map<string, DailyNewCacheEntry<GetDailyNewArrivalCalendarOutput>>()
const dailyNewProductsCache = new Map<string, DailyNewCacheEntry<GetDailyNewArrivalProductsOutput>>()

function readDailyNewCache<T>(map: Map<string, DailyNewCacheEntry<T>>, key: string): T | null {
  const hit = map.get(key)
  if (!hit) return null
  if (hit.expiresAt <= Date.now()) {
    map.delete(key)
    return null
  }
  return hit.value
}

function writeDailyNewCache<T>(
  map: Map<string, DailyNewCacheEntry<T>>,
  key: string,
  value: T,
) {
  map.set(key, { value, expiresAt: Date.now() + DAILY_NEW_CACHE_TTL_MS })
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
  siteWideCoef: number | null = null,
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
  const listed = applySiteWideListedUsd({
    price: priceNum,
    priceMax: priceMax && priceMax > priceNum ? priceMax : null,
    originalPrice: originalPriceNum,
    coef: siteWideCoef,
  })
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
    price: listed.price,
    original_price: listed.originalPrice,
    has_discount: listed.hasDiscount,
    sku_count: skuCount,
    first_sku_id: defaultSku ? defaultSku.id : '',
    first_sku_price_rmb: priceRmb,
    created_at_timestamp: product.createdAt ? new Date(product.createdAt).getTime() : 0,
    sort_weight: product.sortWeight,
    brand_category_id: product.brandCategoryId,
    brand_category_name: product.brandCategory?.name || null,
    variant_thumbnails: variantThumbnails,
    min_order_quantity: minOrderQuantity,
    price_max: listed.priceMax && listed.priceMax > listed.price ? listed.priceMax : null,
  }
}

const activeListedProductWhere = {
  ...storefrontVisibilityWhere(),
  category: {
    status: 'ACTIVE' as const,
  },
}

/**
 * 读取已上架商品，按 createdAt 归入最近 6 个月（New 月历）。
 * 用 6 次 count（走 status+createdAt 索引），禁止把窗口内全部行拉进内存。
 */
export const getDailyNewArrivalCalendar = withResult(async (): Promise<GetDailyNewArrivalCalendarOutput> => {
  const cacheKey = 'calendar:v2'
  const cached = readDailyNewCache(dailyNewCalendarCache, cacheKey)
  if (cached) return cached

  const months = buildLast6Months()
  const [totalActiveProducts, ...monthCounts] = await Promise.all([
    prisma.product.count({ where: activeListedProductWhere }),
    ...months.map(async (item) => {
      const { start, end } = getMonthDateRange(item.year, item.month)
      const productCount = await prisma.product.count({
        where: {
          ...activeListedProductWhere,
          createdAt: { gte: start, lt: end },
        },
      })
      return productCount
    }),
  ])

  const result: GetDailyNewArrivalCalendarOutput = {
    months: months.map((item, index) => ({
      year: item.year,
      month: item.month,
      monthKey: item.monthKey,
      label: formatMonthLabel(item.year, item.month),
      productCount: monthCounts[index] || 0,
    })),
    totalActiveProducts,
  }
  writeDailyNewCache(dailyNewCalendarCache, cacheKey, result)
  return result
})

/**
 * 上新商品列表：按 createdAt 时间窗筛选，倒序 + 分页。
 * - 传 year+month：该月
 * - 不传：默认当月（与点导航 New 行为一致，避免扫 6 个月）
 */
export const getDailyNewArrivalProducts = withResult(async (
  input: GetDailyNewArrivalProductsInput = {},
): Promise<GetDailyNewArrivalProductsOutput> => {
  const hasMonth =
    Number.isInteger(Number(input.year)) &&
    Number.isInteger(Number(input.month)) &&
    Number(input.month) >= 1 &&
    Number(input.month) <= 12

  const now = new Date()
  const year = hasMonth ? Number(input.year) : now.getFullYear()
  const month = hasMonth ? Number(input.month) : now.getMonth() + 1
  const { start: rangeStart, end: rangeEnd } = getMonthDateRange(year, month)

  const page = Math.max(1, Number(input.page) || 1)
  const pageSize = Math.min(60, Math.max(1, Number(input.page_size) || 60))
  const skip = (page - 1) * pageSize
  const lang = normalizeProductLang(input.lang)
  const cacheKey = `products:${year}-${month}:p${page}:s${pageSize}:${lang}`
  const cached = readDailyNewCache(dailyNewProductsCache, cacheKey)
  if (cached) return cached

  const where = {
    ...activeListedProductWhere,
    createdAt: { gte: rangeStart, lt: rangeEnd },
  }

  const [total, dbProducts, exchangeRate, pricingConfig] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        mainImageUrl: true,
        shortDescription: true,
        status: true,
        costPrice: true,
        ratingAverage: true,
        ratingCount: true,
        sortWeight: true,
        brandCategoryId: true,
        tradeInfoJson: true,
        createdAt: true,
        translationsJson: true,
        skus: {
          select: {
            id: true,
            skuCode: true,
            price: true,
            originalPrice: true,
            stock: true,
            stockStatus: true,
            imageUrl: true,
          },
          orderBy: { price: 'asc' },
          take: 24,
        },
        brandCategory: {
          select: { id: true, name: true },
        },
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
          take: 12,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    }),
    getUsdExchangeRate(prisma),
    loadPricingPromotionConfig(prisma),
  ])
  const siteWideCoef = getSiteWidePercentCoef(pricingConfig)

  const result: GetDailyNewArrivalProductsOutput = {
    list: dbProducts.map((product) => mapActiveProductToItem(product, exchangeRate, lang, siteWideCoef)),
    total,
  }
  writeDailyNewCache(dailyNewProductsCache, cacheKey, result)
  return result
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

const buildComingTeaserWhere = (_teaserCategoryIds: string[]) => ({
  status: 'PREORDER' as const,
})

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
 * Shared product source for Coming: PREORDER only (draft / off-shelf stay off the storefront).
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
 * Resolve Coming day key for a product:
 * - Prefer product.name when it is YYYY-MM-DD (recommend-zone quick upload)
 * - Else publishedAt ?? createdAt
 */
const resolveComingDayFromProduct = (product: ComingSoonProductRow) => {
  const name = String(product.name || '').trim()
  if (isDateKeyProductName(name)) {
    const range = getDateKeyRange(name)
    if (range) {
      return {
        key: name,
        label: toDateLabel(range.start),
        anchorMs: range.start.getTime(),
      }
    }
  }
  const anchor = product.publishedAt || product.createdAt
  if (!anchor) {
    return {
      key: toDateKey(new Date()),
      label: toDateLabel(new Date()),
      anchorMs: Date.now(),
    }
  }
  return {
    key: toDateKey(anchor),
    label: toDateLabel(anchor),
    anchorMs: anchor instanceof Date ? anchor.getTime() : new Date(anchor).getTime(),
  }
}

export interface GetComingSoonDateCardsInput {
  lang?: string
}

/**
 * Coming 页日期卡片（legacy 摘要）：
 * - 来源：未上架/预告类商品（DRAFT / PREORDER / INACTIVE），或类目名含 预告|Coming|未上架
 * - 归日：优先商品名称 YYYY-MM-DD（快速发图），否则 publishedAt，再否则 createdAt
 * - 排序：日期降序（新的在前）
 * - 卡片：每日一张，预览图取该日第一条商品主图；不返回数量文案
 */
export const getComingSoonDateCards = withResult(
  async (input?: GetComingSoonDateCardsInput): Promise<GetComingSoonDateCardsOutput> => {
    const lang = normalizeProductLang(input?.lang)
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
      const day = resolveComingDayFromProduct(product)
      if (!byDay.has(day.key)) {
        byDay.set(day.key, {
          label: day.label,
          product,
          anchorMs: day.anchorMs,
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
        preview_product_name: resolveProductDisplayName(
          row.product.name || '',
          row.product.translationsJson,
          lang,
        ),
      }))

    return { cards }
  },
)

/**
 * Coming 页按日商品列表：
 * - 与 getComingSoonDateCards 同源
 * - 归日：商品名称 = date_key（YYYY-MM-DD），或 publishedAt ?? createdAt 落在当天
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
    const teaserCategoryIds = await loadComingTeaserCategoryIds()

    // Date-scoped DB filter — name date key OR calendar day on publishedAt/createdAt
    const dayWhere = {
      OR: [
        { name: date_key },
        { publishedAt: { gte: range.start, lt: range.end } },
        {
          AND: [
            { publishedAt: null },
            { createdAt: { gte: range.start, lt: range.end } },
          ],
        },
      ],
    }

    let products = await prisma.product.findMany({
      where: {
        AND: [
          buildComingTeaserWhere(teaserCategoryIds) as object,
          dayWhere,
        ],
      } as any,
      select: comingTeaserSelect,
      orderBy: [{ sortWeight: 'desc' }, { createdAt: 'desc' }],
      take: 120,
    })

    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: {
          AND: [
            {
              status: 'ACTIVE',
              category: { status: 'ACTIVE' },
            },
            dayWhere,
          ],
        },
        select: comingTeaserSelect,
        orderBy: [{ createdAt: 'desc' }],
        take: 80,
      })
    }

    // Date-named products (recommend-zone upload) only belong to their name day,
    // even if createdAt/publishedAt fall on another calendar day.
    const list = products
      .filter((product) => {
        const name = String(product.name || '').trim()
        if (isDateKeyProductName(name)) return name === date_key
        return true
      })
      .map((product) => mapComingSoonProductItem(product, input.lang))

    return { date_key, date_label, list }
  },
)

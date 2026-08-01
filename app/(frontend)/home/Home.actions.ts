'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/frontend/action_utils'

export interface HomeBrandShelfItem {
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
}

export interface HomeReviewMediaItem {
  type: 'image' | 'video'
  url: string
  thumbnailUrl: string | null
}

export interface HomeReviewItem {
  reviewId: string
  productId: string
  productName: string
  customerName: string
  rating: number
  content: string
  createdAt: string
  medias: HomeReviewMediaItem[]
}

export interface HomeReviewSummary {
  averageRating: number
  totalReviews: number
  highlightTags: string[]
}

export interface HomeCategoryGuideItem {
  categoryId: string
  categoryName: string
  categoryDescription: string | null
  imageUrl: string | null
  bannerImageUrl: string | null
  slug: string | null
  productCount: number
  navTitle: string | null
  navBadgeText: string | null
  navSortWeight: number
}
export interface HomeFeaturedProductItem {
  productId: string
  productName: string
  productCode: string
  mainImageUrl: string
  ratingAverage: number
  ratingCount: number
  tradeInfo: {
    shipFrom?: string
    deliveryDays?: number
    minOrderQty?: number
    supportedRegions?: string[]
    shippingNote?: string
    tradeNotice?: string
  } | null
  sellingPoints: Array<{
    title?: string
    content?: string
  }> | null
  defaultSkuId: string
  price: number
  originalPrice: number | null
  deliveryDays: number | null
  brandCategoryId: string | null
  brandName: string | null
}

export interface GetHomeCategoryGuideOutput {
  categories: HomeCategoryGuideItem[]
  selectedCategoryId: string | null
}

export interface GetHomeFeaturedProductsInput {
  categoryId?: string
}
export interface GetHomeFeaturedProductsOutput {
  selectedCategoryId: string | null
  bannerCategory: HomeCategoryGuideItem | null
  products: HomeFeaturedProductItem[]
}

export interface GetBrandShelfInput {
  categoryId?: string
}

export interface GetBrandShelfOutput {
  brands: Array<{
    brandName: string
    items: HomeBrandShelfItem[]
  }>
}

export interface GetHomeReviewSectionOutput {
  summary: HomeReviewSummary
  reviews: HomeReviewItem[]
}

export interface HomeSceneKeywordItem {
  keywordItemId: string
  keyword: string
  sortWeight: number
}
export interface HomeSceneKeywordGroup {
  groupId: string
  floorTitle: string
  floorIcon: string | null
  floorLink: string | null
  homepageSortWeight: number
  sortWeight: number
  keywords: HomeSceneKeywordItem[]
}

export interface GetHomeSceneKeywordGroupsOutput {
  groups: HomeSceneKeywordGroup[]
}

const HOME_FEATURED_SETTING_TYPE = 'HOME_FEATURED_KEYWORDS'

const normalizeKeyword = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized || null
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const readKeywordListFromSetting = (contentJson: unknown): string[] => {
  if (!contentJson || typeof contentJson !== 'object' || Array.isArray(contentJson)) {
    return []
  }

  const rawKeywords = (contentJson as { keywords?: unknown }).keywords
  if (!Array.isArray(rawKeywords)) {
    return []
  }

  return Array.from(
    new Set(
      rawKeywords
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    )
  )
}

const buildKeywordSearchText = (product: any): string => {
  const sellingPoints = Array.isArray(product.sellingPointsJson) ? product.sellingPointsJson : []
  const detailContent = Array.isArray(product.detailContentJson) ? product.detailContentJson : []
  const translations = product.translationsJson && typeof product.translationsJson === 'object'
    ? Object.values(product.translationsJson as Record<string, any>).flatMap(item => {
        if (!item || typeof item !== 'object') {
          return []
        }
        return [item.name, item.shortDescription, item.detail]
      })
    : []

  return [
    product.name,
    product.productCode,
    product.brandName,
    product.brandCategory?.name,
    product.shortDescription,
    product.detailText,
    product.designStory,
    product.brandMatchKeyword,
    ...sellingPoints.flatMap((item: any) => [item?.title, item?.content]),
    ...detailContent.flatMap((item: any) => [item?.title, item?.content]),
    ...translations
  ]
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .join(' ')
    .toLowerCase()
}

const getKeywordMatchCount = (product: any, normalizedKeywords: string[]): number => {
  if (normalizedKeywords.length === 0) {
    return 0
  }

  const searchText = buildKeywordSearchText(product)
  if (!searchText) {
    return 0
  }

  return normalizedKeywords.reduce((count, keyword) => {
    const matcher = new RegExp(escapeRegExp(keyword), 'g')
    return count + (searchText.match(matcher)?.length ?? 0)
  }, 0)
}

const HOME_BRAND_NAMES = [
  'Chanel',
  'LV',
  'GUCCI',
  'DIOR',
  'GUCCI',
  'HERMES',
  'PRADA',
  'BURBERRY',
  'COACH',
  'TB',
  'YSL',
  'VALENTINO',
  'ALO',
  'LULULEMON',
  'CL',
  'CARTIER',
  'FENDI',
  'DG',
  'VERSACE',
  'FENDI',
  'MK',
  'CELINE',
  'TOUS'
] as const

const HOME_BRAND_QUERY_NAMES = Array.from(new Set(HOME_BRAND_NAMES))

const normalizeBrandName = (brandName: string | null | undefined): string | null => {
  if (!brandName) {
    return null
  }

  const normalized = brandName.trim().toUpperCase()
  if (!normalized) {
    return null
  }

  const matched = HOME_BRAND_QUERY_NAMES.find(item => item.toUpperCase() === normalized)
  return matched ?? null
}

const mapHomeCategoryGuideItem = (category: any): HomeCategoryGuideItem => ({
  categoryId: category.id,
  categoryName: category.name,
  categoryDescription: category.description,
  imageUrl: category.imageUrl,
  bannerImageUrl: category.bannerImageUrl,
  slug: category.slug,
  productCount: category._count?.products ?? 0,
  navTitle: category.navConfig?.navTitle ?? null,
  navBadgeText: category.navConfig?.badgeText ?? null,
  navSortWeight: category.navConfig?.sortWeight ?? 0
})

const mapFeaturedProduct = (product: any): HomeFeaturedProductItem | null => {
  const sortedSkus = [...(product.skus || [])].sort((a: any, b: any) => a.price.toNumber() - b.price.toNumber())
  const defaultSku = sortedSkus.find((item: any) => item.stock > 0) || sortedSkus[0]

  if (!defaultSku) {
    return null
  }

  return {
    productId: product.id,
    productName: product.name,
    productCode: product.productCode,
    mainImageUrl: product.mainImageUrl,
    ratingAverage: product.ratingAverage,
    ratingCount: product.ratingCount,
    tradeInfo: (product.tradeInfoJson as HomeFeaturedProductItem['tradeInfo']) || null,
    sellingPoints: (product.sellingPointsJson as HomeFeaturedProductItem['sellingPoints']) || null,
    defaultSkuId: defaultSku.id,
    price: defaultSku.price.toNumber(),
    originalPrice: defaultSku.originalPrice ? defaultSku.originalPrice.toNumber() : null,
    deliveryDays: defaultSku.deliveryDays,
    brandCategoryId: product.brandCategoryId,
    brandName: product.brandCategory?.name ?? product.brandName ?? null
  }
}

export const getHomeCategoryGuide = withResult(
  async (): Promise<GetHomeCategoryGuideOutput> => {
    const categories = await prisma.category.findMany({
      where: {
        status: 'ACTIVE',
        level: 1
      },
      orderBy: [
        { sortWeight: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    })

    const mapped = categories.map(mapHomeCategoryGuideItem)

    return {
      categories: mapped,
      selectedCategoryId: mapped[0]?.categoryId ?? null
    }
  }
)

export const getHomeFeaturedProducts = withResult(
  async (_input?: GetHomeFeaturedProductsInput): Promise<GetHomeFeaturedProductsOutput> => {
    const keywordSetting = await prisma.sitesetting.findFirst({
      where: {
        settingType: HOME_FEATURED_SETTING_TYPE,
        isActive: true
      },
      orderBy: [
        { sortWeight: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    const keywords = readKeywordListFromSetting(keywordSetting?.contentJson)
    const normalizedKeywords = keywords
      .map(normalizeKeyword)
      .filter((item): item is string => Boolean(item))

    if (normalizedKeywords.length === 0) {
      return {
        selectedCategoryId: null,
        bannerCategory: null,
        products: []
      }
    }

    const candidateProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        category: {
          status: 'ACTIVE'
        },
        skus: {
          some: {}
        },
        OR: normalizedKeywords.flatMap(keyword => ([
          { name: { contains: keyword } },
          { productCode: { contains: keyword } },
          { brandName: { contains: keyword } },
          { shortDescription: { contains: keyword } },
          { detailText: { contains: keyword } },
          { designStory: { contains: keyword } },
          { brandMatchKeyword: { contains: keyword } }
        ]))
      },
      orderBy: [
        { sortWeight: 'desc' },
        { ratingAverage: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 80,
      include: {
        skus: {
          orderBy: {
            price: 'asc'
          }
        },
        brandCategory: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const rankedProducts = candidateProducts
      .map(product => ({
        product,
        matchCount: getKeywordMatchCount(product, normalizedKeywords)
      }))
      .filter(item => item.matchCount > 0)
      .sort((a, b) => {
        if (b.matchCount !== a.matchCount) {
          return b.matchCount - a.matchCount
        }
        if (b.product.sortWeight !== a.product.sortWeight) {
          return b.product.sortWeight - a.product.sortWeight
        }
        if (b.product.ratingAverage !== a.product.ratingAverage) {
          return b.product.ratingAverage - a.product.ratingAverage
        }
        return b.product.createdAt.getTime() - a.product.createdAt.getTime()
      })
      .slice(0, 8)
      .map(item => item.product)

    return {
      selectedCategoryId: null,
      bannerCategory: null,
      products: rankedProducts.map(mapFeaturedProduct).filter(Boolean) as HomeFeaturedProductItem[]
    }
  }
)

export const getBrandShelf = withResult(
  async (input?: GetBrandShelfInput): Promise<GetBrandShelfOutput> => {
    const where: any = {
      status: 'ACTIVE',
      category: {
        status: 'ACTIVE'
      },
      OR: [
        {
          brandCategory: {
            is: {
              name: {
                in: HOME_BRAND_QUERY_NAMES
              }
            }
          }
        },
        {
          brandName: {
            in: HOME_BRAND_QUERY_NAMES
          }
        }
      ]
    }

    if (input?.categoryId) {
      where.categoryId = input.categoryId
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { sortWeight: 'desc' },
        { ratingAverage: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        skus: {
          orderBy: {
            price: 'asc'
          }
        },
        brandCategory: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 240
    })

    const grouped = HOME_BRAND_NAMES.map(brandName => {
      const items = products
        .filter(product => normalizeBrandName(product.brandCategory?.name ?? product.brandName) === brandName)
        .map(product => {
          const defaultSku = product.skus.find(item => item.stock > 0) || product.skus[0]
          if (!defaultSku) {
            return null
          }

          return {
            brandName,
            productId: product.id,
            productName: product.name,
            productCode: product.productCode,
            mainImageUrl: product.mainImageUrl,
            defaultSkuId: defaultSku.id,
            price: defaultSku.price.toNumber(),
            originalPrice: defaultSku.originalPrice ? defaultSku.originalPrice.toNumber() : null,
            ratingAverage: product.ratingAverage,
            ratingCount: product.ratingCount,
            shortDescription: product.shortDescription
          }
        })
        .filter(Boolean)
        .slice(0, 4) as HomeBrandShelfItem[]

      return {
        brandName,
        items
      }
    })

    return {
      brands: grouped
    }
  }
)

export const getHomeReviewSection = withResult(
  async (): Promise<GetHomeReviewSectionOutput> => {
    const reviews = await prisma.productreview.findMany({
      where: {
        status: 'PUBLISHED',
        product: {
          status: 'ACTIVE'
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 6,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            ratingAverage: true,
            ratingCount: true
          }
        },
        user: {
          select: {
            username: true,
            account: true,
            avatarUrl: true
          }
        }
      }
    })

    const reviewItems: HomeReviewItem[] = reviews.map(review => {
      const imageCandidates = [
        ...(Array.isArray(review.imageUrlsJson) ? review.imageUrlsJson : []),
        review.user?.avatarUrl
      ].filter(Boolean) as string[]

      const medias: HomeReviewMediaItem[] = []

      if (imageCandidates[0]) {
        medias.push({
          type: 'image',
          url: imageCandidates[0],
          thumbnailUrl: imageCandidates[0]
        })
      }

      return {
        reviewId: review.id,
        productId: review.productId,
        productName: review.product?.name || '精选商品',
        customerName: review.user?.username || review.user?.account || '采购客户',
        rating: review.rating,
        content: review.content || review.title || '已完成收货并给出好评',
        createdAt: review.createdAt.toISOString(),
        medias
      }
    })

    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? Number((reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews).toFixed(1))
      : 0

    const highlightTags = [
      totalReviews > 0 ? `${totalReviews}+ 条真实评价` : '精选采购反馈',
      averageRating > 0 ? `综合评分 ${averageRating}` : '优先展示最新评价',
      reviewItems.some(item => item.medias.some(media => media.type === 'video')) ? '支持图文与视频缩略展示' : '支持图片缩略展示'
    ]

    return {
      summary: {
        averageRating,
        totalReviews,
        highlightTags
      },
      reviews: reviewItems
    }
  }
)

export const getHomeSceneKeywordGroups = withResult(
  async (): Promise<GetHomeSceneKeywordGroupsOutput> => {
    const groups = await prisma.keywordgroup.findMany({
      where: {
        showOnHomepage: true,
        isActive: true
      },
      orderBy: [
        { homepageSortWeight: 'desc' },
        { sortWeight: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        keywords: {
          where: {
            isActive: true
          },
          orderBy: [
            { sortWeight: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    })

    return {
      groups: groups.map(group => ({
        groupId: group.id,
        floorTitle: group.floorTitle || group.name || 'Featured Floor',
        floorIcon: group.floorIcon || null,
        floorLink: group.floorLink || null,
        homepageSortWeight: group.homepageSortWeight ?? 0,
        sortWeight: group.sortWeight,
        keywords: (group.keywords || []).map(item => ({
          keywordItemId: item.id,
          keyword: item.keyword,
          sortWeight: item.sortWeight
        }))
      }))
    }
  }
)

/**
 * 快速将商品加入购物车（仅限 CUSTOMER）
 */
export const addCartItem = requireRole(UserRole.CUSTOMER)(
  withResult(async (input: { productId: string; productSkuId: string }): Promise<void> => {
    const { userId } = getAuthContext()

    let cart = await prisma.cart.findUnique({
      where: { accountId: userId }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { accountId: userId }
      })
    }

    const sku = await prisma.productsku.findUnique({
      where: { id: input.productSkuId },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })

    if (!sku) {
      throw new Error('未找到对应规格')
    }

    if (sku.productId !== input.productId) {
      throw new Error('商品与规格不匹配')
    }

    if (sku.stock <= 0 || sku.product.status !== 'ACTIVE' || sku.product.category.status !== 'ACTIVE') {
      throw new Error('当前商品暂不可加入购物车')
    }

    const existingCartItem = await prisma.cartitem.findFirst({
      where: {
        cartId: cart.id,
        productSkuId: sku.id,
        engravingText: null,
        engravingFont: null
      }
    })

    if (existingCartItem) {
      const newQuantity = Math.min(existingCartItem.quantity + 1, sku.stock)
      await prisma.cartitem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: newQuantity,
          status: 'VALID'
        }
      })
    } else {
      await prisma.cartitem.create({
        data: {
          cartId: cart.id,
          productId: input.productId,
          productSkuId: sku.id,
          quantity: 1,
          status: 'VALID'
        }
      })
    }
  })
)

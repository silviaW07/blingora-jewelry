'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/frontend/action_utils'
import {
  pickFrontPricingCategoryCoeffs,
  resolveFrontRmbSellingPrice,
  toDecimalNumber,
} from '@/shared/priceCoefficient'
import {
  normalizeProductLang,
  pickProductTranslation,
  resolveProductDisplayName,
} from '@/frontend/i18n/productTranslation'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'
import { loadPricingPromotionConfig } from '@/shared/pricingPromotionConfig'
import {
  formatMinOrderQtyMessage,
  resolveEffectiveSkuMinOrderQty,
  resolveProductMinOrderQty,
} from '@/shared/minOrderQty'
import { isStorefrontQtyAllowed } from '@/shared/storefrontQty'
import { storefrontError } from '@/frontend/utils/storefrontErrors'

// ===== Enums =====
/** 商品状态：草稿(DRAFT) | 上架(ACTIVE) | 下架(INACTIVE) */
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

/** 库存状态：有货(IN_STOCK) | 库存不足(LOW_STOCK) | 缺货(OUT_OF_STOCK) */
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

/** 分类状态：激活(ACTIVE) | 停用(INACTIVE) */
export type CategoryStatus = 'ACTIVE' | 'INACTIVE'

// ===== Data Structures (JSON 结构内部字段均可选) =====
export interface GalleryItem {
  url?: string
  sort?: number
}

export interface SellingPointItem {
  title?: string
  content?: string
}

export interface DetailContentItem {
  type?: string
  content?: string
  title?: string
}

export interface ParameterItem {
  key?: string
  value?: string
}

export interface ParameterGroup {
  group?: string
  items?: ParameterItem[]
}

export interface TradeInfo {
  shipFrom?: string
  deliveryDays?: number
  minOrderQty?: number
  supportedRegions?: string[]
  shippingNote?: string
  tradeNotice?: string
}

export interface FaqItem {
  question?: string
  answer?: string
}

export interface SkuAttribute {
  name?: string
  value?: string
}

export interface CategoryData {
  id: string              // data-from: category-id
  name: string            // data-from: category-name
  status: CategoryStatus  // data-from: category-status
}

export interface ProductSkuData {
  id: string                    // data-from: productsku-id
  skuCode: string               // data-from: productsku-skuCode
  imageUrl: string | null       // data-from: productsku-imageUrl
  minOrderQty: number | null    // data-from: productsku-minOrderQty（为空时继承商品级）
  price: number                 // data-from: productsku-price (USD)
  originalPrice: number | null  // data-from: productsku-originalPrice (USD)
  /** Admin-only numeric stock is intentionally omitted from storefront payloads. */
  stockStatus: StockStatus      // data-from: productsku-stockStatus
  attributeJson: SkuAttribute[] // data-from: productsku-attributeJson
  deliveryDays: number | null   // data-from: productsku-deliveryDays
  weightKg: number | null       // data-from: productsku-weightKg
  volumeM3: number | null       // data-from: productsku-volumeM3
  sizeLabel: string | null      // data-from: productsku-sizeLabel（旧/外部数据兼容）
  /** SKU 规格展示文案，如 White|13*18cm */
  variantLabel: string
}

export interface DescriptionParam {
  key: string
  value: string
}

export interface PriceTierItem {
  minQty: number
  maxQty: number | null
  price: number
  label: string
}

export interface ProductCouponItem {
  id: string
  title: string
  amountLabel: string
  ctaLabel: string
}

export interface ProductDetailData {
  id: string                                   // data-from: product-id
  name: string                                 // data-from: product-name
  productCode: string                          // data-from: product-productCode
  status: ProductStatus                        // data-from: product-status
  source: string                               // data-from: product-source
  mainImageUrl: string                         // data-from: product-mainImageUrl
  galleryJson: GalleryItem[]                   // data-from: product-galleryJson
  shortDescription: string | null              // data-from: product-shortDescription
  detailText: string | null                    // data-from: product-detailText（1688 抓取原文）
  sellingPointsJson: SellingPointItem[] | null // data-from: product-sellingPointsJson
  detailContentJson: DetailContentItem[] | null // data-from: product-detailContentJson
  parameterJson: ParameterGroup[] | null       // data-from: product-parameterJson
  /** Description 表格行：优先 parameterJson（1688 属性），否则从 detailText 解析 */
  descriptionParams: DescriptionParam[]
  tradeInfoJson: TradeInfo | null              // data-from: product-tradeInfoJson
  faqJson: FaqItem[] | null                    // data-from: product-faqJson
  ratingAverage: number                        // data-from: product-ratingAverage
  ratingCount: number                          // data-from: product-ratingCount
  categoryId: string                           // data-from: product-categoryId
  category: CategoryData                       // data-from: category
  skus: ProductSkuData[]                       // data-from: productsku
  priceMin: number
  priceMax: number
  minOrderQty: number
  priceTiers: PriceTierItem[]
  coupons: ProductCouponItem[]
  pricingMeta?: {
    exchangeRate: number
    wholesaleEnabled: boolean
    wholesaleCoefficient: number
  }
}

export interface RelatedProductItem {
  id: string               // data-from: product-id
  name: string             // data-from: product-name
  slug: string             // data-from: product-slug
  mainImageUrl: string     // data-from: product-mainImageUrl
  minPrice: number         // aggregated: skus price min
}

// ===== Input / Output =====
export interface GetProductDetailInput {
  productId?: string
  slug?: string
  /** 语言码：en / zh / es（兼容 zh-CN） */
  lang?: string
}

export interface GetProductDetailOutput {
  product: ProductDetailData
}

export interface GetRelatedProductsInput {
  categoryId: string
  excludeProductId: string
  lang?: string | null
}

export interface GetRelatedProductsOutput {
  list: RelatedProductItem[]
}

export interface GetDecoratePreviewProductOutput {
  productId: string
  slug: string | null
}

export interface AddToCartInput {
  productSkuId?: string
  quantity?: number
  /**
   * 同一次详情页多规格加购中、其余行合计数量。
   * 用于混批起订量校验：siblings + quantity + sameRequestSiblingQty >= productMoq
   */
  sameRequestSiblingQty?: number
  /** PDP 多规格一次加购：优先于单行字段，减少 N 次 RPC */
  lines?: Array<{ productSkuId: string; quantity: number }>
}

export interface AddToCartOutput {
  success: boolean
}

/** 将某 SKU 在购物车中的数量设为绝对值（0 则移除） */
export interface SetCartSkuQuantityInput {
  productSkuId: string
  quantity: number
}

function normalizeCartLines(
  input: AddToCartInput,
): Array<{ productSkuId: string; quantity: number }> {
  const fromLines = Array.isArray(input.lines) ? input.lines : []
  const mapped = fromLines
    .map((line) => ({
      productSkuId: String(line?.productSkuId || '').trim(),
      quantity: Math.floor(Number(line?.quantity) || 0),
    }))
    .filter((line) => line.productSkuId && line.quantity > 0)

  if (mapped.length > 0) {
    const merged = new Map<string, number>()
    for (const line of mapped) {
      merged.set(line.productSkuId, (merged.get(line.productSkuId) || 0) + line.quantity)
    }
    return Array.from(merged, ([productSkuId, quantity]) => ({ productSkuId, quantity }))
  }

  const productSkuId = String(input.productSkuId || '').trim()
  const quantity = Math.floor(Number(input.quantity) || 0)
  if (!productSkuId || quantity <= 0) return []
  return [{ productSkuId, quantity }]
}

// ===== Actions =====

const toUsdPrice = (rmbPrice: number | null | undefined, exchangeRate: number): number => {
  if (typeof rmbPrice !== 'number' || Number.isNaN(rmbPrice)) return 0
  return toUsdFromCny(rmbPrice, exchangeRate)
}

const stripHtml = (raw: unknown) =>
  String(raw ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()

/** 从 1688 detailText / 参数表解析 Description 行 */
const flattenParameterJson = (parameterJson: ParameterGroup[] | null): DescriptionParam[] => {
  if (!parameterJson?.length) return []
  const rows: DescriptionParam[] = []
  for (const group of parameterJson) {
    for (const item of group.items || []) {
      const key = String(item.key || '').trim()
      const value = String(item.value || '').trim()
      if (key && value) rows.push({ key, value })
    }
  }
  return rows
}

const parseDescriptionParamsFromText = (raw?: string | null): DescriptionParam[] => {
  if (!raw?.trim()) return []
  const text = stripHtml(raw)
  const rows: DescriptionParam[] = []
  const seen = new Set<string>()

  const push = (key: string, value: string) => {
    const k = key.trim().replace(/[:：]\s*$/, '')
    const v = value.trim()
    if (!k || !v || k.length > 40 || v.length > 200) return
    const id = `${k.toLowerCase()}::${v.toLowerCase()}`
    if (seen.has(id)) return
    seen.add(id)
    rows.push({ key: k, value: v })
  }

  // Style: Fashion / Style：Fashion / Style - Fashion
  for (const line of text.split('\n')) {
    const matched = line.match(/^[\s\-*•]*([A-Za-z\u4e00-\u9fa5][\w\u4e00-\u9fa5\s\/]{0,32}?)\s*[:：\-–—]\s*(.+)$/)
    if (matched) push(matched[1], matched[2])
  }

  // HTML table leftovers already stripped; also try "Key  Value" with 2+ spaces
  if (rows.length === 0) {
    for (const line of text.split('\n')) {
      const matched = line.match(/^([A-Za-z\u4e00-\u9fa5][\w\u4e00-\u9fa5\s\/]{0,32}?)\s{2,}(.+)$/)
      if (matched) push(matched[1], matched[2])
    }
  }

  return rows.slice(0, 24)
}

const buildSkuVariantLabel = (attrs: SkuAttribute[], fallback: string) => {
  const parts = (attrs || [])
    .map((attr) => String(attr.value || '').trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join('|') : fallback
}

const isRealSizeValue = (value?: string | null) => {
  const normalized = String(value || '').trim()
  return Boolean(normalized) && !/^(默认|默认规格|default|standard|n\/a|none)$/i.test(normalized)
}

const isSizeAttributeName = (name?: string | null) => {
  const normalized = String(name || '').trim().toLowerCase()
  return ['尺码', '鞋码', '尺寸', '码数', 'size', 'sizing', '规格', 'spec'].includes(normalized)
}

const buildPriceTiers = (prices: number[], minOrderQty: number): PriceTierItem[] => {
  const valid = prices.filter((p) => Number.isFinite(p) && p > 0)
  if (valid.length === 0) return []

  const minPrice = Math.min(...valid)
  const maxPrice = Math.max(...valid)
  const base = Math.max(1, minOrderQty || 1)
  const steps = [
    { minQty: base, maxQty: base * 3 - 1 },
    { minQty: base * 3, maxQty: base * 6 - 1 },
    { minQty: base * 6, maxQty: base * 12 - 1 },
    { minQty: base * 12, maxQty: null as number | null },
  ]

  return steps.map((step, index) => {
    const ratio = valid.length === 1 ? 1 : 1 - index * 0.05
    const price =
      valid.length === 1
        ? minPrice
        : Number((maxPrice - (maxPrice - minPrice) * (index / Math.max(1, steps.length - 1))).toFixed(2))
    const label =
      step.maxQty == null ? `${step.minQty}+` : `${step.minQty}-${step.maxQty}`
    return {
      minQty: step.minQty,
      maxQty: step.maxQty,
      price: Number((price * Math.max(ratio, 0.85)).toFixed(2)),
      label,
    }
  })
}

const mapActiveCoupons = (campaigns: Array<{
  id: string
  name: string
  promotionType: string
  discountPercent: { toNumber: () => number } | null
  discountAmount: { toNumber: () => number } | null
  contentJson: unknown
}>, exchangeRate: number): ProductCouponItem[] => {
  return campaigns.map((item) => {
    const content = (item.contentJson || {}) as { bannerText?: string }
    const amount =
      item.discountAmount != null
        ? `US$ ${toUsdPrice(item.discountAmount.toNumber(), exchangeRate).toFixed(0)}`
        : item.discountPercent != null
          ? `${Number(item.discountPercent.toNumber()).toFixed(0)}%`
          : content.bannerText || item.name
    return {
      id: item.id,
      title: content.bannerText || item.name,
      amountLabel: amount,
      ctaLabel: 'Get now >',
    }
  })
}

/**
 * 获取商品详情数据（允许 GUEST 及 CUSTOMER 访问，无需 token，故不使用 requireRole）
 * 包含状态信息，如果非 ACTIVE，前端将拦截不可购买状态。
 */
export const getProductDetail = withResult(
  async (input: GetProductDetailInput): Promise<GetProductDetailOutput> => {
    if (!input.productId && !input.slug) {
      throw storefrontError('product.errors.skuMissing')
    }

    const whereCondition = input.productId
      ? { id: input.productId }
      : { slug: input.slug! }
    const now = new Date()

    const [exchangeRate, pricingConfig, product, couponCampaigns] = await Promise.all([
      getUsdExchangeRate(prisma, { ttlMs: 60_000 }),
      loadPricingPromotionConfig(prisma),
      prisma.product.findUnique({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          productCode: true,
          status: true,
          source: true,
          mainImageUrl: true,
          galleryJson: true,
          shortDescription: true,
          detailText: true,
          detailContentJson: true,
          parameterJson: true,
          tradeInfoJson: true,
          translationsJson: true,
          ratingAverage: true,
          ratingCount: true,
          categoryId: true,
          costPrice: true,
          category: {
            select: {
              id: true,
              name: true,
              status: true,
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
          skus: {
            orderBy: [{ createdAt: 'asc' as const }, { skuCode: 'asc' as const }],
            select: {
              id: true,
              skuCode: true,
              imageUrl: true,
              minOrderQty: true,
              price: true,
              originalPrice: true,
              stockStatus: true,
              attributeJson: true,
              deliveryDays: true,
              weightKg: true,
              volumeM3: true,
              sizeLabel: true,
            },
          },
        },
      }),
      prisma.promotioncampaign.findMany({
        where: {
          isActive: true,
          promotionType: {
            in: ['COUPON', 'FULL_REDUCTION', 'PERCENTAGE_DISCOUNT', 'NEW_CUSTOMER'],
          },
          AND: [
            { OR: [{ startAt: null }, { startAt: { lte: now } }] },
            { OR: [{ endAt: null }, { endAt: { gte: now } }] },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: {
          id: true,
          name: true,
          promotionType: true,
          discountPercent: true,
          discountAmount: true,
          contentJson: true,
        },
      }),
    ])

    if (!product) {
      throw storefrontError('product.errors.unavailable')
    }

    const parameterJson = product.parameterJson
      ? ((product.parameterJson as object) as ParameterGroup[])
      : null
    const tradeInfoJson = product.tradeInfoJson
      ? ((product.tradeInfoJson as object) as TradeInfo)
      : null

    const descriptionParamsFromParams = flattenParameterJson(parameterJson)
    let descriptionParams = descriptionParamsFromParams
    if (descriptionParams.length === 0) {
      const detailRow = await prisma.product.findUnique({
        where: { id: product.id },
        select: { detailText: true },
      })
      descriptionParams = parseDescriptionParamsFromText(detailRow?.detailText)
    }

    const productMinOrderQty = resolveProductMinOrderQty(tradeInfoJson)

    const pricingCoeffs = pickFrontPricingCategoryCoeffs({
      primary: product.category,
      relations: (product.relationCategories || []).map((rel) => rel.category),
    })
    const skus: ProductSkuData[] = product.skus.map((sku) => {
      const rawAttrs = Array.isArray(sku.attributeJson)
        ? (sku.attributeJson as unknown as SkuAttribute[])
        : []
      const attrs = rawAttrs
        .map(attr => ({
          name: String(attr?.name || '').trim(),
          value: String(attr?.value || '').trim(),
        }))
        .filter(attr => attr.name && attr.value)
      const storedSizeLabel = String(sku.sizeLabel || '').trim()
      if (
        isRealSizeValue(storedSizeLabel) &&
        !attrs.some(attr => isSizeAttributeName(attr.name) && isRealSizeValue(attr.value))
      ) {
        attrs.push({ name: '尺码', value: storedSizeLabel })
      }
      const priceRmb = resolveFrontRmbSellingPrice({
        skuPriceRmb: sku.price.toNumber(),
        costPrice: product.costPrice,
        ...pricingCoeffs,
      })
      const cost = toDecimalNumber(product.costPrice)
      const originalPriceRmb =
        cost !== null && cost > 0
          ? Number((priceRmb * 1.1).toFixed(2))
          : sku.originalPrice
            ? sku.originalPrice.toNumber()
            : null
      const price = toUsdPrice(priceRmb, exchangeRate)
      return {
        id: sku.id,
        skuCode: sku.skuCode,
        imageUrl: sku.imageUrl,
        minOrderQty:
          sku.minOrderQty != null && Number(sku.minOrderQty) > 0
            ? Math.max(1, Math.round(Number(sku.minOrderQty)))
            : null,
        price,
        originalPrice: originalPriceRmb !== null ? toUsdPrice(originalPriceRmb, exchangeRate) : null,
        stockStatus: sku.stockStatus as StockStatus,
        attributeJson: attrs,
        deliveryDays: sku.deliveryDays,
        weightKg: sku.weightKg ? sku.weightKg.toNumber() : null,
        volumeM3: sku.volumeM3 ? sku.volumeM3.toNumber() : null,
        sizeLabel: isRealSizeValue(storedSizeLabel) ? storedSizeLabel : null,
        variantLabel: buildSkuVariantLabel(attrs, sku.skuCode),
      }
    })

    const prices = skus.map((sku) => sku.price).filter((p) => p > 0)
    const priceMin = prices.length ? Math.min(...prices) : 0
    const priceMax = prices.length ? Math.max(...prices) : 0
    const minOrderQty = productMinOrderQty
    const lang = normalizeProductLang(input.lang)
    const translated = pickProductTranslation((product as { translationsJson?: unknown }).translationsJson, lang)

    const baseTiers = buildPriceTiers(prices, minOrderQty)
    const priceTiers = pricingConfig.wholesale.enabled
      ? baseTiers.map((tier) => ({
          ...tier,
          price: Number((tier.price * Math.max(0, Math.min(1, pricingConfig.wholesale.coefficient))).toFixed(2)),
        }))
      : []

    const detailData: ProductDetailData = {
      id: product.id,
      name: resolveProductDisplayName(
        product.name,
        (product as { translationsJson?: unknown }).translationsJson,
        lang,
      ),
      productCode: product.productCode,
      status: product.status as ProductStatus,
      source: String(product.source || ''),
      mainImageUrl: product.mainImageUrl,
      galleryJson: (product.galleryJson as object) as GalleryItem[],
      shortDescription:
        translated?.shortDescription?.trim() ||
        String((product as { shortDescription?: string | null }).shortDescription || '').trim() ||
        null,
      detailText: String((product as { detailText?: string | null }).detailText || '').trim() || null,
      sellingPointsJson: null,
      detailContentJson: product.detailContentJson
        ? ((product.detailContentJson as object) as DetailContentItem[])
        : null,
      parameterJson,
      descriptionParams,
      tradeInfoJson,
      faqJson: null,
      ratingAverage: product.ratingAverage,
      ratingCount: product.ratingCount,
      categoryId: product.categoryId,
      category: {
        id: product.category.id,
        name: product.category.name,
        status: product.category.status as CategoryStatus
      },
      skus,
      priceMin,
      priceMax,
      minOrderQty,
      priceTiers,
      coupons: mapActiveCoupons(couponCampaigns, exchangeRate),
      pricingMeta: {
        exchangeRate,
        wholesaleEnabled: pricingConfig.wholesale.enabled,
        wholesaleCoefficient: pricingConfig.wholesale.coefficient,
      },
    }

    return { product: detailData }
  }
)

export const getDecoratePreviewProduct = withResult(
  async (): Promise<GetDecoratePreviewProductOutput | null> => {
    const product = await prisma.product.findFirst({
      where: {
        status: {
          in: ['ACTIVE', 'DRAFT'],
        },
      },
      select: {
        id: true,
        slug: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    if (!product) {
      return null
    }

    return {
      productId: product.id,
      slug: product.slug || null,
    }
  },
)

/**
 * 获取相关推荐商品（同分类下 ACTIVE 的商品）
 */
export const getRelatedProducts = withResult(
  async (input: GetRelatedProductsInput): Promise<GetRelatedProductsOutput> => {
    const lang = normalizeProductLang(input.lang)
    const exchangeRate = await getUsdExchangeRate(prisma, { ttlMs: 60_000 })
    const products = await prisma.product.findMany({
      where: {
        categoryId: input.categoryId,
        id: { not: input.excludeProductId },
        status: 'ACTIVE',
        category: {
          status: 'ACTIVE'
        }
      },
      take: 4,
      orderBy: { sortWeight: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        mainImageUrl: true,
        translationsJson: true,
        skus: {
          select: { price: true },
        },
      },
    })

    const list = products.map(p => {
      // 聚合求出最低价格
      const minPrice = p.skus.length > 0 
        ? Math.min(...p.skus.map(s => s.price.toNumber())) 
        : 0

      return {
        id: p.id,
        name: resolveProductDisplayName(
          p.name,
          (p as { translationsJson?: unknown }).translationsJson,
          lang,
        ),
        slug: p.slug,
        mainImageUrl: p.mainImageUrl,
        minPrice: toUsdPrice(minPrice, exchangeRate)
      }
    })

    return { list }
  }
)

/**
 * 加入购物车（仅限 CUSTOMER）。支持单行或 lines 批量（一次 RPC）。
 */
export const addToCart = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: AddToCartInput): Promise<AddToCartOutput> => {
    const { userId } = getAuthContext()
    const lines = normalizeCartLines(input)
    if (lines.length === 0) {
      throw storefrontError('checkout.errors.qtyInvalid')
    }

    const skuIds = lines.map((line) => line.productSkuId)
    const skus = await prisma.productsku.findMany({
      where: { id: { in: skuIds } },
      include: {
        product: {
          include: {
            category: true,
            _count: { select: { skus: true } },
          },
        },
      },
    })
    const skuById = new Map(skus.map((sku) => [sku.id, sku]))

    for (const line of lines) {
      const sku = skuById.get(line.productSkuId)
      if (!sku) throw storefrontError('product.errors.skuMissing')
      if (sku.product.status !== 'ACTIVE' || sku.product.category.status !== 'ACTIVE') {
        throw storefrontError('product.errors.notPurchasable')
      }
      if (!isStorefrontQtyAllowed(sku.stock, line.quantity)) {
        throw storefrontError('product.errors.outOfStock')
      }
    }

    // 按商品聚合本请求数量，供混批起订量校验
    const requestQtyByProduct = new Map<string, number>()
    for (const line of lines) {
      const sku = skuById.get(line.productSkuId)!
      requestQtyByProduct.set(
        sku.productId,
        (requestQtyByProduct.get(sku.productId) || 0) + line.quantity,
      )
    }

    for (const line of lines) {
      const sku = skuById.get(line.productSkuId)!
      const productMinOrderQty = resolveProductMinOrderQty(sku.product.tradeInfoJson)
      const supportsMixedBatch = (sku.product._count?.skus || 0) > 1
      const skuMinOrderQty = resolveEffectiveSkuMinOrderQty(
        productMinOrderQty,
        sku.minOrderQty,
        { supportsMixedBatch },
      )
      if (line.quantity < skuMinOrderQty) {
        throw new Error(formatMinOrderQtyMessage(skuMinOrderQty))
      }
    }

    let cart = await prisma.cart.findUnique({
      where: { accountId: userId },
    })
    if (!cart) {
      cart = await prisma.cart.create({
        data: { account: { connect: { id: userId } } },
      })
    }

    const existingItems = await prisma.cartitem.findMany({
      where: {
        cartId: cart.id,
        productSkuId: { in: skuIds },
      },
      orderBy: { updatedAt: 'desc' },
    })
    const existingBySku = new Map<string, (typeof existingItems)[number]>()
    for (const item of existingItems) {
      if (!existingBySku.has(item.productSkuId)) {
        existingBySku.set(item.productSkuId, item)
      }
    }

    const productIds = Array.from(requestQtyByProduct.keys())
    const siblingAggs = await prisma.cartitem.groupBy({
      by: ['productId'],
      where: { cartId: cart.id, productId: { in: productIds } },
      _sum: { quantity: true },
    })
    const cartQtyByProduct = new Map(
      siblingAggs.map((row) => [row.productId, row._sum.quantity ?? 0]),
    )

    // 从购物车合计中去掉本批将覆盖/累加的现有行，再加本批数量
    for (const line of lines) {
      const existing = existingBySku.get(line.productSkuId)
      if (!existing) continue
      const sku = skuById.get(line.productSkuId)!
      cartQtyByProduct.set(
        sku.productId,
        Math.max(0, (cartQtyByProduct.get(sku.productId) || 0) - existing.quantity),
      )
    }

    for (const [productId, requestQty] of requestQtyByProduct) {
      const sku = skus.find((row) => row.productId === productId)!
      const productMinOrderQty = resolveProductMinOrderQty(sku.product.tradeInfoJson)
      const sameRequestSiblingQty =
        lines.length === 1
          ? Math.max(0, Math.floor(Number(input.sameRequestSiblingQty) || 0))
          : 0
      const totalProductQty =
        (cartQtyByProduct.get(productId) || 0) + requestQty + sameRequestSiblingQty
      if (totalProductQty < productMinOrderQty) {
        throw new Error(formatMinOrderQtyMessage(productMinOrderQty))
      }
    }

    for (const line of lines) {
      const sku = skuById.get(line.productSkuId)!
      const existing = existingBySku.get(line.productSkuId)
      if (existing && existing.quantity + line.quantity > sku.stock) {
        throw storefrontError('product.errors.outOfStock')
      }
    }

    await prisma.$transaction(
      lines.map((line) => {
        const sku = skuById.get(line.productSkuId)!
        const existing = existingBySku.get(line.productSkuId)
        if (existing) {
          return prisma.cartitem.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + line.quantity,
              status: 'VALID',
            },
          })
        }
        return prisma.cartitem.create({
          data: {
            cart: { connect: { id: cart!.id } },
            product: { connect: { id: sku.productId } },
            productSku: { connect: { id: sku.id } },
            quantity: line.quantity,
            status: 'VALID',
          },
        })
      }),
    )

    return { success: true }
  }),
)

/**
 * 按绝对值同步购物车中某 SKU 数量（行内 +/- 即时加购；0 则删除该项）
 */
export const setCartSkuQuantity = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: SetCartSkuQuantityInput): Promise<AddToCartOutput> => {
    const { userId } = getAuthContext()
    const targetQty = Math.max(0, Math.floor(Number(input.quantity) || 0))

    const sku = await prisma.productsku.findUnique({
      where: { id: input.productSkuId },
      include: {
        product: {
          include: { category: true },
        },
      },
    })

    if (!sku) {
      throw storefrontError('product.errors.skuMissing')
    }
    if (sku.product.status !== 'ACTIVE' || sku.product.category.status !== 'ACTIVE') {
      throw storefrontError('product.errors.notPurchasable')
    }

    let cart = await prisma.cart.findUnique({
      where: { accountId: userId },
    })

    if (!cart) {
      if (targetQty <= 0) {
        return { success: true }
      }
      cart = await prisma.cart.create({
        data: {
          account: { connect: { id: userId } },
        },
      })
    }

    const existingItem = await prisma.cartitem.findFirst({
      where: {
        cartId: cart.id,
        productSkuId: input.productSkuId,
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (targetQty <= 0) {
      if (existingItem) {
        await prisma.cartitem.delete({ where: { id: existingItem.id } })
      }
      return { success: true }
    }

    if (targetQty > sku.stock) {
      throw storefrontError('product.errors.outOfStock')
    }

    const productMinOrderQty = resolveProductMinOrderQty(sku.product.tradeInfoJson)
    const siblingSkuCount = await prisma.productsku.count({
      where: { productId: sku.productId },
    })
    const supportsMixedBatch = siblingSkuCount > 1
    const skuMinOrderQty = resolveEffectiveSkuMinOrderQty(
      productMinOrderQty,
      sku.minOrderQty,
      { supportsMixedBatch },
    )
    if (targetQty < skuMinOrderQty) {
      throw new Error(formatMinOrderQtyMessage(skuMinOrderQty))
    }

    const siblingQty = await prisma.cartitem.aggregate({
      where: {
        cartId: cart.id,
        productId: sku.productId,
        ...(existingItem ? { id: { not: existingItem.id } } : {}),
      },
      _sum: { quantity: true },
    })
    const totalProductQty = (siblingQty._sum.quantity ?? 0) + targetQty
    if (totalProductQty < productMinOrderQty) {
      throw new Error(formatMinOrderQtyMessage(productMinOrderQty))
    }

    if (existingItem) {
      await prisma.cartitem.update({
        where: { id: existingItem.id },
        data: {
          quantity: targetQty,
          status: 'VALID',
        },
      })
    } else {
      await prisma.cartitem.create({
        data: {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: sku.productId } },
          productSku: { connect: { id: sku.id } },
          quantity: targetQty,
          status: 'VALID',
        },
      })
    }

    return { success: true }
  }),
)
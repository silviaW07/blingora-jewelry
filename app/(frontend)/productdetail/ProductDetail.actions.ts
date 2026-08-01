'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/frontend/action_utils'

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
  price: number                 // data-from: productsku-price
  originalPrice: number | null  // data-from: productsku-originalPrice
  stock: number                 // data-from: productsku-stock
  stockStatus: StockStatus      // data-from: productsku-stockStatus
  attributeJson: SkuAttribute[] // data-from: productsku-attributeJson
  deliveryDays: number | null   // data-from: productsku-deliveryDays
  weightKg: number | null       // data-from: productsku-weightKg
  volumeM3: number | null       // data-from: productsku-volumeM3
}

export interface ProductDetailData {
  id: string                                   // data-from: product-id
  name: string                                 // data-from: product-name
  productCode: string                          // data-from: product-productCode
  status: ProductStatus                        // data-from: product-status
  mainImageUrl: string                         // data-from: product-mainImageUrl
  galleryJson: GalleryItem[]                   // data-from: product-galleryJson
  shortDescription: string | null              // data-from: product-shortDescription
  sellingPointsJson: SellingPointItem[] | null // data-from: product-sellingPointsJson
  detailContentJson: DetailContentItem[] | null // data-from: product-detailContentJson
  parameterJson: ParameterGroup[] | null       // data-from: product-parameterJson
  tradeInfoJson: TradeInfo | null              // data-from: product-tradeInfoJson
  faqJson: FaqItem[] | null                    // data-from: product-faqJson
  ratingAverage: number                        // data-from: product-ratingAverage
  ratingCount: number                          // data-from: product-ratingCount
  categoryId: string                           // data-from: product-categoryId
  category: CategoryData                       // data-from: category
  skus: ProductSkuData[]                       // data-from: productsku
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
}

export interface GetProductDetailOutput {
  product: ProductDetailData
}

export interface GetRelatedProductsInput {
  categoryId: string
  excludeProductId: string
}

export interface GetRelatedProductsOutput {
  list: RelatedProductItem[]
}

export interface AddToCartInput {
  productSkuId: string
  quantity: number
}

export interface AddToCartOutput {
  success: boolean
}

// ===== Actions =====

/**
 * 获取商品详情数据（允许 GUEST 及 CUSTOMER 访问，无需 token，故不使用 requireRole）
 * 包含状态信息，如果非 ACTIVE，前端将拦截不可购买状态。
 */
export const getProductDetail = withResult(
  async (input: GetProductDetailInput): Promise<GetProductDetailOutput> => {
    if (!input.productId && !input.slug) {
      throw new Error('缺少必要的商品标识')
    }

    const whereCondition = input.productId
      ? { id: input.productId }
      : { slug: input.slug! }

    const product = await prisma.product.findUnique({
      where: whereCondition,
      include: {
        category: true,
        skus: true
      }
    })

    if (!product) {
      throw new Error('未找到对应商品')
    }

    const detailData: ProductDetailData = {
      id: product.id,
      name: product.name,
      productCode: product.productCode,
      status: product.status as ProductStatus,
      mainImageUrl: product.mainImageUrl,
      galleryJson: (product.galleryJson as object) as GalleryItem[],
      shortDescription: product.shortDescription,
      sellingPointsJson: product.sellingPointsJson ? ((product.sellingPointsJson as object) as SellingPointItem[]) : null,
      detailContentJson: product.detailContentJson ? ((product.detailContentJson as object) as DetailContentItem[]) : null,
      parameterJson: product.parameterJson ? ((product.parameterJson as object) as ParameterGroup[]) : null,
      tradeInfoJson: product.tradeInfoJson ? ((product.tradeInfoJson as object) as TradeInfo) : null,
      faqJson: product.faqJson ? ((product.faqJson as object) as FaqItem[]) : null,
      ratingAverage: product.ratingAverage,
      ratingCount: product.ratingCount,
      categoryId: product.categoryId,
      category: {
        id: product.category.id,
        name: product.category.name,
        status: product.category.status as CategoryStatus
      },
      skus: product.skus.map(sku => ({
        id: sku.id,
        skuCode: sku.skuCode,
        imageUrl: sku.imageUrl,
        price: sku.price.toNumber(),
        originalPrice: sku.originalPrice ? sku.originalPrice.toNumber() : null,
        stock: sku.stock,
        stockStatus: sku.stockStatus as StockStatus,
        attributeJson: (sku.attributeJson as object) as SkuAttribute[],
        deliveryDays: sku.deliveryDays,
        weightKg: sku.weightKg ? sku.weightKg.toNumber() : null,
        volumeM3: sku.volumeM3 ? sku.volumeM3.toNumber() : null
      }))
    }

    return { product: detailData }
  }
)

/**
 * 获取相关推荐商品（同分类下 ACTIVE 的商品）
 */
export const getRelatedProducts = withResult(
  async (input: GetRelatedProductsInput): Promise<GetRelatedProductsOutput> => {
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
      include: {
        skus: {
          select: { price: true }
        }
      }
    })

    const list = products.map(p => {
      // 聚合求出最低价格
      const minPrice = p.skus.length > 0 
        ? Math.min(...p.skus.map(s => s.price.toNumber())) 
        : 0

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        mainImageUrl: p.mainImageUrl,
        minPrice
      }
    })

    return { list }
  }
)

/**
 * 加入购物车（仅限 CUSTOMER）
 */
export const addToCart = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: AddToCartInput): Promise<AddToCartOutput> => {
    const { userId } = getAuthContext()

    if (input.quantity <= 0) {
      throw new Error('加购数量必须大于0')
    }

    // 1. 查 SKU，并获取商品和分类的可见性状态
    const sku = await prisma.productsku.findUnique({
      where: { id: input.productSkuId },
      include: {
        product: {
          include: { category: true }
        }
      }
    })

    if (!sku) {
      throw new Error('商品SKU不存在')
    }
    if (sku.product.status !== 'ACTIVE' || sku.product.category.status !== 'ACTIVE') {
      throw new Error('该商品当前不可购买')
    }
    if (input.quantity > sku.stock) {
      throw new Error(`库存不足，当前仅剩 ${sku.stock} 件`)
    }

    // 2. 查找或创建用户购物车
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

    // 3. 查找是否已存在该购物车项
    const existingItem = await prisma.cartitem.findUnique({
      where: {
        cartId_productSkuId: {
          cartId: cart.id,
          productSkuId: input.productSkuId
        }
      }
    })

    // 4. 事务或者合并逻辑更新
    if (existingItem) {
      const newQuantity = existingItem.quantity + input.quantity
      if (newQuantity > sku.stock) {
        throw new Error(`加购后总量将超过可用库存，当前库存为 ${sku.stock} 件`)
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
          product: { connect: { id: sku.productId } },
          productSku: { connect: { id: sku.id } },
          quantity: input.quantity,
          status: 'VALID'
        }
      })
    }

    return { success: true }
  })
)

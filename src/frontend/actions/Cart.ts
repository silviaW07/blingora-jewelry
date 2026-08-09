'use server'

// ===== Enums =====

/** 购物车条目状态：有效(VALID) | 无效(INVALID) */
export type CartItemStatus = 'VALID' | 'INVALID'

/** 商品状态：草稿(DRAFT) | 上架(ACTIVE) | 下架(INACTIVE) */
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

/** 分类状态：激活(ACTIVE) | 停用(INACTIVE) */
export type CategoryStatus = 'ACTIVE' | 'INACTIVE'

// ===== Data Structures =====

export interface SkuAttribute {
  name?: string
  value?: string
}

export interface CartItemData {
  cartItemId: string      // data-from: cartitem-id
  productId: string       // data-from: cartitem-productId
  productSkuId: string    // data-from: cartitem-productSkuId
  productName: string     // data-from: product-name
  mainImageUrl: string    // data-from: product-mainImageUrl
  /** SKU/color thumbnail; empty when missing — UI falls back to mainImageUrl */
  imageUrl: string        // data-from: productsku-imageUrl
  skuAttributes: SkuAttribute[] // data-from: productsku-attributeJson
  /** discounted unit price (USD) */
  price: number
  /** original unit price before discounts (USD) */
  originalPrice: number
  quantity: number        // data-from: cartitem-quantity
  stock: number           // data-from: productsku-stock
  weightGram: number      // data-from: product-weightGram
  status: CartItemStatus  // data-from: cartitem-status
  invalidReason: string | null // aggregated
  /** discounted line subtotal (USD) */
  subtotal: number
  /** original line subtotal before discounts (USD) */
  originalSubtotal: number
}

export interface CartSummary {
  totalPrice: number      // aggregated
  shippingFee: number     // aggregated
  discount: number        // aggregated
  totalWeightGram: number // aggregated
  finalAmount: number     // aggregated
}

export interface RecommendedProductData {
  productId: string       // data-from: product-id
  name: string            // data-from: product-name
  mainImageUrl: string    // data-from: product-mainImageUrl
  priceMin: number        // aggregated
  ratingAverage: number   // data-from: product-ratingAverage
}

// ===== Input / Output =====

export interface GetCartDataInput {
  /** 语言码：en / zh / es（兼容 zh-CN） */
  lang?: string
}

export interface GetCartDataOutput {
  items: CartItemData[]
  summary: CartSummary
}

export interface UpdateQuantityInput {
  cartItemId: string
  quantity: number
}

export interface RemoveCartItemInput {
  cartItemId: string
}

export interface GetRecommendedInput {
  /** 语言码：en / es（店面不展示中文） */
  lang?: string
}

export interface GetRecommendedOutput {
  list: RecommendedProductData[]
}

// ===== Imports =====
import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole
} from '@/frontend/action_utils'
import { normalizeProductLang, resolveProductDisplayName } from '@/frontend/i18n/productTranslation'
import { pickFrontPricingCategoryCoeffs, resolveFrontRmbSellingPrice } from '@/shared/priceCoefficient'
import { getUsdExchangeRate, toUsdFromCny } from '@/shared/exchangeRate'
import { loadPricingPromotionConfig } from '@/shared/pricingPromotionConfig'
import { computeDiscounts } from '@/shared/pricingPromotionCalc'

const resolveProductMinOrderQty = (tradeInfoJson: unknown) => Math.max(1, Number((tradeInfoJson as any)?.minOrderQty ?? 0) || 1)
const resolveEffectiveSkuMinOrderQty = (productMinOrderQty: number, skuMinOrderQty: unknown) => {
  const raw = Number(skuMinOrderQty ?? 0)
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : productMinOrderQty
}

const isColorAttributeName = (name?: string | null) => {
  const normalized = String(name || '').trim().toLowerCase()
  return normalized === '颜色' || normalized === 'color' || normalized === 'colour'
}

/**
 * Prefer the cart-line SKU thumbnail; if empty (common for size variants),
 * reuse a sibling SKU image that shares the same color attribute.
 */
const resolveCartLineImageUrl = (
  lineSku: { imageUrl?: string | null; attributeJson?: unknown },
  siblingSkus: Array<{ imageUrl?: string | null; attributeJson?: unknown }>,
): string => {
  const own = String(lineSku.imageUrl || '').trim()
  if (own) return own

  const attrs = (Array.isArray(lineSku.attributeJson) ? lineSku.attributeJson : []) as Array<{
    name?: string
    value?: string
  }>
  const colorAttr = attrs.find((attr) => isColorAttributeName(attr?.name))
  const colorValue = String(colorAttr?.value || '').trim()
  const colorName = String(colorAttr?.name || '').trim()
  if (!colorValue || !colorName) return ''

  for (const sku of siblingSkus) {
    const url = String(sku.imageUrl || '').trim()
    if (!url) continue
    const skuAttrs = (Array.isArray(sku.attributeJson) ? sku.attributeJson : []) as Array<{
      name?: string
      value?: string
    }>
    const matchesColor = skuAttrs.some(
      (attr) =>
        String(attr?.name || '').trim() === colorName &&
        String(attr?.value || '').trim() === colorValue,
    )
    if (matchesColor) return url
  }

  return ''
}

// ===== Actions =====

/**
 * 获取当前用户的购物车数据
 * 包含状态有效性同步检查与金额汇总
 */
export const getCartData = requireRole([UserRole.CUSTOMER])(
  withResult(async (input?: GetCartDataInput): Promise<GetCartDataOutput> => {
    const { userId } = getAuthContext()
    const lang = normalizeProductLang(input?.lang)
    const [exchangeRate, pricingConfig] = await Promise.all([
      getUsdExchangeRate(prisma),
      loadPricingPromotionConfig(prisma),
    ])

    // 1. 获取或创建用户的购物车
    let cart = await prisma.cart.findUnique({
      where: { accountId: userId }
    })
    if (!cart) {
      cart = await prisma.cart.create({
        data: { account: { connect: { id: userId } } }
      })
    }

    // 2. 加载购物车条目及其关联商品/SKU数据
    const rawItems = await prisma.cartitem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            status: true,
            mainImageUrl: true,
            weightGram: true,
            costPrice: true,
            tradeInfoJson: true,
            translationsJson: true,
            category: {
              select: {
                status: true,
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
              select: {
                imageUrl: true,
                attributeJson: true,
              },
            },
          }
        },
        productSku: {
          select: {
            id: true,
            price: true,
            stock: true,
            imageUrl: true,
            attributeJson: true,
            weightKg: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const productQtyMap = new Map<string, number>()
    for (const item of rawItems) {
      productQtyMap.set(item.productId, (productQtyMap.get(item.productId) || 0) + item.quantity)
    }

    const updates: any[] = []
    let originalSubtotalUsd = 0
    let totalWeightGram = 0
    const items: CartItemData[] = []
    const discountLinesInput: Array<{
      lineId: string
      productId: string
      minOrderQty: number
      quantity: number
      unitPriceUsd: number
      valid: boolean
    }> = []

    // 3. 遍历并重新计算每个条目的有效性状态
    for (const item of rawItems) {
      const pStatus = item.product.status
      const cStatus = item.product.category?.status
      const stock = item.productSku.stock
      const productMinOrderQty = resolveProductMinOrderQty(item.product.tradeInfoJson)
      const effectiveSkuMinOrderQty = resolveEffectiveSkuMinOrderQty(productMinOrderQty, null)
      const totalProductQty = productQtyMap.get(item.productId) || 0

      let isValid = true
      let invalidReason: string | null = null

      if (pStatus !== 'ACTIVE' || cStatus !== 'ACTIVE') {
        isValid = false
        invalidReason = 'Product or category unavailable'
      } else if (stock < item.quantity) {
        isValid = false
        invalidReason = 'Insufficient stock'
      } else if (item.quantity < effectiveSkuMinOrderQty) {
        isValid = false
        invalidReason = `Minimum order quantity is ${effectiveSkuMinOrderQty}`
      } else if (totalProductQty < productMinOrderQty) {
        isValid = false
        invalidReason = `Mixed MOQ for this product is ${productMinOrderQty}`
      }

      const expectedStatus: CartItemStatus = isValid ? 'VALID' : 'INVALID'

      // 如果状态发生变化，则记录到更新队列同步至数据库
      if (item.status !== expectedStatus) {
        updates.push(
          prisma.cartitem.update({
            where: { id: item.id },
            data: { status: expectedStatus }
          })
        )
      }

      const pricingCoeffs = pickFrontPricingCategoryCoeffs({
        primary: item.product.category,
        relations: (item.product.relationCategories || []).map((rel) => rel.category),
      })
      const priceRmb = resolveFrontRmbSellingPrice({
        skuPriceRmb: item.productSku.price.toNumber(),
        costPrice: item.product.costPrice,
        ...pricingCoeffs,
      })
      const unitPriceUsd = toUsdFromCny(priceRmb, exchangeRate)
      const productWeightRaw = item.product.weightGram
      const productWeight =
        productWeightRaw != null && typeof (productWeightRaw as { toNumber?: () => number }).toNumber === 'function'
          ? (productWeightRaw as { toNumber: () => number }).toNumber()
          : Number(productWeightRaw)
      const skuWeightRaw = item.productSku.weightKg
      const skuWeightGram =
        skuWeightRaw != null && typeof (skuWeightRaw as { toNumber?: () => number }).toNumber === 'function'
          ? (skuWeightRaw as { toNumber: () => number }).toNumber() * 1000
          : Number(skuWeightRaw) * 1000
      // 优先商品级重量(g)，其次 SKU 重量(kg→g)；按数量自动累计
      const unitWeightGram =
        Number.isFinite(productWeight) && productWeight > 0
          ? productWeight
          : Number.isFinite(skuWeightGram) && skuWeightGram > 0
            ? skuWeightGram
            : 0
      const lineWeightGram = unitWeightGram * item.quantity
      if (isValid) {
        originalSubtotalUsd += unitPriceUsd * item.quantity
        totalWeightGram += lineWeightGram
      }

      // 解析 Json
      const rawAttrs = (item.productSku.attributeJson as unknown as any[]) || []
      const skuAttributes: SkuAttribute[] = rawAttrs.map(attr => ({
        name: attr?.name || '',
        value: attr?.value || ''
      }))

      const skuImageUrl = resolveCartLineImageUrl(
        item.productSku,
        item.product.skus || [],
      )

      items.push({
        cartItemId: item.id,
        productId: item.product.id,
        productSkuId: item.productSku.id,
        productName: resolveProductDisplayName(
          item.product.name,
          (item.product as { translationsJson?: unknown }).translationsJson,
          lang,
        ),
        mainImageUrl: item.product.mainImageUrl,
        imageUrl: skuImageUrl,
        skuAttributes,
        price: unitPriceUsd,
        originalPrice: unitPriceUsd,
        quantity: item.quantity,
        stock,
        weightGram: unitWeightGram,
        status: expectedStatus,
        invalidReason,
        subtotal: unitPriceUsd * item.quantity,
        originalSubtotal: unitPriceUsd * item.quantity,
      })

      discountLinesInput.push({
        lineId: item.id,
        productId: item.product.id,
        minOrderQty: productMinOrderQty,
        quantity: item.quantity,
        unitPriceUsd,
        valid: isValid,
      })
    }

    // 4. 批量执行可能的状态更新
    if (updates.length > 0) {
      await prisma.$transaction(updates)
    }

    // 5. 计算折扣（首单/老客/批发/满减）
    const paidOrder = await prisma.orderrecord.findFirst({
      where: { userId, status: 'PAID' },
      select: { id: true },
    })
    const isFirstOrderEligible = !paidOrder
    const isLoyalCustomer = Boolean(paidOrder)

    const discountResult = computeDiscounts({
      config: pricingConfig,
      isFirstOrderEligible,
      isLoyalCustomer,
      lines: discountLinesInput,
    })

    for (const item of items) {
      const effectiveUnit = discountResult.lineEffectiveUnitPrice[item.cartItemId]
      if (!Number.isFinite(effectiveUnit)) continue
      item.originalPrice = item.price
      item.originalSubtotal = item.subtotal
      item.price = effectiveUnit
      item.subtotal = Math.round(effectiveUnit * item.quantity * 100) / 100
    }

    const discountAmount = discountResult.totalDiscountUsd
    const finalAmount = Math.round((originalSubtotalUsd - discountAmount) * 100) / 100

    // 6. 构造并返回汇总信息
    const summary: CartSummary = {
      totalPrice: Math.round(originalSubtotalUsd * 100) / 100,
      shippingFee: 0, // 暂无全局运费设定，给前端展示占位
      discount: discountAmount,
      totalWeightGram,
      finalAmount
    }

    return { items, summary }
  })
)

/**
 * 更新购物车商品数量
 */
export const updateCartItemQuantity = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: UpdateQuantityInput): Promise<boolean> => {
    const { userId } = getAuthContext()
    const { cartItemId, quantity } = input

    // 防御校验：数量小于等于 0 走删除逻辑
    if (quantity <= 0) {
      await prisma.cartitem.deleteMany({
        where: { id: cartItemId, cart: { accountId: userId } }
      })
      return true
    }

    const item = await prisma.cartitem.findFirst({
      where: { id: cartItemId, cart: { accountId: userId } },
      include: {
        product: { select: { id: true, status: true, tradeInfoJson: true, category: { select: { status: true } } } },
        productSku: { select: { id: true, stock: true } }
      }
    })

    if (!item) {
      throw new Error('购物车条目不存在或无权访问')
    }

    if (quantity > item.productSku.stock) {
      throw new Error(`更新失败，库存不足（当前库存: ${item.productSku.stock}）`)
    }

    const siblingItems = await prisma.cartitem.findMany({
      where: {
        cart: { accountId: userId },
        productId: item.product.id,
      },
      select: {
        id: true,
        productSkuId: true,
        quantity: true,
      }
    })
    const nextProductQty = siblingItems.reduce((sum, sibling) => {
      if (sibling.id === cartItemId) return sum + quantity
      return sum + sibling.quantity
    }, 0)
    const productMinOrderQty = resolveProductMinOrderQty(item.product.tradeInfoJson)
    const effectiveSkuMinOrderQty = resolveEffectiveSkuMinOrderQty(productMinOrderQty, null)

    // 重新判定是否符合 VALID
    const isProductActive = item.product.status === 'ACTIVE'
    const isCategoryActive = item.product.category?.status === 'ACTIVE'
    const newStatus: CartItemStatus = (isProductActive && isCategoryActive && item.productSku.stock >= quantity && quantity >= effectiveSkuMinOrderQty && nextProductQty >= productMinOrderQty) 
      ? 'VALID' 
      : 'INVALID'

    if (!isProductActive || !isCategoryActive) {
      throw new Error('该商品已下架，不允许修改数量')
    }

    await prisma.cartitem.update({
      where: { id: cartItemId },
      data: {
        quantity,
        status: newStatus
      }
    })

    return true
  })
)

/**
 * 逐项删除购物车商品
 */
export const removeCartItem = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: RemoveCartItemInput): Promise<boolean> => {
    const { userId } = getAuthContext()
    
    await prisma.cartitem.deleteMany({
      where: {
        id: input.cartItemId,
        cart: { accountId: userId }
      }
    })

    return true
  })
)

/**
 * 清空整个购物车（需二次确认逻辑在前端处理）
 */
export const clearCart = requireRole([UserRole.CUSTOMER])(
  withResult(async (): Promise<boolean> => {
    const { userId } = getAuthContext()
    
    await prisma.cartitem.deleteMany({
      where: { cart: { accountId: userId } }
    })

    return true
  })
)

/**
 * 批量处理/清理所有失效商品
 */
export const removeInvalidCartItems = requireRole([UserRole.CUSTOMER])(
  withResult(async (): Promise<boolean> => {
    const { userId } = getAuthContext()

    // 仅删除在缓存中标记为 INVALID 的数据。
    // 为了保证一致性，前端调用此操作前应当已经通过 getCartData 刷新过 DB 状态
    await prisma.cartitem.deleteMany({
      where: {
        cart: { accountId: userId },
        status: 'INVALID'
      }
    })

    return true
  })
)

/**
 * 获取购物车辅助推荐商品列表（标题按 lang 解析，EN/ES 不返回中文名）
 */
export const getRecommendedProducts = requireRole([UserRole.CUSTOMER])(
  withResult(async (input?: GetRecommendedInput): Promise<GetRecommendedOutput> => {
    const lang = normalizeProductLang(input?.lang)
    // 查找有效商品，权重排序
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        category: { status: 'ACTIVE' }
      },
      select: {
        id: true,
        name: true,
        mainImageUrl: true,
        ratingAverage: true,
        translationsJson: true,
        skus: {
          select: { price: true }
        }
      },
      orderBy: [
        { sortWeight: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 8
    })

    const list: RecommendedProductData[] = products.map(p => {
      // 获取最低SKU价格
      let priceMin = 0
      if (p.skus && p.skus.length > 0) {
        priceMin = Math.min(...p.skus.map(s => s.price.toNumber()))
      }

      return {
        productId: p.id,
        name: resolveProductDisplayName(p.name, p.translationsJson, lang),
        mainImageUrl: p.mainImageUrl,
        ratingAverage: p.ratingAverage,
        priceMin
      }
    })

    return { list }
  })
)
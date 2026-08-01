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
  skuAttributes: SkuAttribute[] // data-from: productsku-attributeJson
  price: number           // data-from: productsku-price
  quantity: number        // data-from: cartitem-quantity
  stock: number           // data-from: productsku-stock
  weightGram: number      // data-from: product-weightGram
  status: CartItemStatus  // data-from: cartitem-status
  invalidReason: string | null // aggregated
  subtotal: number        // aggregated
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
import { pickFrontPricingCategoryCoeffs, resolveFrontRmbSellingPrice } from '@/shared/priceCoefficient'

const resolveProductMinOrderQty = (tradeInfoJson: unknown) => Math.max(1, Number((tradeInfoJson as any)?.minOrderQty ?? 0) || 1)
const resolveEffectiveSkuMinOrderQty = (productMinOrderQty: number, skuMinOrderQty: unknown) => {
  const raw = Number(skuMinOrderQty ?? 0)
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : productMinOrderQty
}

// ===== Actions =====

/**
 * 获取当前用户的购物车数据
 * 包含状态有效性同步检查与金额汇总
 */
export const getCartData = requireRole([UserRole.CUSTOMER])(
  withResult(async (): Promise<GetCartDataOutput> => {
    const { userId } = getAuthContext()

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
          }
        },
        productSku: {
          select: {
            id: true,
            price: true,
            stock: true,
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
    let totalPrice = 0
    let totalWeightGram = 0
    const items: CartItemData[] = []

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
        invalidReason = '商品或分类已失效'
      } else if (stock < item.quantity) {
        isValid = false
        invalidReason = '库存不足'
      } else if (item.quantity < effectiveSkuMinOrderQty) {
        isValid = false
        invalidReason = `当前规格起订量为 ${effectiveSkuMinOrderQty}`
      } else if (totalProductQty < productMinOrderQty) {
        isValid = false
        invalidReason = `该商品混批起订量为 ${productMinOrderQty}`
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
      const priceNum = resolveFrontRmbSellingPrice({
        skuPriceRmb: item.productSku.price.toNumber(),
        costPrice: item.product.costPrice,
        ...pricingCoeffs,
      })
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
        totalPrice += priceNum * item.quantity
        totalWeightGram += lineWeightGram
      }

      // 解析 Json
      const rawAttrs = (item.productSku.attributeJson as unknown as any[]) || []
      const skuAttributes: SkuAttribute[] = rawAttrs.map(attr => ({
        name: attr?.name || '',
        value: attr?.value || ''
      }))

      items.push({
        cartItemId: item.id,
        productId: item.product.id,
        productSkuId: item.productSku.id,
        productName: item.product.name,
        mainImageUrl: item.product.mainImageUrl,
        skuAttributes,
        price: priceNum,
        quantity: item.quantity,
        stock,
        weightGram: unitWeightGram,
        status: expectedStatus,
        invalidReason,
        subtotal: priceNum * item.quantity
      })
    }

    // 4. 批量执行可能的状态更新
    if (updates.length > 0) {
      await prisma.$transaction(updates)
    }

    // 5. 构造并返回汇总信息
    const summary: CartSummary = {
      totalPrice,
      shippingFee: 0, // 暂无全局运费设定，给前端展示占位
      discount: 0,    // 暂无全局折扣设定，给前端展示占位
      totalWeightGram,
      finalAmount: totalPrice
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
 * 获取购物车辅助推荐商品列表
 */
export const getRecommendedProducts = requireRole([UserRole.CUSTOMER])(
  withResult(async (): Promise<GetRecommendedOutput> => {
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
        name: p.name,
        mainImageUrl: p.mainImageUrl,
        ratingAverage: p.ratingAverage,
        priceMin
      }
    })

    return { list }
  })
)
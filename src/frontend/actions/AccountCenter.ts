'use server'

import prisma from '@/tools/prisma'
import {
  requireRole,
  getAuthContext,
  withResult,
  UserRole,
} from '@/frontend/action_utils'

// ===== Types =====

export type CustomerOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface CustomerProfile {
  userId: string
  account: string
  username: string
  email: string
  phone: string
  avatarUrl: string
  preferredLocale: string
  countryCode: string
  countryName: string
}

export interface CustomerAddress {
  addressId: string
  recipientName: string
  phone: string
  countryCode: string
  countryName: string
  stateName: string
  cityName: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  isDefault: boolean
}

export interface CustomerOrderItem {
  itemId: string
  productId: string
  productSkuId: string
  productName: string
  skuCode: string
  materialLabel: string
  sizeLabel: string
  /** SKU 缩略图；优先于商品主图 */
  imageUrl: string
  mainImageUrl: string
  quantity: number
  unitPrice: number
  lineAmount: number
}

export type CustomerOrderShipMethod = 'STANDARD' | 'EXPRESS'

export interface CustomerOrderSummary {
  orderId: string
  orderNo: string
  status: CustomerOrderStatus
  currencyCode: string
  totalAmount: number
  paymentMethod: string
  shipMethod: CustomerOrderShipMethod
  trackingCarrier: string
  trackingNumber: string
  totalWeightGrams: number
  internalNote: string
  createdAt: string
  itemCount: number
  items: CustomerOrderItem[]
}

export type ReorderSkipReason =
  | 'SKU_NOT_FOUND'
  | 'PRODUCT_UNAVAILABLE'
  | 'OUT_OF_STOCK'
  | 'INSUFFICIENT_STOCK'
  | 'MIN_ORDER_CHANGED'

export interface ReorderSkippedLine {
  itemId: string
  productName: string
  skuCode: string
  quantity: number
  reason: ReorderSkipReason
  availableStock?: number
  minimumQuantity?: number
}

export interface ReorderCustomerOrderOutput {
  addedLineCount: number
  addedQuantity: number
  skipped: ReorderSkippedLine[]
}

export interface UpdateCustomerProfileInput {
  username: string
  phone?: string
  avatarUrl?: string
  preferredLocale?: string
}

export interface SaveCustomerAddressInput {
  addressId?: string
  recipientName: string
  phone?: string
  countryCode: string
  countryName: string
  stateName?: string
  cityName?: string
  addressLine1: string
  addressLine2?: string
  postalCode?: string
  isDefault?: boolean
}

export interface DeleteCustomerAddressInput {
  addressId: string
}

export interface SetDefaultCustomerAddressInput {
  addressId: string
}

const toNum = (value: { toNumber?: () => number } | number | null | undefined) => {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value.toNumber === 'function') return value.toNumber()
  return Number(value) || 0
}

const customerOrderInclude = {
  items: {
    select: {
      id: true,
      productId: true,
      productSkuId: true,
      productName: true,
      skuCode: true,
      materialLabel: true,
      sizeLabel: true,
      quantity: true,
      unitPrice: true,
      lineAmount: true,
      product: {
        select: { weightGram: true, mainImageUrl: true },
      },
      productSku: {
        select: { imageUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

const mapCustomerOrder = (row: any): CustomerOrderSummary => ({
  orderId: row.id,
  orderNo: row.orderNo,
  status: row.status as CustomerOrderStatus,
  currencyCode: row.currencyCode,
  totalAmount: toNum(row.totalAmount),
  paymentMethod: row.paymentMethod,
  shipMethod: row.shipMethod as CustomerOrderShipMethod,
  trackingCarrier: row.trackingCarrier || '',
  trackingNumber: row.trackingNumber || '',
  totalWeightGrams: Math.round(
    row.items.reduce((sum: number, item: any) => (
      sum + toNum(item.product?.weightGram) * item.quantity
    ), 0) * 100,
  ) / 100,
  // This is the same field edited by backend updateOrderRemark. Do not expose order logs or orderrecord.note.
  internalNote: row.internalNote || '',
  createdAt: row.createdAt.toISOString(),
  itemCount: row.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
  items: row.items.map((item: any) => ({
    itemId: item.id,
    productId: item.productId,
    productSkuId: item.productSkuId,
    productName: item.productName,
    skuCode: item.skuCode,
    materialLabel: item.materialLabel || '',
    sizeLabel: item.sizeLabel || '',
    imageUrl: item.productSku?.imageUrl || '',
    mainImageUrl: item.product?.mainImageUrl || '',
    quantity: item.quantity,
    unitPrice: toNum(item.unitPrice),
    lineAmount: toNum(item.lineAmount),
  })),
})

const resolveProductMinOrderQty = (tradeInfoJson: unknown) =>
  Math.max(1, Number((tradeInfoJson as any)?.minOrderQty ?? 0) || 1)

/**
 * 读取当前登录客户的个人资料
 */
export const getCustomerProfile = requireRole([UserRole.CUSTOMER])(
  withResult(async (): Promise<CustomerProfile> => {
    const { userId } = getAuthContext()
    const user = await prisma.sysuser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        account: true,
        username: true,
        email: true,
        phone: true,
        avatarUrl: true,
        preferredLocale: true,
        countryCode: true,
        countryName: true,
      },
    })
    if (!user) throw new Error('用户不存在')
    return {
      userId: user.id,
      account: user.account,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      preferredLocale: user.preferredLocale || 'en',
      countryCode: user.countryCode || '',
      countryName: user.countryName || '',
    }
  }),
)

/**
 * 更新客户个人资料（姓名、手机、头像等）
 */
export const updateCustomerProfile = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: UpdateCustomerProfileInput): Promise<CustomerProfile> => {
    const { userId } = getAuthContext()
    const username = (input.username || '').trim()
    if (!username) throw new Error('请填写姓名')

    const user = await prisma.sysuser.update({
      where: { id: userId },
      data: {
        username,
        phone: (input.phone || '').trim() || null,
        avatarUrl: (input.avatarUrl || '').trim() || null,
        preferredLocale: (input.preferredLocale || '').trim() || null,
      },
      select: {
        id: true,
        account: true,
        username: true,
        email: true,
        phone: true,
        avatarUrl: true,
        preferredLocale: true,
        countryCode: true,
        countryName: true,
      },
    })

    return {
      userId: user.id,
      account: user.account,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      preferredLocale: user.preferredLocale || 'en',
      countryCode: user.countryCode || '',
      countryName: user.countryName || '',
    }
  }),
)

/**
 * 列出当前客户的收货地址
 */
export const listCustomerAddresses = requireRole([UserRole.CUSTOMER])(
  withResult(async (): Promise<{ list: CustomerAddress[] }> => {
    const { userId } = getAuthContext()
    const rows = await prisma.useraddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })
    return {
      list: rows.map((row) => ({
        addressId: row.id,
        recipientName: row.recipientName,
        phone: row.phone || '',
        countryCode: row.countryCode,
        countryName: row.countryName,
        stateName: row.stateName || '',
        cityName: row.cityName || '',
        addressLine1: row.addressLine1,
        addressLine2: row.addressLine2 || '',
        postalCode: row.postalCode || '',
        isDefault: row.isDefault,
      })),
    }
  }),
)

/**
 * 新增或更新收货地址
 */
export const saveCustomerAddress = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: SaveCustomerAddressInput): Promise<CustomerAddress> => {
    const { userId } = getAuthContext()
    const recipientName = (input.recipientName || '').trim()
    const countryCode = (input.countryCode || '').trim()
    const countryName = (input.countryName || '').trim()
    const addressLine1 = (input.addressLine1 || '').trim()
    if (!recipientName) throw new Error('请填写收件人')
    if (!countryCode || !countryName) throw new Error('请填写国家/地区')
    if (!addressLine1) throw new Error('请填写详细地址')

    const payload = {
      recipientName,
      phone: (input.phone || '').trim() || null,
      countryCode,
      countryName,
      stateName: (input.stateName || '').trim() || null,
      cityName: (input.cityName || '').trim() || null,
      addressLine1,
      addressLine2: (input.addressLine2 || '').trim() || null,
      postalCode: (input.postalCode || '').trim() || null,
      isDefault: Boolean(input.isDefault),
    }

    const saved = await prisma.$transaction(async (tx) => {
      if (payload.isDefault) {
        await tx.useraddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        })
      }

      if (input.addressId) {
        const existing = await tx.useraddress.findFirst({
          where: { id: input.addressId, userId },
        })
        if (!existing) throw new Error('地址不存在或无权修改')
        return tx.useraddress.update({
          where: { id: input.addressId },
          data: payload,
        })
      }

      const count = await tx.useraddress.count({ where: { userId } })
      return tx.useraddress.create({
        data: {
          ...payload,
          isDefault: count === 0 ? true : payload.isDefault,
          user: { connect: { id: userId } },
        },
      })
    })

    return {
      addressId: saved.id,
      recipientName: saved.recipientName,
      phone: saved.phone || '',
      countryCode: saved.countryCode,
      countryName: saved.countryName,
      stateName: saved.stateName || '',
      cityName: saved.cityName || '',
      addressLine1: saved.addressLine1,
      addressLine2: saved.addressLine2 || '',
      postalCode: saved.postalCode || '',
      isDefault: saved.isDefault,
    }
  }),
)

/**
 * 将当前客户的一条地址设为默认；校验归属并在同一事务中取消其他默认地址。
 */
export const setDefaultCustomerAddress = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: SetDefaultCustomerAddressInput): Promise<{ success: true; addressId: string }> => {
    const { userId } = getAuthContext()
    const addressId = (input.addressId || '').trim()
    if (!addressId) throw new Error('缺少地址标识')

    await prisma.$transaction(async (tx) => {
      const owned = await tx.useraddress.findFirst({
        where: { id: addressId, userId },
        select: { id: true },
      })
      if (!owned) throw new Error('地址不存在或无权修改')

      await tx.useraddress.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      })
      await tx.useraddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      })
    })

    return { success: true, addressId }
  }),
)

/**
 * 删除收货地址
 */
export const deleteCustomerAddress = requireRole([UserRole.CUSTOMER])(
  withResult(async (input: DeleteCustomerAddressInput): Promise<{ success: boolean }> => {
    const { userId } = getAuthContext()
    const existing = await prisma.useraddress.findFirst({
      where: { id: input.addressId, userId },
    })
    if (!existing) throw new Error('地址不存在或无权删除')

    await prisma.useraddress.delete({ where: { id: input.addressId } })

    if (existing.isDefault) {
      const next = await prisma.useraddress.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      })
      if (next) {
        await prisma.useraddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        })
      }
    }

    return { success: true }
  }),
)

/**
 * 列出当前客户的历史订单
 */
export const listCustomerOrders = requireRole([UserRole.CUSTOMER])(
  withResult(async (): Promise<{ list: CustomerOrderSummary[] }> => {
    const { userId } = getAuthContext()
    const rows = await prisma.orderrecord.findMany({
      where: { userId },
      include: customerOrderInclude,
      orderBy: { createdAt: 'desc' },
    })

    return { list: rows.map(mapCustomerOrder) }
  }),
)

/**
 * 读取当前客户的一笔订单详情。归属校验在查询条件中完成。
 */
export const getCustomerOrderDetail = requireRole([UserRole.CUSTOMER])(
  withResult(async (orderId: string): Promise<CustomerOrderSummary> => {
    const { userId } = getAuthContext()
    const row = await prisma.orderrecord.findFirst({
      where: { id: (orderId || '').trim(), userId },
      include: customerOrderInclude,
    })
    if (!row) throw new Error('订单不存在或无权访问')
    return mapCustomerOrder(row)
  }),
)

/**
 * 将当前客户历史订单中的仍可购买规格重新加入购物车。
 * 只按原 productSkuId 与原数量加购；失效行会被跳过并返回原因。
 */
export const reorderCustomerOrder = requireRole([UserRole.CUSTOMER])(
  withResult(async (orderId: string): Promise<ReorderCustomerOrderOutput> => {
    const { userId } = getAuthContext()
    const normalizedOrderId = (orderId || '').trim()
    if (!normalizedOrderId) throw new Error('缺少订单标识')

    const order = await prisma.orderrecord.findFirst({
      where: { id: normalizedOrderId, userId },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            productId: true,
            productSkuId: true,
            productName: true,
            skuCode: true,
            quantity: true,
            engravingText: true,
            engravingFont: true,
            giftWrapSelected: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!order) throw new Error('订单不存在或无权访问')

    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { accountId: userId },
        update: {},
        create: { accountId: userId },
      })
      const skuIds = [...new Set(order.items.map((item) => item.productSkuId))]
      const skus = await tx.productsku.findMany({
        where: { id: { in: skuIds } },
        select: {
          id: true,
          productId: true,
          stock: true,
          stockStatus: true,
          minOrderQty: true,
          product: {
            select: {
              status: true,
              tradeInfoJson: true,
              category: { select: { status: true } },
            },
          },
        },
      })
      const skuById = new Map(skus.map((sku) => [sku.id, sku]))
      const currentItems = await tx.cartitem.findMany({
        where: { cartId: cart.id },
        select: {
          id: true,
          productId: true,
          productSkuId: true,
          engravingText: true,
          engravingFont: true,
          quantity: true,
        },
      })
      const keyOf = (item: {
        productSkuId: string
        engravingText?: string | null
        engravingFont?: string | null
      }) => `${item.productSkuId}\u0000${item.engravingText || ''}\u0000${item.engravingFont || ''}`
      const currentByKey = new Map(currentItems.map((item) => [keyOf(item), item]))
      const currentProductQty = new Map<string, number>()
      for (const item of currentItems) {
        currentProductQty.set(item.productId, (currentProductQty.get(item.productId) || 0) + item.quantity)
      }

      const skipped: ReorderSkippedLine[] = []
      const eligible: typeof order.items = []
      const pendingProductQty = new Map<string, number>()
      const pendingKeyQty = new Map<string, number>()

      for (const item of order.items) {
        const sku = skuById.get(item.productSkuId)
        const skip = (reason: ReorderSkipReason, extra?: Partial<ReorderSkippedLine>) => {
          skipped.push({
            itemId: item.id,
            productName: item.productName,
            skuCode: item.skuCode,
            quantity: item.quantity,
            reason,
            ...extra,
          })
        }
        if (!sku) {
          skip('SKU_NOT_FOUND')
          continue
        }
        if (sku.product.status !== 'ACTIVE' || sku.product.category.status !== 'ACTIVE') {
          skip('PRODUCT_UNAVAILABLE')
          continue
        }
        if (sku.stockStatus === 'OUT_OF_STOCK' || sku.stock <= 0) {
          skip('OUT_OF_STOCK', { availableStock: Math.max(0, sku.stock) })
          continue
        }
        const itemKey = keyOf(item)
        const existingQty = currentByKey.get(itemKey)?.quantity || 0
        const reservedQty = pendingKeyQty.get(itemKey) || 0
        const nextQuantity = existingQty + reservedQty + item.quantity
        if (nextQuantity > sku.stock) {
          skip('INSUFFICIENT_STOCK', {
            availableStock: Math.max(0, sku.stock - existingQty - reservedQty),
          })
          continue
        }
        const productMin = resolveProductMinOrderQty(sku.product.tradeInfoJson)
        const skuMin = Math.max(1, Number(sku.minOrderQty || productMin))
        if (nextQuantity < skuMin) {
          skip('MIN_ORDER_CHANGED', { minimumQuantity: skuMin })
          continue
        }
        eligible.push(item)
        pendingKeyQty.set(itemKey, reservedQty + item.quantity)
        pendingProductQty.set(item.productId, (pendingProductQty.get(item.productId) || 0) + item.quantity)
      }

      const productsBelowMinimum = new Map<string, number>()
      for (const item of eligible) {
        const sku = skuById.get(item.productSkuId)!
        const minimum = resolveProductMinOrderQty(sku.product.tradeInfoJson)
        const total = (currentProductQty.get(item.productId) || 0) + (pendingProductQty.get(item.productId) || 0)
        if (total < minimum) productsBelowMinimum.set(item.productId, minimum)
      }

      let addedLineCount = 0
      let addedQuantity = 0
      for (const item of eligible) {
        const productMinimum = productsBelowMinimum.get(item.productId)
        if (productMinimum) {
          skipped.push({
            itemId: item.id,
            productName: item.productName,
            skuCode: item.skuCode,
            quantity: item.quantity,
            reason: 'MIN_ORDER_CHANGED',
            minimumQuantity: productMinimum,
          })
          continue
        }
        const key = keyOf(item)
        const existing = currentByKey.get(key)
        if (existing) {
          await tx.cartitem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity, status: 'VALID' },
          })
          existing.quantity += item.quantity
        } else {
          const created = await tx.cartitem.create({
            data: {
              cartId: cart.id,
              productId: item.productId,
              productSkuId: item.productSkuId,
              quantity: item.quantity,
              engravingText: item.engravingText,
              engravingFont: item.engravingFont,
              giftWrapSelected: item.giftWrapSelected,
              status: 'VALID',
            },
            select: {
              id: true,
              productId: true,
              productSkuId: true,
              engravingText: true,
              engravingFont: true,
              quantity: true,
            },
          })
          currentByKey.set(key, created)
        }
        addedLineCount += 1
        addedQuantity += item.quantity
      }

      return { addedLineCount, addedQuantity, skipped }
    })
  }),
)
